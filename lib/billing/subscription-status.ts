// ============================================================
// Subscription entitlement — single source of truth for
// "does this shop currently get paid-plan benefits?"
//
// Rules:
// - ACTIVE on a paid plan          → entitled (renewal lapses are
//   handled by the daily expiry cron + its PayFast grace period)
// - CANCELLED on a paid plan       → entitled ONLY until the end of
//   the period they already paid for (currentPeriodEnd). The expiry
//   cron downgrades the row to Free after that.
// - Free plan / anything else     → not entitled
//
// Every feature gate (product limits, AI credits, themes, custom
// domains, PRO badge) must go through this helper. Checking only
// `plan.slug` lets a cancelled subscription keep paid benefits
// forever; checking only `status === "ACTIVE"` strips paying
// sellers of the month they already paid for the moment they cancel.
// ============================================================

export interface SubscriptionLike {
  status: string;
  currentPeriodEnd?: Date | null;
  plan: { slug: string };
}

/**
 * True when the shop is entitled to its paid plan's benefits
 * right now.
 */
export function hasPaidEntitlement(
  subscription: SubscriptionLike | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!subscription) return false;
  if (subscription.plan.slug === "free") return false;

  if (subscription.status === "ACTIVE") return true;

  if (subscription.status === "CANCELLED") {
    const end = subscription.currentPeriodEnd;
    return end != null && end > now;
  }

  return false;
}

/**
 * The plan slug whose limits should be enforced right now —
 * the paid plan while entitled, otherwise "free".
 */
export function effectivePlanSlug(
  subscription: SubscriptionLike | null | undefined,
  now: Date = new Date(),
): string {
  return hasPaidEntitlement(subscription, now) ? subscription!.plan.slug : "free";
}
