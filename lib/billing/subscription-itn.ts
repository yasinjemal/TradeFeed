// ============================================================
// Subscription ITN — what to do with a PayFast notification
// ============================================================
// Pure decision logic for app/api/webhooks/payfast. No database, no
// network: given what PayFast told us and what our row says, return
// the one action to take (tests/subscription-itn.test.ts).
//
// WHY THIS EXISTS
// Every PayFast subscription has its own token, and a shop can end up
// with more than one live subscription: upgrading Starter → Pro runs a
// brand-new checkout, which creates a second subscription and leaves
// the first one billing. The webhook used to apply whichever
// notification arrived last, so:
//   - the old Starter renewal silently downgraded a Pro shop
//   - cancelling the old subscription cancelled the shop's current plan
//   - a seller who cancelled in-app was re-activated by the next debit
// Matching on the token is what tells these apart.
//
// RULE FOR TWO LIVE SUBSCRIPTIONS
// The more expensive plan wins and the other one is cancelled at
// PayFast. This is safe because checkout only ever sells upgrades
// while a paid plan is active (createCheckoutAction enforces it), so
// a cheaper plan on a different token can only be the one that was
// replaced.
// ============================================================

export interface CurrentSubscriptionState {
  status: string;
  payfastToken: string | null;
  plan: { slug: string; priceInCents: number };
}

export interface SubscriptionItnInput {
  /** PayFast payment_status */
  paymentStatus: string | undefined;
  /** Plan slug parsed from m_payment_id ("{shopId}:{planSlug}") */
  incomingPlanSlug: string;
  /** Monthly price of that plan in cents (0 when the plan is unknown) */
  incomingPlanPriceCents: number;
  /** PayFast subscription token from the notification, if any */
  incomingToken: string | undefined;
  /** Our subscription row for the shop, or null when there is none */
  current: CurrentSubscriptionState | null;
}

export type SubscriptionItnAction =
  /**
   * Put the shop on `planSlug` for a fresh month.
   * `supersededToken` (when set) is an older PayFast subscription that
   * this one replaces — cancel it at PayFast so the seller is not
   * billed for both.
   */
  | { type: "ACTIVATE"; planSlug: string; tokenToStore: string | null; supersededToken: string | null }
  /**
   * PayFast debited a subscription the seller already cancelled with
   * us. They paid, so they keep the plan for that month — but the
   * subscription stays CANCELLED, is cancelled at PayFast again, and
   * the owner is alerted because a refund may be owed.
   */
  | { type: "CHARGED_AFTER_CANCEL"; token: string }
  /**
   * A subscription that was replaced by a pricier one has been debited
   * again. Do not change the shop's plan; cancel that old subscription
   * at PayFast and alert the owner (the seller was billed twice).
   */
  | { type: "SUPERSEDED_SUBSCRIPTION_CHARGED"; staleToken: string }
  /** PayFast says the subscription is cancelled — record it locally. */
  | { type: "MARK_CANCELLED" }
  | { type: "IGNORE"; reason: string };

export function decideSubscriptionItn(input: SubscriptionItnInput): SubscriptionItnAction {
  const { paymentStatus, current } = input;
  const incomingToken = input.incomingToken?.trim() || null;
  const currentToken = current?.payfastToken ?? null;

  if (paymentStatus === "COMPLETE") {
    const activate = (supersededToken: string | null): SubscriptionItnAction => ({
      type: "ACTIVATE",
      planSlug: input.incomingPlanSlug,
      // Never drop a token we already hold: it is the only handle for
      // cancelling the subscription later.
      tokenToStore: incomingToken ?? currentToken,
      supersededToken,
    });

    // First PayFast payment for this shop, or nothing to compare against.
    if (!current || !currentToken || !incomingToken) return activate(null);

    // Same subscription we already know about.
    if (currentToken === incomingToken) {
      return current.status === "CANCELLED"
        ? { type: "CHARGED_AFTER_CANCEL", token: incomingToken }
        : activate(null);
    }

    // ── Two different PayFast subscriptions for one shop ──

    // The one on record is finished (cancelled, or already back on
    // Free), so the new one simply takes over.
    if (current.status === "CANCELLED" || current.plan.slug === "free") {
      return activate(null);
    }

    // Both live: the pricier plan wins, the other is cancelled.
    if (input.incomingPlanPriceCents >= current.plan.priceInCents) {
      return activate(currentToken);
    }
    return { type: "SUPERSEDED_SUBSCRIPTION_CHARGED", staleToken: incomingToken };
  }

  if (paymentStatus === "CANCELLED") {
    if (!current) return { type: "IGNORE", reason: "no subscription on record" };
    if (current.plan.slug === "free") return { type: "IGNORE", reason: "shop is already on the Free plan" };

    // Not billed through PayFast (manual EFT / admin grant): a PayFast
    // cancellation cannot be about this plan.
    if (!currentToken) return { type: "IGNORE", reason: "current plan is not a PayFast subscription" };

    // A different subscription was cancelled — expected right after an
    // upgrade, when we cancel the one that was replaced.
    if (incomingToken && incomingToken !== currentToken) {
      return { type: "IGNORE", reason: "cancellation is for a superseded subscription" };
    }

    return { type: "MARK_CANCELLED" };
  }

  return { type: "IGNORE", reason: `unhandled payment_status: ${paymentStatus ?? "missing"}` };
}

/**
 * Checkout guard. While a PayFast subscription is actively billing,
 * the only checkout we allow is an upgrade to a more expensive plan —
 * anything else would open a second subscription that the rule above
 * would resolve the wrong way. Free shops, cancelled subscriptions and
 * plans paid by manual EFT (no PayFast token) can buy any plan.
 */
export function canStartCheckout(
  current: CurrentSubscriptionState | null,
  targetPriceInCents: number,
): boolean {
  if (!current || current.plan.slug === "free") return true;
  if (current.status !== "ACTIVE" || !current.payfastToken) return true;
  return targetPriceInCents > current.plan.priceInCents;
}
