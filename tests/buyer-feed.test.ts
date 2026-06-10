// ============================================================
// Tests — Buyer Retention: Feed Pagination (Phase 1)
// ============================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildFeedPage } from "@/lib/db/buyers";

function mockRow(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: `Product ${id}`,
    slug: `product-${id}`,
    minPriceCents: 9999,
    maxPriceCents: 14999,
    createdAt: new Date("2026-06-01"),
    images: [{ url: `https://cdn.example/${id}.jpg` }],
    shop: { id: "shop-1", name: "Test Shop", slug: "test-shop", isVerified: true },
    ...overrides,
  };
}

describe("buildFeedPage", () => {
  it("returns empty page with no cursor for no rows", () => {
    const result = buildFeedPage([], 24);
    assert.deepEqual(result.items, []);
    assert.equal(result.nextCursor, null);
  });

  it("returns all items with no cursor when rows fit in one page", () => {
    const rows = [mockRow("a"), mockRow("b"), mockRow("c")];
    const result = buildFeedPage(rows, 24);
    assert.equal(result.items.length, 3);
    assert.equal(result.nextCursor, null);
  });

  it("trims to pageSize and sets nextCursor when an extra row is present", () => {
    // Query fetches pageSize + 1 rows to detect another page
    const rows = [mockRow("a"), mockRow("b"), mockRow("c")];
    const result = buildFeedPage(rows, 2);
    assert.equal(result.items.length, 2);
    assert.equal(result.items[0]!.id, "a");
    assert.equal(result.items[1]!.id, "b");
    assert.equal(result.nextCursor, "b"); // last item of the page
  });

  it("maps primary image url and null when product has no images", () => {
    const rows = [mockRow("a"), mockRow("b", { images: [] })];
    const result = buildFeedPage(rows, 24);
    assert.equal(result.items[0]!.imageUrl, "https://cdn.example/a.jpg");
    assert.equal(result.items[1]!.imageUrl, null);
  });

  it("preserves public-safe shop fields only", () => {
    const result = buildFeedPage([mockRow("a")], 24);
    const shop = result.items[0]!.shop;
    assert.deepEqual(Object.keys(shop).sort(), ["id", "isVerified", "name", "slug"]);
  });

  it("exact pageSize rows means no next page", () => {
    const rows = [mockRow("a"), mockRow("b")];
    const result = buildFeedPage(rows, 2);
    assert.equal(result.items.length, 2);
    assert.equal(result.nextCursor, null);
  });
});
