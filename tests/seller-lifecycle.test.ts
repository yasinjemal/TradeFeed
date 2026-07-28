import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSellerMilestoneDedupeKey,
  buildSellerMilestoneMetadata,
  isSellerMilestoneSource,
  sellerMilestoneTargetsShop,
  SELLER_MILESTONE_SOURCES,
  SELLER_MILESTONE_STEPS,
} from "@/lib/analytics/seller-lifecycle";

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
