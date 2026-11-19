// ============================================================
// Data Access — AI Feature Gating & Credits
// ============================================================
// Checks whether a shop's subscription plan includes AI features.
// The allowance per plan is read from lib/billing/plans.ts
// (aiGenerationsPerMonth) — the same number the pricing pages
// advertise — so the limit enforced here cannot drift from the
// limit promised there.
// ============================================================

import { db } from "@/lib/db";
import { effectivePlanSlug } from "@/lib/billing/subscription-status";
import { aiListingLimit } from "@/lib/billing/plans";

/** Slug that predates lib/billing/plans.ts and still means unlimited AI */
const LEGACY_UNLIMITED_AI_PLANS = ["business"];

/** Maximum AI generations per shop per day (safety cap, even for unlimited plans) */
export const AI_DAILY_LIMIT = 50;

/**
 * Check if a shop can use AI features and how many credits remain.
 *
 * WHAT: Looks up the shop's subscription → plan slug + usage counter.
 * WHY: Free and Starter have a limited allowance; Pro and Pro AI are unlimited.
 *
 * @returns { canGenerate, hasUnlimitedAi, creditsRemaining, creditsUsed, creditLimit, planSlug }
 */
export async function checkAiAccess(shopId: string): Promise<{
  canGenerate: boolean;
  hasUnlimitedAi: boolean;
  creditsRemaining: number;
  creditsUsed: number;
  /** The plan's allowance (null = unlimited) — what "X of Y" should show */
  creditLimit: number | null;
  planSlug: string;
}> {
  const [subscription, shop] = await Promise.all([
    db.subscription.findUnique({
      where: { shopId },
      select: {
        status: true,
        currentPeriodEnd: true,
        plan: { select: { slug: true } },
      },
    }),
    db.shop.findUnique({
      where: { id: shopId },
      select: { aiGenerationsUsed: true },
    }),
  ]);

  // Paid AI allowances only while the subscription is entitled —
  // a cancelled/lapsed paid plan falls back to Free credits.
  const planSlug = effectivePlanSlug(subscription);
  const creditLimit = LEGACY_UNLIMITED_AI_PLANS.includes(planSlug)
    ? null
    : aiListingLimit(planSlug);
  const creditsUsed = shop?.aiGenerationsUsed ?? 0;

  if (creditLimit === null) {
    return {
      canGenerate: true,
      hasUnlimitedAi: true,
      creditsRemaining: Infinity,
      creditsUsed,
      creditLimit: null,
      planSlug,
    };
  }

  // Free / Starter users: limited credits based on plan
  const creditsRemaining = Math.max(0, creditLimit - creditsUsed);
  return {
    canGenerate: creditsRemaining > 0,
    hasUnlimitedAi: false,
    creditsRemaining,
    creditsUsed,
    creditLimit,
    planSlug,
  };
}

/**
 * Increment the AI generation counter for a shop.
 * Called after a successful AI generation.
 */
export async function trackAiGeneration(shopId: string): Promise<void> {
  await db.shop.update({
    where: { id: shopId },
    data: { aiGenerationsUsed: { increment: 1 } },
  });
}
