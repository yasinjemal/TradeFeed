// ============================================================
// Server Actions — Billing & Subscription
// ============================================================
// Actions for subscription management: checkout URL generation,
// plan switching, cancellation.
// ============================================================

"use server";

import { requireShopAccess } from "@/lib/auth";
import { buildPayFastCheckoutUrl } from "@/lib/payfast";
import { getPlans, getShopSubscription, cancelSubscription } from "@/lib/db/subscriptions";
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
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    // Get the target plan
    const plans = await getPlans();
    const plan = plans.find((p) => p.slug === planSlug);
    if (!plan) return { success: false, error: "Plan not found." };
    if (plan.priceInCents === 0) {
      return { success: false, error: "Cannot checkout for free plan." };
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
      amountInCents: plan.priceInCents,
      buyerEmail: user.email,
      buyerFirstName: user.firstName ?? undefined,
      buyerLastName: user.lastName ?? undefined,
    });

    return { success: true, checkoutUrl };
  } catch (error) {
    console.error("[createCheckout]", error);
    return { success: false, error: "Failed to create checkout." };
  }
}

/**
 * Cancel the current subscription.
 */
export async function cancelSubscriptionAction(
  shopSlug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const subscription = await getShopSubscription(access.shopId);
    if (!subscription || subscription.plan.slug === "free") {
      return { success: false, error: "No active paid subscription." };
    }

    await cancelSubscription(access.shopId);
    return { success: true };
  } catch (error) {
    console.error("[cancelSubscription]", error);
    return { success: false, error: "Failed to cancel subscription." };
  }
}
