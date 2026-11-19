import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPromiseRows,
  DEFAULT_DISPATCH_WINDOW,
  hasConfirmedFulfilment,
  type FulfilmentInput,
} from "@/lib/seller/fulfilment-promise";

/** Exactly what a Shop row looks like when nobody opened settings. */
function untouched(overrides: Partial<FulfilmentInput> = {}): FulfilmentInput {
  return {
    dispatchWindow: DEFAULT_DISPATCH_WINDOW,
    deliveryEnabled: true,
    collectionEnabled: true,
    deliveryNote: null,
    returnPolicy: null,
    ...overrides,
  };
}

test("schema defaults are never treated as a seller promise", () => {
  assert.equal(hasConfirmedFulfilment(untouched()), false);
});

test("any deliberate fulfilment edit counts as confirmation", () => {
  assert.equal(hasConfirmedFulfilment(untouched({ returnPolicy: "14 days" })), true);
  assert.equal(hasConfirmedFulfilment(untouched({ deliveryNote: "Free over R500" })), true);
  assert.equal(hasConfirmedFulfilment(untouched({ dispatchWindow: "Same day" })), true);
  assert.equal(hasConfirmedFulfilment(untouched({ collectionEnabled: false })), true);
  assert.equal(
    hasConfirmedFulfilment(untouched({ fulfilmentConfirmedAt: new Date("2026-01-01") })),
    true,
  );
});

test("whitespace is not confirmation", () => {
  assert.equal(hasConfirmedFulfilment(untouched({ returnPolicy: "   " })), false);
  assert.equal(hasConfirmedFulfilment(untouched({ deliveryNote: "\n " })), false);
});

test("an untouched shop never publishes the default dispatch window", () => {
  const rows = buildPromiseRows(untouched());
  const serialised = rows.map((r) => r.value).join(" | ");
  assert.equal(
    serialised.includes(DEFAULT_DISPATCH_WINDOW),
    false,
    "unset schema default leaked to the buyer as a promise",
  );
});

test("the dock always has exactly four rows, confirmed or not", () => {
  assert.equal(buildPromiseRows(untouched()).length, 4);
  assert.equal(buildPromiseRows(untouched({ returnPolicy: "14 days" })).length, 4);
});

test("unconfirmed rows degrade to a real buyer action, never a hole", () => {
  const rows = buildPromiseRows(untouched());
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(byId.dispatch?.tone, "ask");
  assert.match(byId.fulfilment?.value ?? "", /WhatsApp/);
  assert.equal(byId.returns?.tone, "missing");
  assert.equal(byId.pays?.tone, "promise");
});

test("a confirmed shop publishes its real promises", () => {
  const rows = buildPromiseRows(
    untouched({
      dispatchWindow: "Same day",
      returnPolicy: "14-day returns",
      collectionEnabled: false,
    }),
  );
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(byId.dispatch?.value, "Same day");
  assert.equal(byId.dispatch?.tone, "promise");
  assert.equal(byId.fulfilment?.value, "Delivery");
  assert.equal(byId.returns?.value, "14-day returns");
});

test("a confirmed shop with no fulfilment mode still points at WhatsApp", () => {
  const rows = buildPromiseRows(
    untouched({ deliveryEnabled: false, collectionEnabled: false }),
  );
  const fulfilment = rows.find((r) => r.id === "fulfilment");
  assert.equal(fulfilment?.tone, "ask");
});
