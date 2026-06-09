// ============================================================
// Data Access — Activation Funnel
// ============================================================
// Queries that power the /admin/activation dashboard.
//
// Funnel definition (5 steps):
//   1. Signups       — new User records in the period
//   2. Shop Created  — shops created in the period
//   3. Product Added — shops in period with ≥1 active product
//   4. Catalog Shared — shops whose owner tapped Share (onboarding event)
//   5. First Buyer View — shops in period that appear in AnalyticsEvent
//
// NOTE: AnalyticsEvent has no Prisma @relation back to Shop
// (shopId is a plain field), so buyer-view checks are done via
// separate groupBy queries and cross-referenced in JS.
// ============================================================

import { db } from "@/lib/db";

export type FunnelPeriod = "7d" | "30d" | "all";

export interface FunnelStep {
  key: string;
  label: string;
  description: string;
  count: number;
  pctOfTop: number;   // % of step 1 (signups)
  pctOfPrev: number;  // % of the previous step
}

export interface RecentSeller {
  shopId: string;
  shopName: string;
  shopSlug: string;
  city: string | null;
  ownerName: string | null;
  createdAt: Date;
  productCount: number;
  hasBuyerView: boolean;
  stage: "shop_created" | "product_added" | "catalog_shared" | "first_buyer_view";
  isActive: boolean; // ≥3 products + buyer view in last 30d
}

export interface ActivationStats {
  period: FunnelPeriod;
  periodStart: Date;
  activeSellers: number;
  funnel: FunnelStep[];
  recentSellers: RecentSeller[];
}

function getPeriodStart(period: FunnelPeriod): Date {
  if (period === "7d")  return new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
  if (period === "30d") return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return new Date(0); // all time
}

export async function getActivationStats(period: FunnelPeriod = "30d"): Promise<ActivationStats> {
  const periodStart  = getPeriodStart(period);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // ── Step 1: Get all shopIds that have any PAGE_VIEW ────────
  // AnalyticsEvent has no @relation on Shop, so we query it separately.
  const [allViewRows, recentViewRows] = await Promise.all([
    db.analyticsEvent.groupBy({
      by: ["shopId"],
      where: { type: "PAGE_VIEW" },
    }),
    db.analyticsEvent.groupBy({
      by: ["shopId"],
      where: { type: "PAGE_VIEW", createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  const shopIdsWithAnyView    = new Set(allViewRows.map((r) => r.shopId));
  const shopIdsWithRecentView = new Set(recentViewRows.map((r) => r.shopId));

  // ── Step 2: Run core funnel queries in parallel ────────────
  const [
    signups,
    shopCreated,
    productAdded,
    catalogShared,
    recentShopsRaw,
  ] = await Promise.all([
    // 1. Signups
    db.user.count({ where: { createdAt: { gte: periodStart } } }),

    // 2. Shop Created
    db.shop.count({ where: { isActive: true, createdAt: { gte: periodStart } } }),

    // 3. Product Added
    db.shop.count({
      where: {
        isActive: true,
        createdAt: { gte: periodStart },
        products: { some: { isActive: true } },
      },
    }),

    // 4. Catalog Shared — shops in period whose owner has a catalog_shared event
    db.shop.count({
      where: {
        isActive: true,
        createdAt: { gte: periodStart },
        users: {
          some: {
            role: "OWNER",
            user: { onboardingEvents: { some: { step: "catalog_shared" } } },
          },
        },
      },
    }),

    // Recent shops for the table
    db.shop.findMany({
      where: { isActive: true, createdAt: { gte: periodStart } },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        createdAt: true,
        _count: { select: { products: { where: { isActive: true } } } },
        users: {
          where: { role: "OWNER" },
          take: 1,
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                onboardingEvents: {
                  where: { step: "catalog_shared" },
                  take: 1,
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  // ── Step 3: Compute first-buyer-view count ─────────────────
  // Cross-reference shops in period against the pre-fetched view set
  const firstBuyerView = recentShopsRaw.filter((s) =>
    shopIdsWithAnyView.has(s.id)
  ).length;

  // Accurate count for the funnel (all shops in period, not just the 25 shown)
  const allShopsInPeriod = await db.shop.findMany({
    where: { isActive: true, createdAt: { gte: periodStart } },
    select: { id: true },
  });
  const firstBuyerViewCount = allShopsInPeriod.filter((s) =>
    shopIdsWithAnyView.has(s.id)
  ).length;

  // ── Step 4: Active sellers (headline metric) ───────────────
  // Shops with ≥3 products AND a buyer view in the last 30 days
  const shopsWithRecentView = await db.shop.findMany({
    where: { isActive: true, id: { in: [...shopIdsWithRecentView] } },
    select: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  const activeSellers = shopsWithRecentView.filter((s) => s._count.products >= 3).length;

  // ── Build funnel steps ─────────────────────────────────────
  const stepValues: [string, string, string, number][] = [
    ["signups",           "Signups",           "New user registrations",    signups],
    ["shop_created",      "Shop Created",      "Created a shop",            shopCreated],
    ["product_added",     "Product Added",     "Added ≥1 product",          productAdded],
    ["catalog_shared",    "Catalog Shared",    "Tapped Share on WhatsApp",  catalogShared],
    ["first_buyer_view",  "First Buyer View",  "Shop got at least one view", firstBuyerViewCount],
  ];

  const funnel: FunnelStep[] = stepValues.map(([key, label, description, count], i) => ({
    key,
    label,
    description,
    count,
    pctOfTop:  signups > 0 ? Math.round((count / signups) * 100) : 0,
    pctOfPrev: i === 0
      ? 100
      : stepValues[i - 1]![3] > 0
        ? Math.round((count / stepValues[i - 1]![3]) * 100)
        : 0,
  }));

  // ── Shape recent sellers ───────────────────────────────────
  const recentSellers: RecentSeller[] = recentShopsRaw.map((shop) => {
    const owner = shop.users[0]?.user ?? null;
    const hasBuyerView = shopIdsWithAnyView.has(shop.id);
    const hasShared    = (owner?.onboardingEvents.length ?? 0) > 0;
    const hasProduct   = shop._count.products > 0;

    const stage: RecentSeller["stage"] = hasBuyerView
      ? "first_buyer_view"
      : hasShared
        ? "catalog_shared"
        : hasProduct
          ? "product_added"
          : "shop_created";

    const ownerName = owner
      ? [owner.firstName, owner.lastName].filter(Boolean).join(" ") || null
      : null;

    return {
      shopId:       shop.id,
      shopName:     shop.name,
      shopSlug:     shop.slug,
      city:         shop.city,
      ownerName,
      createdAt:    shop.createdAt,
      productCount: shop._count.products,
      hasBuyerView,
      stage,
      isActive:     shop._count.products >= 3 && shopIdsWithRecentView.has(shop.id),
    };
  });

  return { period, periodStart, activeSellers, funnel, recentSellers };
}
