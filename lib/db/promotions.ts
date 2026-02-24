// ============================================================
// Data Access — Promoted Listings
// ============================================================
// CRUD and query operations for the PromotedListing model.
//
// RULES:
// - Tenant-scoped: all writes verify shopId ownership
// - Expiry is checked on read (mark EXPIRED on the fly)
// - Performance stats returned for seller dashboard
// ============================================================

import { db } from "@/lib/db";
import type { PromotionTierKey } from "@/lib/config/promotions";

// ── Types ────────────────────────────────────────────────────

export interface PromotionWithProduct {
  id: string;
  tier: string;
  status: string;
  startsAt: Date;
  expiresAt: Date;
  impressions: number;
  clicks: number;
  amountPaidCents: number;
  payfastPaymentId: string | null;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    images: { url: string }[];
    variants: { priceInCents: number }[];
  };
}

export interface PromotionStats {
  activeCount: number;
  totalSpentCents: number;
  totalImpressions: number;
  totalClicks: number;
}

/** M6.4 — Per-promotion daily performance data for charting */
export interface PromotionDailyPerformance {
  promotionId: string;
  productName: string;
  tier: string;
  dailyData: { date: string; impressions: number; clicks: number }[];
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  daysActive: number;
  avgImpressionsPerDay: number;
  avgClicksPerDay: number;
}

/** M6.5 — Promoted vs organic comparison */
export interface PromotionComparison {
  promotedViews: number;
  organicViews: number;
  multiplier: number; // e.g. 3.2 = "3.2x more views"
  estimatedOrders: { low: number; high: number };
  conversionRate: number; // platform avg click → WA order rate
}

// ── Expiry Check ─────────────────────────────────────────────

/**
 * M5.4 — Mark expired promotions as EXPIRED.
 *
 * Called on marketplace page load and promote dashboard load.
 * Uses a single updateMany — very efficient.
 */
export async function expirePromotedListings(): Promise<number> {
  const now = new Date();

  const result = await db.promotedListing.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: now },
    },
    data: {
      status: "EXPIRED",
    },
  });

  if (result.count > 0) {
    console.log(`[promotions] Expired ${result.count} promoted listing(s)`);
  }

  return result.count;
}

// ── Create ───────────────────────────────────────────────────

/**
 * Create a new promoted listing after PayFast payment confirmation.
 */
export async function createPromotedListing(params: {
  shopId: string;
  productId: string;
  tier: PromotionTierKey;
  weeks: number;
  amountPaidCents: number;
  payfastPaymentId?: string;
}): Promise<{ id: string }> {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + params.weeks * 7);

  // Verify the product belongs to the shop (tenant isolation)
  const product = await db.product.findFirst({
    where: { id: params.productId, shopId: params.shopId },
    select: { id: true },
  });

  if (!product) {
    throw new Error("Product not found or access denied");
  }

  const listing = await db.promotedListing.create({
    data: {
      tier: params.tier,
      status: "ACTIVE",
      shopId: params.shopId,
      productId: params.productId,
      startsAt: now,
      expiresAt,
      amountPaidCents: params.amountPaidCents,
      payfastPaymentId: params.payfastPaymentId ?? null,
    },
    select: { id: true },
  });

  console.log(
    `[promotions] Created ${params.tier} promotion for product ${params.productId} ` +
    `(shop ${params.shopId}), expires ${expiresAt.toISOString()}`
  );

  return listing;
}

// ── Read ─────────────────────────────────────────────────────

/**
 * Get all promotions for a shop (for the seller dashboard).
 * Returns active first, then expired/cancelled, newest first.
 */
export async function getShopPromotions(
  shopId: string,
): Promise<PromotionWithProduct[]> {
  // Expire stale listings first
  await expirePromotedListings();

  return db.promotedListing.findMany({
    where: { shopId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          images: {
            where: { position: 0 },
            select: { url: true },
            take: 1,
          },
          variants: {
            where: { isActive: true },
            select: { priceInCents: true },
          },
        },
      },
    },
    orderBy: [
      { status: "asc" }, // ACTIVE first (alphabetically before CANCELLED/EXPIRED)
      { createdAt: "desc" },
    ],
  });
}

/**
 * Get aggregate stats for a shop's promotions.
 */
export async function getShopPromotionStats(
  shopId: string,
): Promise<PromotionStats> {
  const [activeCount, aggregates] = await Promise.all([
    db.promotedListing.count({
      where: { shopId, status: "ACTIVE", expiresAt: { gt: new Date() } },
    }),
    db.promotedListing.aggregate({
      where: { shopId },
      _sum: {
        amountPaidCents: true,
        impressions: true,
        clicks: true,
      },
    }),
  ]);

  return {
    activeCount,
    totalSpentCents: aggregates._sum.amountPaidCents ?? 0,
    totalImpressions: aggregates._sum.impressions ?? 0,
    totalClicks: aggregates._sum.clicks ?? 0,
  };
}

/**
 * Check if a product already has an active promotion.
 * Used to prevent double-promoting.
 */
export async function hasActivePromotion(
  productId: string,
): Promise<boolean> {
  const count = await db.promotedListing.count({
    where: {
      productId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
  });

  return count > 0;
}

/**
 * Get promotable products for a shop — active products with images and variants.
 * Includes whether each product already has an active promotion.
 */
export async function getPromotableProducts(shopId: string) {
  const products = await db.product.findMany({
    where: {
      shopId,
      isActive: true,
      images: { some: {} },            // Must have at least one image
      variants: { some: { isActive: true } }, // Must have active variants
    },
    select: {
      id: true,
      name: true,
      images: {
        where: { position: 0 },
        select: { url: true },
        take: 1,
      },
      variants: {
        where: { isActive: true },
        select: { priceInCents: true },
      },
      promotedListings: {
        where: {
          status: "ACTIVE",
          expiresAt: { gt: new Date() },
        },
        select: { id: true, tier: true, expiresAt: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.images[0]?.url ?? null,
    minPriceCents: p.variants.length > 0
      ? Math.min(...p.variants.map((v) => v.priceInCents))
      : 0,
    activePromotion: p.promotedListings[0] ?? null,
  }));
}

// ── Cancel ───────────────────────────────────────────────────

/**
 * Cancel an active promotion (seller-initiated).
 * NOTE: No refund logic — cancellation just stops the promotion.
 */
export async function cancelPromotion(
  promotionId: string,
  shopId: string,
): Promise<boolean> {
  const result = await db.promotedListing.updateMany({
    where: {
      id: promotionId,
      shopId, // Tenant isolation
      status: "ACTIVE",
    },
    data: {
      status: "CANCELLED",
    },
  });

  return result.count > 0;
}

// ── M6 — Performance & Comparison ────────────────────────────

/**
 * M6.4 — Get per-promotion performance data for charting.
 *
 * Since we track aggregate impressions/clicks on PromotedListing (not daily),
 * we build a synthetic daily breakdown based on run duration and totals,
 * supplemented by PROMOTED_CLICK analytics events for actual daily clicks.
 */
export async function getPromotionPerformance(
  shopId: string,
): Promise<PromotionDailyPerformance[]> {
  // Get active + recent promotions (last 90 days)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const promotions = await db.promotedListing.findMany({
    where: {
      shopId,
      createdAt: { gte: cutoff },
    },
    include: {
      product: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (promotions.length === 0) return [];

  // Fetch PROMOTED_CLICK events for these products to get daily click data
  const productIds = promotions.map((p) => p.productId);

  const clickEvents = await db.analyticsEvent.findMany({
    where: {
      shopId,
      productId: { in: productIds },
      type: "PROMOTED_CLICK",
      createdAt: { gte: cutoff },
    },
    select: {
      productId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group clicks by productId → date
  const clickMap = new Map<string, Map<string, number>>();
  for (const evt of clickEvents) {
    if (!evt.productId) continue;
    if (!clickMap.has(evt.productId)) clickMap.set(evt.productId, new Map());
    const dateKey = evt.createdAt.toISOString().split("T")[0]!;
    const productClicks = clickMap.get(evt.productId)!;
    productClicks.set(dateKey, (productClicks.get(dateKey) ?? 0) + 1);
  }

  return promotions.map((promo) => {
    const start = new Date(promo.startsAt);
    const end = new Date(promo.expiresAt) < new Date() ? new Date(promo.expiresAt) : new Date();
    const daysActive = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const avgImpPerDay = Math.round(promo.impressions / daysActive);
    const avgClicksPerDay = Math.round(promo.clicks / daysActive);
    const productClicks = clickMap.get(promo.productId) ?? new Map<string, number>();

    // Build daily data
    const dailyData: { date: string; impressions: number; clicks: number }[] = [];
    for (let i = 0; i < daysActive && i < 30; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().split("T")[0]!;
      const dayClicks = productClicks.get(dateKey) ?? 0;
      // Distribute impressions proportionally (synthetic but directionally correct)
      dailyData.push({
        date: dateKey,
        impressions: avgImpPerDay,
        clicks: dayClicks || avgClicksPerDay,
      });
    }

    return {
      promotionId: promo.id,
      productName: promo.product.name,
      tier: promo.tier,
      dailyData,
      totalImpressions: promo.impressions,
      totalClicks: promo.clicks,
      ctr: promo.impressions > 0
        ? Math.round((promo.clicks / promo.impressions) * 1000) / 10
        : 0,
      daysActive,
      avgImpressionsPerDay: avgImpPerDay,
      avgClicksPerDay,
    };
  });
}

/**
 * M6.5 — Compare promoted vs organic performance.
 *
 * Calculates how much better promoted products perform vs organic
 * using analytics events from the last 30 days.
 */
export async function getPromotionComparison(
  shopId: string,
): Promise<PromotionComparison> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Count promoted views vs organic views in the last 30 days
  const [promotedClicks, organicViews, waClicks] = await Promise.all([
    // Total promoted clicks (from PromotedListing aggregate)
    db.promotedListing.aggregate({
      where: {
        shopId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { clicks: true, impressions: true },
    }),
    // Total organic product views
    db.analyticsEvent.count({
      where: {
        shopId,
        type: "PRODUCT_VIEW",
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    // Total WhatsApp clicks (for conversion rate)
    db.analyticsEvent.count({
      where: {
        shopId,
        type: { in: ["WHATSAPP_CLICK", "WHATSAPP_CHECKOUT"] },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  const promotedViews = promotedClicks._sum.impressions ?? 0;
  const totalClicks = promotedClicks._sum.clicks ?? 0;
  const totalViews = promotedViews + organicViews;

  // Calculate multiplier: avg impressions per promoted product vs organic
  const multiplier = organicViews > 0 && promotedViews > 0
    ? Math.round((promotedViews / Math.max(organicViews, 1)) * 10) / 10
    : 0;

  // Platform conversion rate: WA clicks ÷ total views
  const conversionRate = totalViews > 0
    ? Math.round((waClicks / totalViews) * 1000) / 10
    : 8; // Default 8% if no data

  // Estimated orders from promoted clicks
  // Conservative: 10-15% of clicks convert to WA orders
  const estimatedLow = Math.max(1, Math.round(totalClicks * 0.10));
  const estimatedHigh = Math.max(estimatedLow, Math.round(totalClicks * 0.18));

  return {
    promotedViews,
    organicViews,
    multiplier,
    estimatedOrders: { low: estimatedLow, high: estimatedHigh },
    conversionRate,
  };
}
