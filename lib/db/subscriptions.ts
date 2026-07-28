// ============================================================
// Data Access — Subscriptions & Plans
// ============================================================
// Manages subscription state, plan lookups, and product limit
// enforcement for the freemium business model.
//
// PLANS:
// - Free: 20 products, basic features, 10 AI generations
// - Starter: R99/mo, unlimited products, 25 AI generations
// - Pro: R299/mo, unlimited products, unlimited AI
// - Pro AI: R499/mo, everything + advanced AI
//
// RULES:
// - Every shop gets a Free subscription on creation
// - Product creation checks the limit before allowing
// - PayFast ITN webhook upgrades/downgrades subscriptions
// ============================================================

import { db } from "@/lib/db";
import { effectivePlanSlug, hasPaidEntitlement } from "@/lib/billing/subscription-status";
import { recordShopSubscriptionStarted } from "@/lib/analytics/seller-lifecycle";

/** Free-plan defaults enforced when a shop has no paid entitlement. */
const FREE_PRODUCT_LIMIT = 20;

/**
 * Get or create the Free plan (idempotent).
 * Used during shop creation to auto-assign a subscription.
 */
export async function getFreePlan() {
  return db.plan.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      name: "Free",
      slug: "free",
      priceInCents: 0,
      productLimit: 20,
      features: JSON.stringify([
        "Up to 20 products",
        "10 free AI generations",
        "WhatsApp checkout",
        "Public catalog page",
        "Basic analytics",
      ]),
      isActive: true,
    },
  });
}

/**
 * Get all active plans for display on the billing page.
 */
export async function getPlans() {
  return db.plan.findMany({
    where: { isActive: true },
    orderBy: { priceInCents: "asc" },
  });
}

/**
 * Get a shop's current subscription with plan details.
 */
export async function getShopSubscription(shopId: string) {
  return db.subscription.findUnique({
    where: { shopId },
    include: { plan: true },
  });
}

/**
 * Check if a shop has an active Pro trial.
 * Returns trial info including days remaining.
 */
export function isTrialActive(subscription: { trialEndsAt: Date | null; plan: { slug: string } } | null) {
  if (!subscription?.trialEndsAt) return { active: false, daysLeft: 0 } as const;
  // Only applies to free-plan shops (paid plans don't need trial)
  if (subscription.plan.slug !== "free") return { active: false, daysLeft: 0 } as const;
  const now = new Date();
  if (subscription.trialEndsAt <= now) return { active: false, daysLeft: 0 } as const;
  const daysLeft = Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { active: true, daysLeft } as const;
}

/**
 * Create a Free subscription for a new shop.
 * Called during shop creation.
 */
export async function createFreeSubscription(shopId: string) {
  const freePlan = await getFreePlan();

  // New shops get a 14-day Pro trial
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  return db.subscription.create({
    data: {
      shopId,
      planId: freePlan.id,
      status: "ACTIVE",
      trialEndsAt,
    },
  });
}

/**
 * Upgrade a shop's subscription to a new plan.
 * Called by the PayFast ITN webhook after successful payment.
 */
export async function upgradeSubscription(
  shopId: string,
  planSlug: string,
  payfastToken?: string,
) {
  const plan = await db.plan.findUnique({
    where: { slug: planSlug },
  });

  if (!plan) throw new Error(`Plan not found: ${planSlug}`);

  const now = new Date();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const subscription = await db.subscription.upsert({
    where: { shopId },
    update: {
      planId: plan.id,
      status: "ACTIVE",
      payfastToken: payfastToken ?? null,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
    create: {
      shopId,
      planId: plan.id,
      status: "ACTIVE",
      payfastToken: payfastToken ?? null,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  if (plan.slug !== "free" && plan.priceInCents > 0) {
    await recordShopSubscriptionStarted(shopId, "payfast").catch(() => false);
  }

  return subscription;
}

/**
 * Cancel a subscription (revert to free plan at period end).
 */
export async function cancelSubscription(shopId: string) {
  return db.subscription.update({
    where: { shopId },
    data: { status: "CANCELLED" },
  });
}

/**
 * Check if a shop can create more products.
 * Returns { allowed, current, limit, planName }.
 */
export async function checkProductLimit(shopId: string) {
  const [subscription, productCount] = await Promise.all([
    db.subscription.findUnique({
      where: { shopId },
      include: { plan: true },
    }),
    db.product.count({ where: { shopId } }),
  ]);

  // Paid limits apply only while the subscription is entitled
  // (ACTIVE, or CANCELLED but paid through the current period).
  // A lapsed/cancelled paid plan falls back to Free limits.
  const entitled = hasPaidEntitlement(subscription);
  const limit = entitled ? subscription!.plan.productLimit : FREE_PRODUCT_LIMIT;
  const planName = entitled ? subscription!.plan.name : "Free";

  // Check for active trial — trial gives unlimited products
  const trial = isTrialActive(subscription);

  // 0 means unlimited, or active trial means unlimited
  const unlimited = limit === 0 || trial.active;
  const allowed = unlimited || productCount < limit;

  return {
    allowed,
    current: productCount,
    limit,
    unlimited,
    planName: trial.active ? `${planName} (Trial)` : planName,
  };
}

/**
 * Can this shop UPLOAD hosted product videos?
 * Link videos (YouTube/direct) are free for every plan; hosted
 * uploads cost us storage/bandwidth and require a paid plan.
 * Trial shops count as paid (same semantics as the AI gate).
 */
export async function checkVideoUploadAccess(shopId: string): Promise<{
  allowed: boolean;
  planSlug: string;
}> {
  const subscription = await getShopSubscription(shopId);
  const trial = isTrialActive(subscription);
  return {
    allowed: hasPaidEntitlement(subscription) || trial.active,
    planSlug: effectivePlanSlug(subscription),
  };
}
