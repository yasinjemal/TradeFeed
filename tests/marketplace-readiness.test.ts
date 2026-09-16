/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma query spies inspect heterogeneous delegates. */
import test from "node:test";
import assert from "node:assert/strict";
import { db } from "@/lib/db";
import { getMarketplaceProducts, getGlobalCategories, getPromotedProducts, getNewArrivals } from "@/lib/db/marketplace";
import { MARKETPLACE_ELIGIBILITY } from "@/lib/marketplace/eligibility";
import { listingDiscoveryIssues } from "@/lib/marketplace/listing-readiness";

test("discovery eligibility survives price filters and is shared by counts and feeds", async (t) => {
  const queries: any[] = [];
  const spy = (delegate: any, name: string, fn: any) => {
    const original = delegate[name];
    delegate[name] = fn;
    t.after(() => { delegate[name] = original; });
  };
  spy(db.product, "findMany", async (args: any) => { queries.push(args); return []; });
  spy(db.product, "count", async (args: any) => { queries.push(args); return 0; });
  await getMarketplaceProducts({ minPrice: 100, maxPrice: 500 });
  assert.deepEqual(queries[1].where, {...queries[0].where,id:{in:[]}});
  assert.deepEqual(queries[0].where.AND[0], MARKETPLACE_ELIGIBILITY);
  assert.deepEqual(queries[0].where.variants.some.priceInCents, { gt: 0, gte: 100, lte: 500 });
  await getNewArrivals();
  assert.deepEqual(queries[2].where.AND[0], MARKETPLACE_ELIGIBILITY);
  spy(db.promotedListing, "findMany", async (args: any) => {
    assert.deepEqual(args.where.product.AND[0], MARKETPLACE_ELIGIBILITY);
    return [];
  });
  await getPromotedProducts();
  spy(db.globalCategory, "findMany", async (args: any) => {
    assert.deepEqual(args.select._count.select.products.where.AND[0], MARKETPLACE_ELIGIBILITY);
    return [];
  });
  await getGlobalCategories();
});

test("seller guidance identifies missing images, unavailable stock and invalid prices", () => {
  const product = { isActive: true, isFlagged: false, minPriceCents: 100, images: [{ url: "https://example.com/photo.jpg" }], variants: [{ isActive: true, stock: 2, priceInCents: 100 }] };
  assert.deepEqual(listingDiscoveryIssues(product), []);
  assert.deepEqual(listingDiscoveryIssues({ ...product, images: [] }), ["Add a product photo"]);
  assert.ok(listingDiscoveryIssues({ ...product, variants: [{ isActive: true, stock: 0, priceInCents: 100 }] }).length);
  assert.ok(listingDiscoveryIssues({ ...product, minPriceCents: 0 }).includes("Add a price above R0"));
  assert.ok(listingDiscoveryIssues({ ...product, isFlagged: true }).length);
});
