import test from "node:test";
import assert from "node:assert/strict";

import { checkoutSchema } from "@/lib/validation/checkout";
import {
  aggregateCheckoutItems,
  aggregateStockQuantities,
  CheckoutPolicyError,
  deriveCheckoutUnitPrice,
} from "@/lib/orders/checkout-policy";
import { generateOrderNumber } from "@/lib/db/orders";

test("order numbers use an 80-bit cryptographic suffix", () => {
  const date = new Date("2026-07-23T23:59:59.000Z");
  const numbers = new Set(
    Array.from({ length: 500 }, () => generateOrderNumber(date)),
  );

  assert.equal(numbers.size, 500);
  for (const orderNumber of numbers) {
    assert.match(orderNumber, /^TF-20260723-[A-F0-9]{20}$/);
  }
});

test("checkout aggregation merges duplicate rows but keeps order types separate", () => {
  const aggregated = aggregateCheckoutItems([
    {
      productId: "product-1",
      variantId: "variant-1",
      orderType: "wholesale" as const,
      quantity: 2,
    },
    {
      productId: "product-1",
      variantId: "variant-1",
      orderType: "wholesale" as const,
      quantity: 3,
    },
    {
      productId: "product-1",
      variantId: "variant-1",
      orderType: "retail" as const,
      quantity: 1,
    },
  ]);

  assert.deepEqual(
    aggregated.map(({ orderType, quantity }) => ({ orderType, quantity })),
    [
      { orderType: "wholesale", quantity: 5 },
      { orderType: "retail", quantity: 1 },
    ],
  );
  assert.equal(aggregateStockQuantities(aggregated).get("variant-1"), 6);
});

test("checkout aggregation rejects conflicting product claims and oversized totals", () => {
  assert.throws(
    () =>
      aggregateCheckoutItems([
        {
          productId: "product-1",
          variantId: "variant-1",
          orderType: "retail" as const,
          quantity: 1,
        },
        {
          productId: "product-2",
          variantId: "variant-1",
          orderType: "retail" as const,
          quantity: 1,
        },
      ]),
    CheckoutPolicyError,
  );

  assert.throws(
    () =>
      aggregateCheckoutItems(
        Array.from({ length: 11 }, (_, index) => ({
          productId: `product-${index}`,
          variantId: `variant-${index}`,
          orderType: "retail" as const,
          quantity: 1_000,
        })),
      ),
    /Order quantity is too large/,
  );
});

test("server checkout pricing enforces order mode, MOQ, and bulk tiers", () => {
  assert.equal(
    deriveCheckoutUnitPrice({
      orderType: "retail",
      productName: "Tee",
      wholesaleOnly: false,
      minWholesaleQty: 10,
      wholesalePriceCents: 10_000,
      retailPriceCents: 15_000,
      quantity: 1,
      bulkDiscountTiers: [{ minQuantity: 10, discountPercent: 10 }],
    }),
    15_000,
  );
  assert.equal(
    deriveCheckoutUnitPrice({
      orderType: "wholesale",
      productName: "Tee",
      wholesaleOnly: false,
      minWholesaleQty: 10,
      wholesalePriceCents: 10_000,
      retailPriceCents: 15_000,
      quantity: 10,
      bulkDiscountTiers: [{ minQuantity: 10, discountPercent: 10 }],
    }),
    9_000,
  );
  assert.throws(
    () =>
      deriveCheckoutUnitPrice({
        orderType: "wholesale",
        productName: "Tee",
        wholesaleOnly: false,
        minWholesaleQty: 10,
        wholesalePriceCents: 10_000,
        retailPriceCents: 15_000,
        quantity: 9,
        bulkDiscountTiers: [],
      }),
    /requires at least 10 units/,
  );
  assert.throws(
    () =>
      deriveCheckoutUnitPrice({
        orderType: "retail",
        productName: "Trade Pack",
        wholesaleOnly: true,
        minWholesaleQty: 1,
        wholesalePriceCents: 10_000,
        retailPriceCents: null,
        quantity: 1,
        bulkDiscountTiers: [],
      }),
    /wholesale only/,
  );
});

test("checkout schema defaults legacy rows safely and rejects unsupported modes", () => {
  const baseInput = {
    shopId: "shop-1",
    shopSlug: "shop-one",
    items: [
      {
        productId: "product-1",
        variantId: "variant-1",
        productName: "Tee",
        option1Label: "Size",
        option1Value: "M",
        option2Label: "Colour",
        option2Value: null,
        priceInCents: 1,
        quantity: 1,
      },
    ],
  };

  const parsed = checkoutSchema.parse(baseInput);
  assert.equal(parsed.items[0]?.orderType, "wholesale");
  assert.equal(parsed.paymentMethod, "PAYFAST");
  assert.equal(
    checkoutSchema.safeParse({ ...baseInput, paymentMethod: "MANUAL" }).success,
    false,
  );
  assert.equal(
    checkoutSchema.safeParse({
      ...baseInput,
      items: [{ ...baseInput.items[0], orderType: "free" }],
    }).success,
    false,
  );
});
