// ============================================================
// Unit tests — what a PayFast subscription notification means
// ============================================================
// One shop can have two PayFast subscriptions (an upgrade is a second
// checkout). These tests pin what each notification does in that
// world, because every one of these went wrong before:
//   - an old Starter renewal downgraded a Pro shop
//   - cancelling the replaced subscription cancelled the live plan
//   - a seller who cancelled was re-activated by the next debit
// ============================================================

import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  canStartCheckout,
  decideSubscriptionItn,
  type CurrentSubscriptionState,
  type SubscriptionItnInput,
} from "@/lib/billing/subscription-itn";

const STARTER = { slug: "starter", priceInCents: 9900 };
const PRO = { slug: "pro", priceInCents: 29900 };
const FREE = { slug: "free", priceInCents: 0 };

const T_STARTER = "aaaaaaaa-1111-1111-1111-111111111111";
const T_PRO = "bbbbbbbb-2222-2222-2222-222222222222";

function sub(overrides: Partial<CurrentSubscriptionState> = {}): CurrentSubscriptionState {
  return { status: "ACTIVE", payfastToken: T_STARTER, plan: STARTER, ...overrides };
}

function complete(plan: { slug: string; priceInCents: number }, token: string | undefined, current: CurrentSubscriptionState | null): SubscriptionItnInput {
  return {
    paymentStatus: "COMPLETE",
    incomingPlanSlug: plan.slug,
    incomingPlanPriceCents: plan.priceInCents,
    incomingToken: token,
    current,
  };
}

function cancelled(token: string | undefined, current: CurrentSubscriptionState | null): SubscriptionItnInput {
  return {
    paymentStatus: "CANCELLED",
    incomingPlanSlug: "starter",
    incomingPlanPriceCents: STARTER.priceInCents,
    incomingToken: token,
    current,
  };
}

describe("COMPLETE — first payment and ordinary renewals", () => {
  test("first payment from a Free shop activates the plan and stores the token", () => {
    assert.deepEqual(decideSubscriptionItn(complete(STARTER, T_STARTER, sub({ plan: FREE, payfastToken: null }))), {
      type: "ACTIVATE",
      planSlug: "starter",
      tokenToStore: T_STARTER,
      supersededToken: null,
    });
  });

  test("a shop with no subscription row is activated", () => {
    const action = decideSubscriptionItn(complete(PRO, T_PRO, null));
    assert.deepEqual(action, { type: "ACTIVATE", planSlug: "pro", tokenToStore: T_PRO, supersededToken: null });
  });

  test("a renewal on the same token renews, and cancels nothing", () => {
    assert.deepEqual(decideSubscriptionItn(complete(STARTER, T_STARTER, sub())), {
      type: "ACTIVATE",
      planSlug: "starter",
      tokenToStore: T_STARTER,
      supersededToken: null,
    });
  });

  test("a notification without a token never erases the token we hold", () => {
    const action = decideSubscriptionItn(complete(STARTER, undefined, sub()));
    assert.equal(action.type === "ACTIVATE" && action.tokenToStore, T_STARTER);
  });

  test("a plan paid by manual EFT moving to PayFast is a plain activation", () => {
    const action = decideSubscriptionItn(complete(PRO, T_PRO, sub({ plan: PRO, payfastToken: null })));
    assert.deepEqual(action, { type: "ACTIVATE", planSlug: "pro", tokenToStore: T_PRO, supersededToken: null });
  });
});

describe("COMPLETE — moving between two paid plans", () => {
  test("upgrading Starter → Pro activates Pro and cancels the Starter subscription", () => {
    assert.deepEqual(decideSubscriptionItn(complete(PRO, T_PRO, sub())), {
      type: "ACTIVATE",
      planSlug: "pro",
      tokenToStore: T_PRO,
      supersededToken: T_STARTER,
    });
  });

  test("the old Starter subscription renewing must NOT downgrade the Pro shop", () => {
    const current = sub({ plan: PRO, payfastToken: T_PRO });
    assert.deepEqual(decideSubscriptionItn(complete(STARTER, T_STARTER, current)), {
      type: "SUPERSEDED_SUBSCRIPTION_CHARGED",
      staleToken: T_STARTER,
    });
  });

  test("a shop wrongly downgraded by the old bug is put back on Pro when Pro renews", () => {
    // Before this fix the Starter renewal overwrote plan + token.
    const downgraded = sub({ plan: STARTER, payfastToken: T_STARTER });
    assert.deepEqual(decideSubscriptionItn(complete(PRO, T_PRO, downgraded)), {
      type: "ACTIVATE",
      planSlug: "pro",
      tokenToStore: T_PRO,
      supersededToken: T_STARTER,
    });
  });

  test("a second subscription to the same plan replaces the first", () => {
    const action = decideSubscriptionItn(complete(STARTER, T_PRO, sub()));
    assert.equal(action.type === "ACTIVATE" && action.supersededToken, T_STARTER);
  });
});

describe("COMPLETE — after the seller cancelled", () => {
  test("a debit on the cancelled subscription does NOT silently re-activate it", () => {
    const action = decideSubscriptionItn(complete(STARTER, T_STARTER, sub({ status: "CANCELLED" })));
    assert.deepEqual(action, { type: "CHARGED_AFTER_CANCEL", token: T_STARTER });
  });

  test("re-subscribing after cancelling starts fresh on the new token", () => {
    const action = decideSubscriptionItn(complete(STARTER, T_PRO, sub({ status: "CANCELLED", plan: PRO })));
    assert.deepEqual(action, {
      type: "ACTIVATE",
      planSlug: "starter",
      tokenToStore: T_PRO,
      // The old subscription is already cancelled — nothing to stop.
      supersededToken: null,
    });
  });
});

describe("CANCELLED", () => {
  test("PayFast cancelling the live subscription marks it cancelled", () => {
    assert.deepEqual(decideSubscriptionItn(cancelled(T_STARTER, sub())), { type: "MARK_CANCELLED" });
  });

  test("cancelling the replaced subscription must NOT cancel the live plan", () => {
    // Fired by our own cancel of the Starter subscription right after an upgrade.
    const action = decideSubscriptionItn(cancelled(T_STARTER, sub({ plan: PRO, payfastToken: T_PRO })));
    assert.equal(action.type, "IGNORE");
  });

  test("a plan paid by manual EFT is not affected by a PayFast cancellation", () => {
    const action = decideSubscriptionItn(cancelled(T_STARTER, sub({ plan: PRO, payfastToken: null })));
    assert.equal(action.type, "IGNORE");
  });

  test("a Free shop stays as it is (no CANCELLED badge on the Free plan)", () => {
    const action = decideSubscriptionItn(cancelled(T_STARTER, sub({ plan: FREE, payfastToken: null })));
    assert.equal(action.type, "IGNORE");
  });

  test("no subscription row: nothing to do, and no crash", () => {
    assert.equal(decideSubscriptionItn(cancelled(T_STARTER, null)).type, "IGNORE");
  });

  test("a cancellation without a token still applies to a PayFast-billed plan", () => {
    assert.deepEqual(decideSubscriptionItn(cancelled(undefined, sub())), { type: "MARK_CANCELLED" });
  });
});

describe("other statuses", () => {
  test("FAILED / PENDING / missing change nothing", () => {
    for (const paymentStatus of ["FAILED", "PENDING", undefined]) {
      const action = decideSubscriptionItn({ ...complete(STARTER, T_STARTER, sub()), paymentStatus });
      assert.equal(action.type, "IGNORE");
    }
  });
});

describe("canStartCheckout", () => {
  test("Free shops and shops with no subscription can buy any plan", () => {
    assert.equal(canStartCheckout(null, STARTER.priceInCents), true);
    assert.equal(canStartCheckout(sub({ plan: FREE, payfastToken: null }), PRO.priceInCents), true);
  });

  test("an actively billing shop can only upgrade", () => {
    assert.equal(canStartCheckout(sub(), PRO.priceInCents), true);
    assert.equal(canStartCheckout(sub(), STARTER.priceInCents), false, "same plan again = second subscription");
    assert.equal(canStartCheckout(sub({ plan: PRO, payfastToken: T_PRO }), STARTER.priceInCents), false);
  });

  test("a cancelled subscription can buy any plan", () => {
    assert.equal(canStartCheckout(sub({ status: "CANCELLED", plan: PRO }), STARTER.priceInCents), true);
  });

  test("a plan paid by manual EFT can move to PayFast at any price", () => {
    assert.equal(canStartCheckout(sub({ plan: PRO, payfastToken: null }), PRO.priceInCents), true);
  });
});
