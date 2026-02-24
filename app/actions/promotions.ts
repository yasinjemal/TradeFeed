// ============================================================
// Server Actions — Promoted Listings
// ============================================================
// Actions for the seller promotion flow:
// - Generate PayFast checkout URL for a promotion
// - Cancel an active promotion
// ============================================================

"use server";

import { requireShopAccess } from "@/lib/auth";
import { buildPromotionCheckoutUrl } from "@/lib/payfast";
import { db } from "@/lib/db";
import {
  type PromotionTierKey,
  PROMOTION_TIERS,
  PROMOTION_DURATIONS,
  calculatePromotionPrice,
  buildPromotionPaymentId,
  formatZAR,
} from "@/lib/config/promotions";
import { hasActivePromotion, cancelPromotion } from "@/lib/db/promotions";
import { revalidatePath } from "next/cache";

interface PromotionActionResult {
  success: boolean;
  error?: string;
  checkoutUrl?: string;
}

/**
 * Generate a PayFast checkout URL for promoting a product.
 *
 * FLOW:
 * 1. Validate access + inputs
 * 2. Check product is promotable (exists, has images, has variants)
 * 3. Check no existing active promotion
 * 4. Calculate price
 * 5. Build PayFast one-time payment URL
 * 6. Return URL for client-side redirect
 */
export async function purchasePromotionAction(
  shopSlug: string,
  productId: string,
  tier: string,
  weeks: number,
): Promise<PromotionActionResult> {
  try {
    // Auth
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    // Validate tier
    if (!PROMOTION_TIERS[tier as PromotionTierKey]) {
      return { success: false, error: "Invalid promotion tier." };
    }
    const tierKey = tier as PromotionTierKey;

    // Validate duration
    const duration = PROMOTION_DURATIONS.find((d) => d.weeks === weeks);
    if (!duration) {
      return { success: false, error: "Invalid promotion duration." };
    }

    // Verify product belongs to this shop and is promotable
    const product = await db.product.findFirst({
      where: {
        id: productId,
        shopId: access.shopId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        images: { select: { id: true }, take: 1 },
        variants: { where: { isActive: true }, select: { id: true }, take: 1 },
      },
    });

    if (!product) {
      return { success: false, error: "Product not found." };
    }
    if (product.images.length === 0) {
      return { success: false, error: "Product needs at least one image to be promoted." };
    }
    if (product.variants.length === 0) {
      return { success: false, error: "Product needs active variants to be promoted." };
    }

    // Check for existing active promotion
    const alreadyPromoted = await hasActivePromotion(productId);
    if (alreadyPromoted) {
      return { success: false, error: "This product already has an active promotion." };
    }

    // Calculate price
    const totalCents = calculatePromotionPrice(tierKey, weeks);
    const tierConfig = PROMOTION_TIERS[tierKey];

    // Get user details
    const user = await db.user.findUnique({
      where: { id: access.userId },
      select: { email: true, firstName: true, lastName: true },
    });
    if (!user) return { success: false, error: "User not found." };

    // Build PayFast checkout URL
    const paymentId = buildPromotionPaymentId(access.shopId, productId, tierKey, weeks);

    const checkoutUrl = buildPromotionCheckoutUrl({
      paymentId,
      shopSlug,
      amountInCents: totalCents,
      itemName: `TradeFeed ${tierConfig.name} Promotion — ${duration.label}`,
      itemDescription: `${tierConfig.name} promotion for "${product.name}" (${duration.label})`,
      buyerEmail: user.email,
      buyerFirstName: user.firstName ?? undefined,
      buyerLastName: user.lastName ?? undefined,
    });

    return { success: true, checkoutUrl };
  } catch (error) {
    console.error("[purchasePromotion]", error);
    return { success: false, error: "Failed to create checkout." };
  }
}

/**
 * Cancel an active promotion.
 * NOTE: No refund — just stops the promotion immediately.
 */
export async function cancelPromotionAction(
  shopSlug: string,
  promotionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const cancelled = await cancelPromotion(promotionId, access.shopId);
    if (!cancelled) {
      return { success: false, error: "Promotion not found or already cancelled." };
    }

    revalidatePath(`/dashboard/${shopSlug}/promote`);
    revalidatePath("/marketplace");

    return { success: true };
  } catch (error) {
    console.error("[cancelPromotion]", error);
    return { success: false, error: "Failed to cancel promotion." };
  }
}
