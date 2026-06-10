// ============================================================
// Tests — AI Deepening (Phase 3)
// ============================================================
// Pure-logic tests: translation response parsing/staleness
// hashing and price suggestion percentiles.
// ============================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseTranslationResponse,
  hashListingSource,
  TRANSLATION_LOCALES,
} from "@/lib/ai/translate-listing";
import {
  computePriceSuggestion,
  MIN_SAMPLE_SIZE,
} from "@/lib/ai/price-suggestion";

// ── Translation parsing ─────────────────────────────────────

describe("parseTranslationResponse", () => {
  const valid = {
    zu: { name: "Ingubo Yasehlobo", description: "Ingubo enhle yasehlobo" },
    xh: { name: "Ilokhwe Yasehlotyeni", description: "Ilokhwe entle" },
    af: { name: "Somerrok", description: "Pragtige somerrok" },
    st: { name: "Mose oa Lehlabula", description: "Mose o motle" },
  };

  it("parses all four locales from a valid response", () => {
    const result = parseTranslationResponse(valid);
    assert.equal(result.length, 4);
    assert.deepEqual(
      result.map((r) => r.locale).sort(),
      [...TRANSLATION_LOCALES].sort()
    );
  });

  it("drops bad locales instead of failing the batch", () => {
    const result = parseTranslationResponse({
      ...valid,
      xh: { name: "" }, // empty name — invalid
      af: "not an object",
    });
    assert.equal(result.length, 2);
    assert.deepEqual(result.map((r) => r.locale).sort(), ["st", "zu"]);
  });

  it("normalizes empty descriptions to null", () => {
    const result = parseTranslationResponse({
      zu: { name: "Ingubo", description: "" },
    });
    assert.equal(result[0]!.description, null);
  });

  it("rejects absurdly long names (model runaway)", () => {
    const result = parseTranslationResponse({
      zu: { name: "x".repeat(300), description: "ok" },
    });
    assert.equal(result.length, 0);
  });

  it("returns empty for non-object input", () => {
    assert.deepEqual(parseTranslationResponse(null), []);
    assert.deepEqual(parseTranslationResponse("oops"), []);
  });
});

describe("hashListingSource", () => {
  it("is stable for identical input", () => {
    assert.equal(
      hashListingSource("Dress", "Nice summer dress"),
      hashListingSource("Dress", "Nice summer dress")
    );
  });

  it("changes when the name or description changes (staleness detection)", () => {
    const base = hashListingSource("Dress", "Nice");
    assert.notEqual(base, hashListingSource("Dress v2", "Nice"));
    assert.notEqual(base, hashListingSource("Dress", "Nicer"));
  });

  it("treats null description consistently", () => {
    assert.equal(hashListingSource("Dress", null), hashListingSource("Dress", null));
  });
});

// ── Price suggestion ────────────────────────────────────────

describe("computePriceSuggestion", () => {
  it("returns null below the minimum sample size", () => {
    const few = Array.from({ length: MIN_SAMPLE_SIZE - 1 }, (_, i) => 1000 + i);
    assert.equal(computePriceSuggestion(few), null);
  });

  it("filters out zero/invalid prices before checking sample size", () => {
    const prices = [0, -50, NaN, 1000, 2000, 3000, 4000];
    // Only 4 valid — below MIN_SAMPLE_SIZE of 5
    assert.equal(computePriceSuggestion(prices), null);
  });

  it("computes percentiles on a known distribution", () => {
    // 10, 20, 30, ..., 100 (rands in cents)
    const prices = Array.from({ length: 10 }, (_, i) => (i + 1) * 1000);
    const result = computePriceSuggestion(prices)!;
    assert.equal(result.sampleSize, 10);
    assert.equal(result.medianCents, 5500); // between 50 and 60
    assert.equal(result.p25Cents, 3250);
    assert.equal(result.p75Cents, 7750);
    assert.ok(result.p25Cents < result.medianCents);
    assert.ok(result.medianCents < result.p75Cents);
  });

  it("is robust to outliers (percentiles, not mean)", () => {
    const prices = [1000, 1100, 1200, 1300, 1400, 999999];
    const result = computePriceSuggestion(prices)!;
    assert.ok(result.medianCents < 2000, "median should ignore the outlier");
  });

  it("handles identical prices", () => {
    const prices = [5000, 5000, 5000, 5000, 5000];
    const result = computePriceSuggestion(prices)!;
    assert.equal(result.p25Cents, 5000);
    assert.equal(result.medianCents, 5000);
    assert.equal(result.p75Cents, 5000);
  });
});
