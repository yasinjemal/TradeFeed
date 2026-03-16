// ============================================================
// Data Access — Referral Rewards
// ============================================================
// Handles referral reward logic when a referred shop upgrades
// to a paid subscription.
//
// REWARD: Referrer gets 1 free month added to their subscription.
//
// RULES:
// - Only apply reward once per referred shop (idempotent via ReferralReward table)
// - Referrer must have an active subscription to extend
// - If referrer is on free plan, skip (nothing to extend)
// ============================================================

import { db } from "@/lib/db";

/**
 * Apply referral reward: extend the referrer's subscription by 1 month.
 *
 * Called by the PayFast ITN webhook after a referred shop upgrades.
 * Idempotent — uses ReferralReward table (unique on referredShopId).
 *
 * @param referredShopId - The shop that just upgraded (the new customer)
 * @returns Object indicating whether a reward was applied and to whom
 */
export async function applyReferralReward(
  referredShopId: string,
): Promise<{ applied: boolean; referrerSlug?: string; reason?: string }> {
  // 1. Get the referred shop to find who referred them
  const referredShop = await db.shop.findUnique({
    where: { id: referredShopId },
    select: { referredBy: true, slug: true },
  });

  if (!referredShop?.referredBy) {
    return { applied: false, reason: "no-referrer" };
  }

  const referrerSlug = referredShop.referredBy;

  // 2. Check if reward was already applied (idempotency guard)
  const existing = await db.referralReward.findUnique({
    where: { referredShopId },
  });

  if (existing) {
    return { applied: false, referrerSlug, reason: "already-rewarded" };
  }

  // 3. Find the referrer's shop
  const referrerShop = await db.shop.findFirst({
    where: { slug: referrerSlug, isActive: true },
    select: { id: true },
  });

  if (!referrerShop) {
    return { applied: false, referrerSlug, reason: "referrer-not-found" };
  }

  // 4. Check if the referrer has an active paid subscription
  const referrerSub = await db.subscription.findUnique({
    where: { shopId: referrerShop.id },
    include: { plan: true },
  });

  if (!referrerSub) {
    return { applied: false, referrerSlug, reason: "no-subscription" };
  }

  // Don't extend free plans — nothing to extend
  if (referrerSub.plan.priceInCents === 0) {
    return { applied: false, referrerSlug, reason: "referrer-on-free-plan" };
  }

  if (referrerSub.status !== "ACTIVE") {
    return { applied: false, referrerSlug, reason: "referrer-not-active" };
  }

  // 5. Extend subscription + record reward atomically
  const currentEnd = referrerSub.currentPeriodEnd ?? new Date();
  const newEnd = new Date(currentEnd);
  newEnd.setMonth(newEnd.getMonth() + 1);

  await db.$transaction([
    db.subscription.update({
      where: { shopId: referrerShop.id },
      data: { currentPeriodEnd: newEnd },
    }),
    db.referralReward.create({
      data: {
        referrerShopId: referrerShop.id,
        referredShopId,
        rewardType: "FREE_MONTH",
        daysExtended: 30,
      },
    }),
  ]);

  console.log(
    `[referral] Rewarded ${referrerSlug}: extended subscription by 1 month ` +
    `(new end: ${newEnd.toISOString()}) for referring ${referredShop.slug}`
  );

  return { applied: true, referrerSlug };
}

/**
 * Get referral reward stats for a shop (as referrer).
 * Used on the referral dashboard to show rewards earned.
 */
export async function getReferralRewards(shopId: string) {
  const rewards = await db.referralReward.findMany({
    where: { referrerShopId: shopId },
    include: {
      referredShop: {
        select: { name: true, slug: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rewards;
}

/**
 * Get pending referrals — shops that were referred but haven't upgraded yet.
 */
export async function getPendingReferrals(shopSlug: string) {
  const referred = await db.shop.findMany({
    where: {
      referredBy: shopSlug,
      referralRewardReceived: null, // No reward record = not yet converted
    },
    select: {
      name: true,
      slug: true,
      createdAt: true,
      subscription: {
        select: { plan: { select: { slug: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return referred;
}
