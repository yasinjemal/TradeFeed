import assert from "node:assert/strict";
import test from "node:test";

import { shopFulfillmentSchema } from "@/lib/validation/shop-settings";

test("shop fulfilment settings accept a complete buyer promise", () => {
  const result = shopFulfillmentSchema.safeParse({
    deliveryEnabled: true,
    collectionEnabled: false,
    dispatchWindow: "1-2 business days",
    deliveryNote: "Orders dispatch from Komani.",
    returnPolicy: "Exchanges within 7 days.",
  });

  assert.equal(result.success, true);
});

test("shop fulfilment settings reject unrecognised dispatch windows", () => {
  const result = shopFulfillmentSchema.safeParse({
    deliveryEnabled: true,
    collectionEnabled: true,
    dispatchWindow: "Tomorrow maybe",
    deliveryNote: "",
    returnPolicy: "",
  });

  assert.equal(result.success, false);
});

test("shop fulfilment settings bound buyer-facing policy text", () => {
  const result = shopFulfillmentSchema.safeParse({
    deliveryEnabled: true,
    collectionEnabled: true,
    dispatchWindow: "Same business day",
    deliveryNote: "x".repeat(501),
    returnPolicy: "",
  });

  assert.equal(result.success, false);
});
