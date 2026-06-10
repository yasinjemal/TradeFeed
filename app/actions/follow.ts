// ============================================================
// Server Actions — Shop Follows (Buyer Retention, Phase 1)
// ============================================================
// Follow/unfollow shops. Requires a signed-in buyer (Clerk —
// buyers sign in passwordlessly via WhatsApp magic link).
// Anonymous visitors get { needsAuth: true } so the UI can
// route them to /whatsapp-login.
//
// Gated behind FEATURE_FLAGS.SHOP_FOLLOW.
// ============================================================

"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import {
  followShop,
  unfollowShop,
  isFollowingShop,
  getOrCreateBuyerProfile,
} from "@/lib/db/buyers";

interface FollowResult {
  success: boolean;
  following?: boolean;
  needsAuth?: boolean;
  error?: string;
}

export async function toggleFollowShopAction(shopId: string): Promise<FollowResult> {
  if (!FEATURE_FLAGS.SHOP_FOLLOW) {
    return { success: false, error: "Not available" };
  }

  const { userId } = await auth();
  if (!userId) {
    return { success: false, needsAuth: true };
  }

  try {
    const buyer = await getOrCreateBuyerProfile(userId);
    const following = await isFollowingShop(buyer.id, shopId);

    if (following) {
      await unfollowShop(buyer.id, shopId);
    } else {
      await followShop(buyer.id, shopId);
    }

    revalidatePath("/me");
    return { success: true, following: !following };
  } catch (error) {
    console.error("[follow] toggle failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Initial state for the follow button (server-rendered pages). */
export async function getFollowStateAction(shopId: string): Promise<FollowResult> {
  if (!FEATURE_FLAGS.SHOP_FOLLOW) {
    return { success: true, following: false };
  }

  const { userId } = await auth();
  if (!userId) return { success: true, following: false };

  try {
    const buyer = await getOrCreateBuyerProfile(userId);
    const following = await isFollowingShop(buyer.id, shopId);
    return { success: true, following };
  } catch {
    return { success: true, following: false };
  }
}
