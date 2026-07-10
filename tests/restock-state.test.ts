import test from "node:test";
import assert from "node:assert/strict";

import { getRestockAlertDecision } from "@/lib/notifications/restock-state";

test("zero stock arms a saved product for its next restock", () => {
  assert.equal(getRestockAlertDecision(0, new Date()), "ARM");
});

test("available stock notifies an armed saved product", () => {
  assert.equal(getRestockAlertDecision(5, null), "NOTIFY");
});

test("available stock does not repeat an acknowledged restock", () => {
  assert.equal(getRestockAlertDecision(5, new Date()), "NONE");
});

test("invalid and negative stock values fail safely into the armed state", () => {
  assert.equal(getRestockAlertDecision(Number.NaN, null), "ARM");
  assert.equal(getRestockAlertDecision(-2, null), "ARM");
});
