// ============================================================
// Unit tests — interleavePromotedProducts
// ============================================================
// Run with: npm test
// Pure function tests — no database connection required.
//
// Invariants under test:
//   1. No promoted → organic returned unchanged
//   2. Promoted product appears at every 5th slot (indices 4, 9, 14…)
//   3. A product in both organic AND promoted appears exactly once
//   4. Remaining promoted fill the tail when organic is exhausted
//   5. Empty organic → all promoted returned in order
// ============================================================

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { interleavePromotedProducts } from "@/lib/db/marketplace";
import type { MarketplaceProduct } from "@/lib/db/marketplace";

// interleavePromotedProducts only reads `.id` from each product,
// so a minimal fixture is sufficient.
function p(id: string): MarketplaceProduct {
  return { id } as MarketplaceProduct;
}

function ids(products: MarketplaceProduct[]): string[] {
  return products.map((x) => x.id);
}

// ── Basic behaviour ───────────────────────────────────────────

describe("interleavePromotedProducts — basic behaviour", () => {
  test("returns organic list unchanged when promoted is empty", () => {
    const organic = [p("a"), p("b"), p("c")];
    assert.deepEqual(ids(interleavePromotedProducts(organic, [])), ["a", "b", "c"]);
  });

  test("returns all promoted when organic is empty", () => {
    const promoted = [p("pr1"), p("pr2"), p("pr3")];
    assert.deepEqual(ids(interleavePromotedProducts([], promoted)), ["pr1", "pr2", "pr3"]);
  });

  test("output length equals organic.length + promoted.length (minus duplicates)", () => {
    const organic = Array.from({ length: 8 }, (_, i) => p(`o${i}`));
    const promoted = [p("pr1"), p("pr2")];
    const result = interleavePromotedProducts(organic, promoted);
    assert.equal(result.length, 10);
  });
});

// ── Slot placement ────────────────────────────────────────────

describe("interleavePromotedProducts — promoted slot positions", () => {
  test("first promoted lands at index 4 (slot 5)", () => {
    const organic = Array.from({ length: 8 }, (_, i) => p(`o${i}`));
    const promoted = [p("pr1")];
    const result = interleavePromotedProducts(organic, promoted);
    assert.equal(result[4]!.id, "pr1");
  });

  test("second promoted lands at index 9 (slot 10)", () => {
    const organic = Array.from({ length: 10 }, (_, i) => p(`o${i}`));
    const promoted = [p("pr1"), p("pr2")];
    const result = interleavePromotedProducts(organic, promoted);
    assert.equal(result[4]!.id, "pr1");
    assert.equal(result[9]!.id, "pr2");
  });

  test("organic products fill all non-promoted slots in original order", () => {
    // 8 organic, 1 promoted → result = [o0,o1,o2,o3, pr1, o4,o5,o6,o7]
    const organic = Array.from({ length: 8 }, (_, i) => p(`o${i}`));
    const result = interleavePromotedProducts(organic, [p("pr1")]);
    const organicInResult = result.filter((x) => x.id.startsWith("o"));
    assert.deepEqual(ids(organicInResult), ids(organic));
  });
});

// ── Deduplication ─────────────────────────────────────────────

describe("interleavePromotedProducts — deduplication", () => {
  test("a product present in both organic and promoted appears exactly once", () => {
    const organic = [p("o1"), p("shared"), p("o3"), p("o4"), p("o5")];
    const promoted = [p("shared")];
    const result = interleavePromotedProducts(organic, promoted);
    const sharedCount = result.filter((x) => x.id === "shared").length;
    assert.equal(sharedCount, 1);
  });

  test("all promoted products appear in the result even after dedup", () => {
    const organic = [p("shared1"), p("shared2"), p("o3")];
    const promoted = [p("shared1"), p("shared2"), p("pr3")];
    const result = interleavePromotedProducts(organic, promoted);
    const resultIds = ids(result);
    assert.ok(resultIds.includes("shared1"), "shared1 should appear");
    assert.ok(resultIds.includes("shared2"), "shared2 should appear");
    assert.ok(resultIds.includes("pr3"), "pr3 should appear");
  });
});

// ── Tail behaviour when organic is exhausted ──────────────────

describe("interleavePromotedProducts — organic exhaustion", () => {
  test("remaining promoted fill the tail when organic runs out before promoted slots", () => {
    // 2 organic, 3 promoted → totalSlots=5
    // slot 0→o0, slot 1→o1, slot 2→(organic empty)→pr0,
    // slot 3→pr1, slot 4→(promoted slot)→pr2
    const organic = [p("o0"), p("o1")];
    const promoted = [p("pr0"), p("pr1"), p("pr2")];
    const result = interleavePromotedProducts(organic, promoted);
    assert.equal(result.length, 5);
    const resultIds = ids(result);
    assert.ok(resultIds.includes("pr0"));
    assert.ok(resultIds.includes("pr1"));
    assert.ok(resultIds.includes("pr2"));
  });

  test("result contains all organic items when promoted count is large", () => {
    const organic = [p("o1"), p("o2"), p("o3")];
    const promoted = Array.from({ length: 10 }, (_, i) => p(`pr${i}`));
    const result = interleavePromotedProducts(organic, promoted);
    const resultIds = ids(result);
    assert.ok(resultIds.includes("o1"));
    assert.ok(resultIds.includes("o2"));
    assert.ok(resultIds.includes("o3"));
  });
});
