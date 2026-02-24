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
