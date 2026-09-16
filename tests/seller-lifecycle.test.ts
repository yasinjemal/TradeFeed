import test from "node:test";
import assert from "node:assert/strict";
import { db } from "@/lib/db";

import {
  buildSellerMilestoneDedupeKey,
  buildSellerMilestoneMetadata,
  isSellerMilestoneSource,
  sellerMilestoneTargetsShop,
  SELLER_MILESTONE_SOURCES,
  SELLER_MILESTONE_STEPS,
  recordShopProductCreated,
} from "@/lib/analytics/seller-lifecycle";

test("product saves record an owner milestone once and tracking failure does not fail the save", async (t) => {
  const originalShop = db.shop.findUnique;
  const originalFind = db.onboardingEvent.findFirst;
  const originalCreate = db.onboardingEvent.create;
  t.after(() => {
    db.shop.findUnique = originalShop;
    db.onboardingEvent.findFirst = originalFind;
    db.onboardingEvent.create = originalCreate;
  });
  let recorded = false;
  let writes = 0;
  db.shop.findUnique = (async () => ({ slug: "test-shop", users: [{ userId: "owner" }] })) as unknown as typeof db.shop.findUnique;
  db.onboardingEvent.findFirst = (async () => recorded ? { id: "event" } : null) as unknown as typeof db.onboardingEvent.findFirst;
  db.onboardingEvent.create = (async (args: { data: { dedupeKey: string } }) => {
    assert.equal(args.data.dedupeKey, "owner:product_created:shop");
    writes++;
    recorded = true;
    return { id: "event" };
  }) as unknown as typeof db.onboardingEvent.create;
  await recordShopProductCreated("shop", "product-1");
  await recordShopProductCreated("shop", "product-2");
  assert.equal(writes, 1);
  const errors = t.mock.method(console, "error", () => {});
  db.shop.findUnique = (async () => { throw new Error("database unavailable"); }) as unknown as typeof db.shop.findUnique;
  await assert.doesNotReject(() => recordShopProductCreated("shop", "product-3"));
  assert.equal(errors.mock.callCount(), 1);
});

test("milestone dedupe keys are stable and prefer immutable shop IDs", () => {
  assert.equal(
    buildSellerMilestoneDedupeKey({
      userId: "user_123",
      step: "catalog_shared",
      shopId: "shop_123",
      shopSlug: "mutable-slug",
    }),
    "user_123:catalog_shared:shop_123",
  );
});

test("seller lifecycle exposes a small canonical milestone taxonomy", () => {
  assert.deepEqual(SELLER_MILESTONE_STEPS, [
    "started",
    "shop_created",
    "product_created",
    "completed",
    "catalog_shared",
    "upgrade_viewed",
    "subscription_started",
  ]);
  assert.deepEqual(SELLER_MILESTONE_SOURCES, [
    "get-started",
    "create-shop",
    "dashboard",
    "settings",
    "billing",
    "upgrade-page",
    "payfast",
    "manual-upgrade",
    "admin",
    "product-save",
  ]);
});

test("milestone metadata only contains allowlisted operational identifiers", () => {
  assert.deepEqual(
    buildSellerMilestoneMetadata({
      source: "dashboard",
      shopId: "shop_123",
      shopSlug: "test-traders",
      productId: "product_123",
    }),
    {
      source: "dashboard",
      shopId: "shop_123",
      shopSlug: "test-traders",
      productId: "product_123",
    },
  );
});

test("milestone metadata omits absent optional fields", () => {
  assert.deepEqual(
    buildSellerMilestoneMetadata({ source: "get-started" }),
    { source: "get-started" },
  );
});

test("rejects untrusted milestone source values", () => {
  assert.equal(isSellerMilestoneSource("dashboard"), true);
  assert.equal(isSellerMilestoneSource("forged-client-source"), false);
  assert.equal(isSellerMilestoneSource(null), false);
});

test("matches shop-scoped milestone metadata exactly", () => {
  assert.equal(
    sellerMilestoneTargetsShop(
      { shopId: "shop_123", shopSlug: "old-slug" },
      "test-traders",
      "shop_123",
    ),
    true,
  );
  assert.equal(
    sellerMilestoneTargetsShop(
      { shopId: "shop_other", shopSlug: "test-traders" },
      "test-traders",
      "shop_123",
    ),
    false,
  );
  assert.equal(
    sellerMilestoneTargetsShop(
      { shopSlug: "test-traders" },
      "test-traders",
      "shop_123",
    ),
    true,
  );
  assert.equal(
    sellerMilestoneTargetsShop(null, "test-traders", "shop_123"),
    false,
  );
});
