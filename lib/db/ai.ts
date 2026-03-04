// ============================================================
// Data Access — AI Feature Gating & Credits
// ============================================================
// Checks whether a shop's subscription plan includes AI features.
// Free-tier shops get 5 AI generations to "taste" the feature.
// Pro AI / Business plans get unlimited generations.
// ============================================================

import { db } from "@/lib/db";

/** Plan slugs that include unlimited AI product generation */
const AI_UNLIMITED_PLANS = ["pro-ai", "business"];

/** Number of free AI generations for non-AI plans */
export const FREE_AI_CREDITS = 5;

/**
 * Check if a shop can use AI features and how many credits remain.
 *
 * WHAT: Looks up the shop's subscription → plan slug + usage counter.
 * WHY: Free users get 5 tries (taste-before-buy). Pro AI = unlimited.
 *
 * @returns { canGenerate, hasUnlimitedAi, creditsRemaining, creditsUsed, planSlug }
 */
export async function checkAiAccess(shopId: string): Promise<{
  canGenerate: boolean;
  hasUnlimitedAi: boolean;
  creditsRemaining: number;
  creditsUsed: number;
  planSlug: string;
}> {
  const [subscription, shop] = await Promise.all([
    db.subscription.findUnique({
      where: { shopId },
      include: { plan: { select: { slug: true } } },
    }),
    db.shop.findUnique({
      where: { id: shopId },
      select: { aiGenerationsUsed: true },
    }),
  ]);

  const planSlug = subscription?.plan.slug ?? "free";
  const hasUnlimitedAi = AI_UNLIMITED_PLANS.includes(planSlug);
  const creditsUsed = shop?.aiGenerationsUsed ?? 0;

  if (hasUnlimitedAi) {
    return { canGenerate: true, hasUnlimitedAi: true, creditsRemaining: Infinity, creditsUsed, planSlug };
  }

  // Free / Pro users: limited credits
  const creditsRemaining = Math.max(0, FREE_AI_CREDITS - creditsUsed);
  return {
    canGenerate: creditsRemaining > 0,
    hasUnlimitedAi: false,
    creditsRemaining,
    creditsUsed,
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
