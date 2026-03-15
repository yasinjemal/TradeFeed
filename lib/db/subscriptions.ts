// ============================================================
// Data Access — Subscriptions & Plans
// ============================================================
// Manages subscription state, plan lookups, and product limit
// enforcement for the freemium business model.
//
// PLANS:
// - Free: 10 products, basic features
// - Pro: R199/mo, unlimited products, priority badge
//
// RULES:
// - Every shop gets a Free subscription on creation
// - Product creation checks the limit before allowing
// - PayFast ITN webhook upgrades/downgrades subscriptions
// ============================================================

import { db } from "@/lib/db";

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
      productLimit: 10,
      features: JSON.stringify([
        "Up to 10 products",
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

  return db.subscription.upsert({
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

  // No subscription = use default free limits
  const limit = subscription?.plan.productLimit ?? 10;
  const planName = subscription?.plan.name ?? "Free";

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
