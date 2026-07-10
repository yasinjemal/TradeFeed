import { test } from "node:test";
import assert from "node:assert/strict";

import {
  applicableTier,
  effectiveUnitPriceCents,
  nextTierNudge,
  type BulkDiscountTier,
} from "../lib/cart/pricing";

const TIERS: BulkDiscountTier[] = [
  { minQuantity: 10, discountPercent: 5 },
  { minQuantity: 50, discountPercent: 12 },
];

test("applicableTier: below every tier returns null", () => {
  assert.equal(applicableTier(9, TIERS), null);
});

test("applicableTier: picks the highest tier reached", () => {
  assert.deepEqual(applicableTier(10, TIERS), TIERS[0]);
  assert.deepEqual(applicableTier(49, TIERS), TIERS[0]);
  assert.deepEqual(applicableTier(50, TIERS), TIERS[1]);
  assert.deepEqual(applicableTier(500, TIERS), TIERS[1]);
});

test("applicableTier: tier order in the array doesn't matter", () => {
  const reversed = [...TIERS].reverse();
  assert.deepEqual(applicableTier(50, reversed), TIERS[1]);
});

test("wholesale price without tiers is unchanged", () => {
  assert.equal(
    effectiveUnitPriceCents({
      orderType: "wholesale",
      wholesalePriceCents: 10000,
      retailPriceCents: 15000,
      quantity: 3,
    }),
    10000,
  );
});

test("wholesale price applies the reached tier and rounds", () => {
  // 5% off 9999 = 9499.05 → 9499
  assert.equal(
    effectiveUnitPriceCents({
      orderType: "wholesale",
      wholesalePriceCents: 9999,
      retailPriceCents: null,
      quantity: 10,
      bulkDiscountTiers: TIERS,
    }),
    9499,
  );
  // 12% off 10000 = 8800
  assert.equal(
    effectiveUnitPriceCents({
      orderType: "wholesale",
      wholesalePriceCents: 10000,
      retailPriceCents: null,
      quantity: 50,
      bulkDiscountTiers: TIERS,
    }),
    8800,
  );
});

test("retail price ignores bulk tiers", () => {
  assert.equal(
    effectiveUnitPriceCents({
      orderType: "retail",
      wholesalePriceCents: 10000,
      retailPriceCents: 15000,
      quantity: 100,
      bulkDiscountTiers: TIERS,
    }),
    15000,
  );
});

test("retail falls back to wholesale price when no retail price set", () => {
  assert.equal(
    effectiveUnitPriceCents({
      orderType: "retail",
      wholesalePriceCents: 10000,
      retailPriceCents: null,
      quantity: 1,
    }),
    10000,
  );
  assert.equal(
    effectiveUnitPriceCents({
      orderType: "retail",
      wholesalePriceCents: 10000,
      retailPriceCents: 0,
      quantity: 1,
    }),
    10000,
  );
});

test("nextTierNudge: reports the closest upcoming tier", () => {
  assert.deepEqual(nextTierNudge(7, TIERS), { addMore: 3, discountPercent: 5 });
  assert.deepEqual(nextTierNudge(10, TIERS), { addMore: 40, discountPercent: 12 });
});

test("nextTierNudge: null at the top tier or with no tiers", () => {
  assert.equal(nextTierNudge(50, TIERS), null);
  assert.equal(nextTierNudge(1, []), null);
});
