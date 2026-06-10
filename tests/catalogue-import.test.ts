// ============================================================
// Tests — Catalogue Import (Phase 4)
// ============================================================
// Pure-logic coverage: ZAR price parsing, AI budget planning,
// draft assessment, duplicate similarity, review ordering,
// draft→product mapping, and model response normalization.
// ============================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseZarAmount, parseZarPriceRange } from "@/lib/imports/parse-prices";
import {
  planAiBudget,
  assessDraft,
  titleSimilarity,
  draftSortWeight,
  DUPLICATE_SIMILARITY_THRESHOLD,
} from "@/lib/imports/import-logic";
import { buildProductPlan, isMappingError } from "@/lib/imports/publish-mapper";
import { normalizeImportDraftResponse } from "@/lib/ai/import-draft";

// ── ZAR price parsing (spec §5B formats) ────────────────────

describe("parseZarAmount", () => {
  it("parses plain and prefixed amounts", () => {
    assert.equal(parseZarAmount("R280"), 28000);
    assert.equal(parseZarAmount("280"), 28000);
    assert.equal(parseZarAmount("R 1 500"), 150000);
    assert.equal(parseZarAmount("R1,500"), 150000);
    assert.equal(parseZarAmount("R1500.50"), 150050);
  });

  it("rejects junk and out-of-range values", () => {
    assert.equal(parseZarAmount("S-XXL"), null);
    assert.equal(parseZarAmount("0.50"), null); // under R1
    assert.equal(parseZarAmount("99999999"), null); // over R1m
    assert.equal(parseZarAmount(""), null);
  });
});

describe("parseZarPriceRange", () => {
  it("extracts a single price from a typical caption", () => {
    const result = parseZarPriceRange("Quality hoodies 🔥 R280, sizes S–XXL, black/grey/navy");
    assert.deepEqual(result, { minCents: 28000, maxCents: 28000 });
  });

  it("parses ranges with en-dash, hyphen, and 'to'", () => {
    assert.deepEqual(parseZarPriceRange("R280–350"), { minCents: 28000, maxCents: 35000 });
    assert.deepEqual(parseZarPriceRange("R280-350"), { minCents: 28000, maxCents: 35000 });
    assert.deepEqual(parseZarPriceRange("R280 to R350"), { minCents: 28000, maxCents: 35000 });
  });

  it("parses spaced thousands", () => {
    assert.deepEqual(parseZarPriceRange("Sneakers R 1 500 brand new"), {
      minCents: 150000,
      maxCents: 150000,
    });
  });

  it("returns null when there's no price", () => {
    assert.equal(parseZarPriceRange("DM to order 📲 sizes S to XXL"), null);
    assert.equal(parseZarPriceRange(""), null);
  });
});

// ── AI budget planning (quota, spec §5) ─────────────────────

describe("planAiBudget", () => {
  it("gives everything AI on unlimited plans", () => {
    assert.deepEqual(planAiBudget(50, 0, true), { withAi: 50, withoutAi: 0 });
  });

  it("splits the batch at the credit limit — never silently drops", () => {
    assert.deepEqual(planAiBudget(10, 4, false), { withAi: 4, withoutAi: 6 });
  });

  it("handles zero credits and zero pending", () => {
    assert.deepEqual(planAiBudget(5, 0, false), { withAi: 0, withoutAi: 5 });
    assert.deepEqual(planAiBudget(0, 10, false), { withAi: 0, withoutAi: 0 });
  });

  it("never plans negative work on weird inputs", () => {
    assert.deepEqual(planAiBudget(3, -5, false), { withAi: 0, withoutAi: 3 });
  });
});

// ── Draft assessment ────────────────────────────────────────

describe("assessDraft", () => {
  it("marks confident, priced, titled drafts READY", () => {
    const result = assessDraft({
      confidence: 0.9,
      modelFlags: [],
      hasPrice: true,
      hasTitle: true,
    });
    assert.equal(result.status, "READY");
    assert.deepEqual(result.flags, []);
  });

  it("flags low confidence and missing price", () => {
    const result = assessDraft({
      confidence: 0.4,
      modelFlags: [],
      hasPrice: false,
      hasTitle: true,
    });
    assert.equal(result.status, "NEEDS_REVIEW");
    assert.ok(result.flags.includes("low_confidence"));
    assert.ok(result.flags.includes("no_price_detected"));
  });

  it("keeps known model flags, drops unknown ones (defensive)", () => {
    const result = assessDraft({
      confidence: 0.9,
      modelFlags: ["watermark_suspected", "made_up_flag"],
      hasPrice: true,
      hasTitle: true,
    });
    assert.ok(result.flags.includes("watermark_suspected"));
    assert.ok(!result.flags.includes("made_up_flag"));
    assert.equal(result.status, "NEEDS_REVIEW"); // any flag ⇒ review
  });
});

// ── Duplicate similarity ────────────────────────────────────

describe("titleSimilarity", () => {
  it("scores near-identical titles above the dedupe threshold", () => {
    const score = titleSimilarity("Black Hoodie Premium Cotton", "Premium Black Cotton Hoodie");
    assert.ok(score >= DUPLICATE_SIMILARITY_THRESHOLD);
  });

  it("scores unrelated titles low", () => {
    const score = titleSimilarity("Black Hoodie", "iPhone 13 Charger Cable");
    assert.ok(score < 0.3);
  });

  it("handles empty input", () => {
    assert.equal(titleSimilarity("", "Hoodie"), 0);
  });
});

// ── Review grid ordering ────────────────────────────────────

describe("draftSortWeight", () => {
  it("orders needs_review < processing < ready < published", () => {
    const review = draftSortWeight("NEEDS_REVIEW", 1);
    const processing = draftSortWeight("PROCESSING", 0);
    const ready = draftSortWeight("READY", 0);
    const published = draftSortWeight("PUBLISHED", 0);
    assert.ok(review < processing && processing < ready && ready < published);
  });

  it("puts more-flagged cards earlier within needs_review", () => {
    assert.ok(draftSortWeight("NEEDS_REVIEW", 3) < draftSortWeight("NEEDS_REVIEW", 1));
  });
});

// ── Draft → product mapping ─────────────────────────────────

describe("buildProductPlan", () => {
  const base = {
    aiTitle: "Black Hoodie",
    aiDescription: "Warm fleece hoodie",
    aiPriceMinCents: 28000,
    aiAttributes: { sizes: ["S", "M", "L"], colours: ["Black"], material: "fleece" },
    photoUrls: ["https://cdn.example/a.jpg"],
  };

  it("creates one variant per size with the single detected colour", () => {
    const plan = buildProductPlan(base);
    assert.ok(!isMappingError(plan));
    if (!isMappingError(plan)) {
      assert.equal(plan.variants.length, 3);
      assert.deepEqual(plan.variants[0], {
        size: "S",
        color: "Black",
        priceInCents: 28000,
        stock: 1, // never publish instantly sold-out
      });
    }
  });

  it("falls back to a Default variant without sizes, no colour when ambiguous", () => {
    const plan = buildProductPlan({
      ...base,
      aiAttributes: { sizes: [], colours: ["Black", "Grey"] },
    });
    assert.ok(!isMappingError(plan));
    if (!isMappingError(plan)) {
      assert.equal(plan.variants.length, 1);
      assert.equal(plan.variants[0]!.size, "Default");
      assert.equal(plan.variants[0]!.color, null); // two colours → don't guess
    }
  });

  it("returns errors instead of throwing for missing title/price", () => {
    assert.deepEqual(buildProductPlan({ ...base, aiTitle: null }), { error: "missing_title" });
    assert.deepEqual(buildProductPlan({ ...base, aiPriceMinCents: null }), { error: "missing_price" });
  });
});

// ── Model response normalization ────────────────────────────

describe("normalizeImportDraftResponse", () => {
  it("converts rand prices to cents and clamps confidence", () => {
    const draft = normalizeImportDraftResponse({
      title: "Black Hoodie",
      category: "Hoodies",
      description: "Warm fleece",
      priceMin: 280,
      priceMax: 350,
      attributes: { sizes: ["S"], colours: [], material: "" },
      confidence: 1.7,
      flags: [],
    });
    assert.ok(draft);
    assert.equal(draft!.priceMinCents, 28000);
    assert.equal(draft!.priceMaxCents, 35000);
    assert.equal(draft!.confidence, 1);
  });

  it("nulls invalid prices and fixes inverted ranges", () => {
    const draft = normalizeImportDraftResponse({
      title: "Hoodie",
      priceMin: 350,
      priceMax: 280, // inverted
      attributes: {},
      confidence: 0.8,
    });
    assert.ok(draft);
    assert.equal(draft!.priceMaxCents, 35000); // clamped up to min

    const noPrice = normalizeImportDraftResponse({
      title: "Hoodie",
      priceMin: -5,
      priceMax: null,
      attributes: {},
      confidence: 0.8,
    });
    assert.equal(noPrice!.priceMinCents, null);
  });

  it("returns null for garbage", () => {
    assert.equal(normalizeImportDraftResponse(null), null);
    assert.equal(normalizeImportDraftResponse({ title: "" }), null);
  });
});
