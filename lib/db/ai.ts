// ============================================================
// Data Access — AI Feature Gating
// ============================================================
// Checks whether a shop's subscription plan includes AI features.
// Used by the AI generation endpoint before calling the AI provider.
// ============================================================

import { db } from "@/lib/db";

/** Plan slugs that include AI product generation */
const AI_ENABLED_PLANS = ["pro-ai", "business"];

/**
 * Check if a shop has access to AI features.
 *
 * WHAT: Looks up the shop's subscription → plan slug.
 * WHY: AI generation is a paid feature, gated to PRO_AI+ plans.
 *
 * @returns { hasAccess, planSlug } — hasAccess is true if plan includes AI
 */
export async function checkAiAccess(shopId: string): Promise<{
  hasAccess: boolean;
  planSlug: string;
}> {
  const subscription = await db.subscription.findUnique({
    where: { shopId },
    include: { plan: { select: { slug: true } } },
  });

  const planSlug = subscription?.plan.slug ?? "free";
  const hasAccess = AI_ENABLED_PLANS.includes(planSlug);

  return { hasAccess, planSlug };
}
