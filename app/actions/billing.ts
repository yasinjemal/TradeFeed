// ============================================================
// Server Actions — Billing & Subscription
// ============================================================
// Actions for subscription management: checkout URL generation,
// plan switching, cancellation.
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireShopAccess } from "@/lib/auth";
import { buildPayFastCheckoutUrl, buildShopBoostCheckoutUrl } from "@/lib/payfast";
import { cancelPayFastSubscription } from "@/lib/payfast-api";
import { getPlans, getShopSubscription, markSubscriptionCancelled } from "@/lib/db/subscriptions";
import { cancelShopSubscription } from "@/lib/billing/cancel-subscription";
import { canStartCheckout } from "@/lib/billing/subscription-itn";
import { PICKED_PLAN_COOKIE } from "@/lib/billing/upgrade-copy";
import { buildShopBoostPaymentId, calculateShopBoostPrice, SHOP_BOOST_DURATIONS } from "@/lib/config/promotions";
import { reportError } from "@/lib/telemetry";
import { db } from "@/lib/db";

interface BillingActionResult {
  success: boolean;
  error?: string;
  checkoutUrl?: string;
}

/**
 * Generate a PayFast checkout URL for upgrading to a paid plan.
 */
export async function createCheckoutAction(
  shopSlug: string,
  planSlug: string,
): Promise<BillingActionResult> {
  try {
    const access = await requireShopAccess(shopSlug, "billing:manage");
    if (!access) return { success: false, error: "Access denied." };

    // Get the target plan
    const plans = await getPlans();
    const plan = plans.find((p) => p.slug === planSlug);
    if (!plan) return { success: false, error: "Plan not found." };
    if (plan.priceInCents === 0) {
      return { success: false, error: "Cannot checkout for free plan." };
    }

    // Every checkout creates a NEW PayFast subscription. While one is
    // already billing, only an upgrade is allowed — the webhook cancels
    // the cheaper one it replaces. Anything else would leave the seller
    // paying for two plans.
    const current = await getShopSubscription(access.shopId);
    if (!canStartCheckout(current, plan.priceInCents)) {
      return {
        success: false,
        error:
          `You're already paying for ${current?.plan.name ?? "a plan"}. ` +
          "To move to this plan, cancel your current subscription first — you can choose a new plan once it ends.",
      };
    }

    // Get user details for PayFast
    const user = await db.user.findUnique({
      where: { id: access.userId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (!user) return { success: false, error: "User not found." };

    const checkoutUrl = buildPayFastCheckoutUrl({
      shopId: access.shopId,
      shopSlug,
      planName: plan.name,
      planSlug: plan.slug,
      amountInCents: plan.priceInCents,
      buyerEmail: user.email,
      buyerFirstName: user.firstName ?? undefined,
      buyerLastName: user.lastName ?? undefined,
    });

    // They are acting on the plan they picked earlier (app/choose-plan),
    // so stop reminding them about it.
    (await cookies()).delete(PICKED_PLAN_COOKIE);

    return { success: true, checkoutUrl };
  } catch (error) {
    console.error("[createCheckout]", error);
    return { success: false, error: "Failed to create checkout." };
  }
}

export interface CancelSubscriptionActionResult {
  success: boolean;
  error?: string;
  /** Name of the plan that was cancelled, e.g. "Starter" */
  planName?: string;
  /** ISO date the paid plan stays usable until */
  endsAt?: string | null;
  /** True when PayFast confirmed the recurring debit is stopped */
  stoppedAtPayFast?: boolean;
}

/**
 * Cancel the current subscription.
 *
 * Stops the recurring debit at PayFast first, and only then marks the
 * subscription cancelled here. If PayFast does not confirm, nothing
 * changes and the seller is told it did not work.
 */
export async function cancelSubscriptionAction(
  shopSlug: string,
): Promise<CancelSubscriptionActionResult> {
  try {
    const access = await requireShopAccess(shopSlug, "billing:manage");
    if (!access) return { success: false, error: "Access denied." };

    const result = await cancelShopSubscription(access.shopId, {
      getSubscription: getShopSubscription,
      cancelAtPayFast: cancelPayFastSubscription,
      markCancelled: markSubscriptionCancelled,
      reportError,
    });

    if (!result.ok) return { success: false, error: result.error };

    revalidatePath(`/dashboard/${shopSlug}/billing`);
    return {
      success: true,
      planName: result.planName,
      endsAt: result.endsAt ? result.endsAt.toISOString() : null,
      stoppedAtPayFast: result.stoppedAtPayFast,
    };
  } catch (error) {
    console.error("[cancelSubscription]", error);
    return { success: false, error: "Failed to cancel subscription." };
  }
}

/**
 * Purchase a shop boost (featured listing on marketplace).
 */
export async function purchaseShopBoostAction(
  shopSlug: string,
  weeks: number,
): Promise<BillingActionResult> {
  try {
    const access = await requireShopAccess(shopSlug, "billing:manage");
    if (!access) return { success: false, error: "Access denied." };

    // Validate duration
    const validDuration = SHOP_BOOST_DURATIONS.find((d) => d.weeks === weeks);
    if (!validDuration) return { success: false, error: "Invalid boost duration." };

    const amountInCents = calculateShopBoostPrice(weeks);
    const paymentId = buildShopBoostPaymentId(access.shopId, weeks);

    const user = await db.user.findUnique({
      where: { id: access.userId },
      select: { email: true, firstName: true, lastName: true },
    });
    if (!user) return { success: false, error: "User not found." };

    const checkoutUrl = buildShopBoostCheckoutUrl({
      paymentId,
      shopSlug,
      amountInCents,
      weeks,
      buyerEmail: user.email,
      buyerFirstName: user.firstName ?? undefined,
      buyerLastName: user.lastName ?? undefined,
    });

    return { success: true, checkoutUrl };
  } catch (error) {
    console.error("[purchaseShopBoost]", error);
    return { success: false, error: "Failed to create boost checkout." };
  }
}
