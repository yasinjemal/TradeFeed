import test from "node:test";
import assert from "node:assert/strict";
import { interleavePromotedProducts, type MarketplaceProduct } from "@/lib/db/marketplace";

function makeProduct(
  id: string,
  promotion: MarketplaceProduct["promotion"] = null
): MarketplaceProduct {
  return {
    id,
    name: `Product ${id}`,
    description: null,
    imageUrl: null,
    minPriceCents: 1000,
    maxPriceCents: 2000,
    variantCount: 1,
    shop: {
      id: "shop_1",
      slug: "shop-slug",
      name: "Shop Name",
      city: null,
      province: null,
      isVerified: false,
      logoUrl: null,
      subscription: null,
    },
    globalCategory: null,
    promotion,
    avgRating: null,
    reviewCount: 0,
    sellerTier: null,
    createdAt: new Date(),
  };
}

test("interleavePromotedProducts inserts promoted items every 5th slot", () => {
  const organic = ["o1", "o2", "o3", "o4", "o5", "o6"].map((id) => makeProduct(id));
  const promoted = [
    makeProduct("p1", { tier: "FEATURED", promotedListingId: "pl_1" }),
    makeProduct("p2", { tier: "BOOST", promotedListingId: "pl_2" }),
  ];

  const result = interleavePromotedProducts(organic, promoted).map((p) => p.id);
  assert.deepEqual(result, ["o1", "o2", "o3", "o4", "p1", "o5", "o6", "p2"]);
});

test("interleavePromotedProducts de-duplicates organic items also in promoted", () => {
  const organic = ["o1", "dup", "o2"].map((id) => makeProduct(id));
  const promoted = [makeProduct("dup", { tier: "SPOTLIGHT", promotedListingId: "pl_dup" })];

  const result = interleavePromotedProducts(organic, promoted).map((p) => p.id);
  assert.equal(result.filter((id) => id === "dup").length, 1);
});
