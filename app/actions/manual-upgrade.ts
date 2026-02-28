// ============================================================
// Server Actions — Manual Upgrade Request
// ============================================================
// Seller submits a manual upgrade request with payment proof.
// Admin reviews and approves/rejects from the admin panel.
// ============================================================

"use server";

import { requireShopAccess } from "@/lib/auth";
import { getShopSubscription } from "@/lib/db/subscriptions";
import { submitUpgradeRequest } from "@/lib/db/manual-payments";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface UpgradeRequestResult {
  success: boolean;
  error?: string;
}

/**
 * Submit a manual upgrade request (seller action).
 * Does NOT change the plan — only flags subscription for admin review.
 */
export async function submitUpgradeRequestAction(
  shopSlug: string,
  data: {
    requestedPlanSlug: string;
    manualPaymentMethod: string;
    paymentReference: string;
    proofOfPaymentUrl?: string;
  },
): Promise<UpgradeRequestResult> {
  try {
    // Auth check — only shop members can request upgrade
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    // Only OWNER can request upgrades
    if (access.role !== "OWNER") {
      return { success: false, error: "Only the shop owner can request an upgrade." };
    }

    // Validate requested plan exists
    const targetPlan = await db.plan.findUnique({
      where: { slug: data.requestedPlanSlug },
    });
    if (!targetPlan) return { success: false, error: "Plan not found." };
    if (targetPlan.priceInCents === 0) {
      return { success: false, error: "Cannot upgrade to a free plan." };
    }

    // Check current subscription
    const subscription = await getShopSubscription(access.shopId);
    if (!subscription) {
      return { success: false, error: "No subscription found. Please contact support." };
    }

    // Don't allow if already on the same or higher plan
    if (subscription.plan.slug === data.requestedPlanSlug) {
      return { success: false, error: "You're already on this plan." };
    }

    // Don't allow if there's already a pending request
    if (subscription.upgradeStatus === "UNDER_REVIEW") {
      return { success: false, error: "You already have a pending upgrade request." };
    }

    // Validate payment reference is not empty
    if (!data.paymentReference.trim()) {
      return { success: false, error: "Payment reference is required." };
    }

    // Submit the request
    await submitUpgradeRequest(access.shopId, {
      requestedPlanSlug: data.requestedPlanSlug,
      manualPaymentMethod: data.manualPaymentMethod,
      paymentReference: data.paymentReference.trim(),
      proofOfPaymentUrl: data.proofOfPaymentUrl,
    });

    revalidatePath(`/dashboard/${shopSlug}/billing`);
    return { success: true };
  } catch (error) {
    console.error("[submitUpgradeRequest]", error);
    return { success: false, error: "Failed to submit upgrade request." };
  }
}
