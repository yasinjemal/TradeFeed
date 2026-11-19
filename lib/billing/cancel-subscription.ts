// ============================================================
// Seller-initiated subscription cancellation
// ============================================================
// "Cancel" has to mean two things at once:
//   1. PayFast stops the recurring debit      (their system)
//   2. our row says CANCELLED, paid-through   (our system)
//
// The order matters. PayFast goes first: if it does not confirm, we
// leave our own state untouched and tell the seller it did not work.
// Doing it the other way round is how a seller ends up "cancelled"
// in the dashboard while still being debited every month.
//
// Dependencies are injected so this is unit-testable without a
// database or a network (tests/subscription-cancel.test.ts).
// ============================================================

import type { PayFastApiResult } from "@/lib/payfast-api";

export interface CancellableSubscription {
  status: string;
  payfastToken: string | null;
  currentPeriodEnd: Date | null;
  plan: { slug: string; name: string };
}

export interface CancelSubscriptionDeps {
  getSubscription: (shopId: string) => Promise<CancellableSubscription | null>;
  /** Calls PayFast. Must resolve ok:true only on explicit confirmation. */
  cancelAtPayFast: (token: string) => Promise<PayFastApiResult>;
  /** Local state only — sets our row to CANCELLED. */
  markCancelled: (shopId: string) => Promise<unknown>;
  reportError: (context: string, error: unknown, meta?: Record<string, unknown>) => Promise<void>;
}

export type CancelSubscriptionResult =
  | {
      ok: true;
      planName: string;
      /** Paid plan stays usable until this date (null = no period recorded) */
      endsAt: Date | null;
      /**
       * True when PayFast confirmed, in this call, that the recurring
       * debit is stopped. False when there was no PayFast subscription
       * to stop (manual EFT upgrades) or it was already cancelled.
       */
      stoppedAtPayFast: boolean;
    }
  | {
      ok: false;
      code: "NO_PAID_SUBSCRIPTION" | "PAYFAST_FAILED";
      error: string;
    };

/** One-line description of a failed PayFast API call, for logs and alerts. */
export function describePayFastFailure(result: PayFastApiResult): string {
  if (result.ok) return "ok";
  return [result.reason, result.status ? `HTTP ${result.status}` : null, result.detail]
    .filter(Boolean)
    .join(" — ");
}

export async function cancelShopSubscription(
  shopId: string,
  deps: CancelSubscriptionDeps,
): Promise<CancelSubscriptionResult> {
  const subscription = await deps.getSubscription(shopId);

  if (!subscription || subscription.plan.slug === "free") {
    return {
      ok: false,
      code: "NO_PAID_SUBSCRIPTION",
      error: "No active paid subscription.",
    };
  }

  const summary = {
    planName: subscription.plan.name,
    endsAt: subscription.currentPeriodEnd,
  };

  // Already cancelled — nothing left to stop. Idempotent so a double
  // click or a retry never turns into an error for the seller.
  if (subscription.status === "CANCELLED") {
    return { ok: true, ...summary, stoppedAtPayFast: false };
  }

  // Manual EFT / admin-approved upgrades have no PayFast subscription,
  // so there is no recurring debit to stop.
  if (!subscription.payfastToken) {
    await deps.markCancelled(shopId);
    return { ok: true, ...summary, stoppedAtPayFast: false };
  }

  const payfast = await deps.cancelAtPayFast(subscription.payfastToken);

  if (!payfast.ok) {
    // Telemetry meta is allowlisted (lib/telemetry-privacy.ts), so the
    // diagnosis goes in the error message itself.
    await deps.reportError(
      "payfast-subscription-cancel-failed",
      new Error(`PayFast did not confirm cancellation: ${describePayFastFailure(payfast)}`),
      { shopId, planSlug: subscription.plan.slug },
    );
    return {
      ok: false,
      code: "PAYFAST_FAILED",
      error:
        "We couldn't stop your payments with PayFast, so your subscription is still active. " +
        "Please try again in a few minutes. If it keeps failing, contact support and we'll cancel it for you.",
    };
  }

  await deps.markCancelled(shopId);
  return { ok: true, ...summary, stoppedAtPayFast: true };
}
