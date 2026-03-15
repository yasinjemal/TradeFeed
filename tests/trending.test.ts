// ============================================================
// Tests — Trending Products Intelligence
// ============================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeTrendingProducts,
  type ProductOrderCount,
} from "@/lib/intelligence/trending";

// ── Helpers ─────────────────────────────────────────────
function mockProduct(overrides: Partial<ProductOrderCount> = {}): ProductOrderCount {
  return {
    productId: "prod-1",
    productName: "Test Product",
    shopId: "shop-1",
    orderCount: 10,
    totalRevenueCents: 50000,
    lastOrderDate: new Date("2026-03-01"),
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────
describe("computeTrendingProducts", () => {
  it("returns empty array for no data", () => {
    const result = computeTrendingProducts([]);
    assert.deepEqual(result, []);
  });

  it("ranks products by order count descending", () => {
    const data: ProductOrderCount[] = [
      mockProduct({ productId: "a", orderCount: 5 }),
      mockProduct({ productId: "b", orderCount: 20 }),
      mockProduct({ productId: "c", orderCount: 10 }),
    ];

    const result = computeTrendingProducts(data);
    assert.equal(result[0]!.productId, "b");
    assert.equal(result[1]!.productId, "c");
    assert.equal(result[2]!.productId, "a");
  });

  it("assigns rank numbers starting from 1", () => {
    const data: ProductOrderCount[] = [
      mockProduct({ productId: "a", orderCount: 50 }),
      mockProduct({ productId: "b", orderCount: 30 }),
    ];

    const result = computeTrendingProducts(data);
    assert.equal(result[0]!.rank, 1);
    assert.equal(result[1]!.rank, 2);
  });

  it("calculates momentum as percentage of max orders", () => {
    const data: ProductOrderCount[] = [
      mockProduct({ productId: "leader", orderCount: 100 }),
      mockProduct({ productId: "half", orderCount: 50 }),
      mockProduct({ productId: "quarter", orderCount: 25 }),
    ];

    const result = computeTrendingProducts(data);
    assert.equal(result[0]!.momentum, 100); // leader
    assert.equal(result[1]!.momentum, 50);  // half
    assert.equal(result[2]!.momentum, 25);  // quarter
  });

  it("respects the limit parameter", () => {
    const data = Array.from({ length: 20 }, (_, i) =>
      mockProduct({ productId: `prod-${i}`, orderCount: 20 - i })
    );

    const result = computeTrendingProducts(data, 5);
    assert.equal(result.length, 5);
    assert.equal(result[0]!.productId, "prod-0");
  });

  it("breaks ties by most recent order date", () => {
    const data: ProductOrderCount[] = [
      mockProduct({
        productId: "old",
        orderCount: 10,
        lastOrderDate: new Date("2026-01-01"),
      }),
      mockProduct({
        productId: "new",
        orderCount: 10,
        lastOrderDate: new Date("2026-03-10"),
      }),
    ];

    const result = computeTrendingProducts(data);
    assert.equal(result[0]!.productId, "new");
    assert.equal(result[1]!.productId, "old");
  });

  it("handles single product", () => {
    const data = [mockProduct({ orderCount: 42 })];
    const result = computeTrendingProducts(data);
    assert.equal(result.length, 1);
    assert.equal(result[0]!.momentum, 100);
    assert.equal(result[0]!.rank, 1);
  });
});
