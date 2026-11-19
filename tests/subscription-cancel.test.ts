// ============================================================
// Unit tests — seller-initiated cancellation
// ============================================================
// The promise under test: when a seller cancels, PayFast stops
// debiting them — or we tell them it did not work. Never
// "cancelled" in our database while PayFast keeps charging.
// No database and no network: every dependency is a stub.
// ============================================================

import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  cancelShopSubscription,
  describePayFastFailure,
  type CancelSubscriptionDeps,
  type CancellableSubscription,
} from "@/lib/billing/cancel-subscription";
import type { PayFastApiResult } from "@/lib/payfast-api";

const PERIOD_END = new Date("2026-12-19T00:00:00Z");
const TOKEN = "dc0521d3-55fe-269b-fa00-b647310d760f";

function paidSubscription(overrides: Partial<CancellableSubscription> = {}): CancellableSubscription {
  return {
    status: "ACTIVE",
    payfastToken: TOKEN,
    currentPeriodEnd: PERIOD_END,
    plan: { slug: "starter", name: "Starter" },
    ...overrides,
  };
}

/** Stub dependencies that record the order things happened in. */
function harness(subscription: CancellableSubscription | null, payfast: PayFastApiResult = { ok: true }) {
  const events: string[] = [];
  const reported: Array<{ context: string; message: string; meta: unknown }> = [];

  const deps: CancelSubscriptionDeps = {
    getSubscription: async () => subscription,
    cancelAtPayFast: async (token) => {
      events.push(`payfast:${token}`);
      return payfast;
    },
    markCancelled: async (shopId) => {
      events.push(`db:${shopId}`);
    },
    reportError: async (context, error, meta) => {
      reported.push({ context, message: (error as Error).message, meta });
    },
  };

  return { deps, events, reported };
}

describe("cancelShopSubscription", () => {
  test("cancels at PayFast first, then marks the subscription cancelled", async () => {
    const { deps, events, reported } = harness(paidSubscription());

    const result = await cancelShopSubscription("shop_1", deps);

    assert.deepEqual(result, {
      ok: true,
      planName: "Starter",
      endsAt: PERIOD_END,
      stoppedAtPayFast: true,
    });
    assert.deepEqual(events, [`payfast:${TOKEN}`, "db:shop_1"], "PayFast must be called before our own state changes");
    assert.equal(reported.length, 0);
  });

  for (const failure of [
    { ok: false, reason: "network", detail: "fetch failed" },
    { ok: false, reason: "rejected", status: 401, detail: "Merchant authorisation failed" },
    { ok: false, reason: "not_configured" },
    { ok: false, reason: "invalid_token" },
  ] as const) {
    test(`PayFast failure (${failure.reason}) leaves the subscription untouched and says so`, async () => {
      const { deps, events, reported } = harness(paidSubscription(), failure);

      const result = await cancelShopSubscription("shop_1", deps);

      assert.equal(result.ok, false);
      assert.equal(!result.ok && result.code, "PAYFAST_FAILED");
      assert.deepEqual(events, [`payfast:${TOKEN}`], "our row must NOT be marked cancelled");
      // The seller is told the truth: still active.
      assert.match(!result.ok ? result.error : "", /still active/);
      // ...without PayFast's internal error text.
      assert.ok(!(!result.ok && result.error.includes("Merchant authorisation")));
      // And a human is alerted with the diagnosis.
      assert.equal(reported.length, 1);
      assert.equal(reported[0]!.context, "payfast-subscription-cancel-failed");
      assert.match(reported[0]!.message, new RegExp(failure.reason));
    });
  }

  test("a plan paid by manual EFT has nothing to stop at PayFast", async () => {
    const { deps, events } = harness(paidSubscription({ payfastToken: null }));

    const result = await cancelShopSubscription("shop_1", deps);

    assert.equal(result.ok, true);
    assert.equal(result.ok && result.stoppedAtPayFast, false);
    assert.deepEqual(events, ["db:shop_1"]);
  });

  test("cancelling twice is harmless", async () => {
    const { deps, events } = harness(paidSubscription({ status: "CANCELLED" }));

    const result = await cancelShopSubscription("shop_1", deps);

    assert.equal(result.ok, true);
    assert.equal(result.ok && result.stoppedAtPayFast, false);
    assert.deepEqual(events, [], "no second PayFast call, no second write");
  });

  test("uses the seller's real plan name", async () => {
    const { deps } = harness(paidSubscription({ plan: { slug: "pro-ai", name: "Pro AI" } }));
    const result = await cancelShopSubscription("shop_1", deps);
    assert.equal(result.ok && result.planName, "Pro AI");
  });

  test("nothing to cancel on the Free plan or with no subscription", async () => {
    for (const subscription of [null, paidSubscription({ plan: { slug: "free", name: "Free" } })]) {
      const { deps, events } = harness(subscription);
      const result = await cancelShopSubscription("shop_1", deps);
      assert.equal(result.ok, false);
      assert.equal(!result.ok && result.code, "NO_PAID_SUBSCRIPTION");
      assert.deepEqual(events, []);
    }
  });
});

describe("describePayFastFailure", () => {
  test("puts reason, HTTP status and PayFast's message on one line", () => {
    assert.equal(
      describePayFastFailure({ ok: false, reason: "rejected", status: 401, detail: "Merchant authorisation failed" }),
      "rejected — HTTP 401 — Merchant authorisation failed",
    );
    assert.equal(describePayFastFailure({ ok: false, reason: "network" }), "network");
    assert.equal(describePayFastFailure({ ok: true }), "ok");
  });
});
