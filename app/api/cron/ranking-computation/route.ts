// ============================================================
// GET /api/cron/ranking-computation — Daily Quality Scores
// ============================================================
// Scheduled job to compute quality scores for all products
// and health scores for all shops. Updates denormalized fields
// on Product.qualityScore and Shop.healthScore for fast
// marketplace sorting.
//
// Schedule: Daily at 02:00 UTC via Vercel Cron (vercel.json)
// Auth: Protected by CRON_SECRET header (Vercel sets this)
//
// What it does:
// 1. Fetch all active products across all active shops
// 2. Batch-fetch ranking signals (views, orders, ratings, tier data)
// 3. Compute quality scores using pure scoring engine
// 4. Update Product.qualityScore + log RankingFactor audit rows
// 5. Compute Shop.healthScore using existing seller-health engine
// ============================================================

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { computeProductQuality } from "@/lib/intelligence/product-quality";
import type { ProductRankingMetrics } from "@/lib/intelligence/product-quality";
import { computeSellerHealth } from "@/lib/intelligence/seller-health";
import { getSellerHealthMetrics } from "@/lib/db/shops";
import { calculateTierPoints } from "@/lib/reputation/tiers";
import type { TierMetrics } from "@/lib/reputation/tiers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // 5 min max — processing all products

export async function GET(request: NextRequest) {
  // ── Verify cron secret ──────────────────────────────
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[ranking] CRON_SECRET is not set — rejecting request");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    console.warn("[ranking] ⚠ No CRON_SECRET — running unprotected (dev only)");
  } else if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ── Step 1: Fetch all active products ─────────────
    const products = await db.product.findMany({
      where: {
        isActive: true,
        shop: { isActive: true },
        variants: { some: { isActive: true } },
      },
      select: {
        id: true,
        shopId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (products.length === 0) {
      return NextResponse.json({ message: "No active products", productsScored: 0, shopsScored: 0 });
    }

    const productIds = products.map((p) => p.id);
    const shopIds = [...new Set(products.map((p) => p.shopId))];

    // ── Step 2: Batch-fetch ranking signals ───────────
    const [viewStats, orderStats, reviewStats, shopTierData] = await Promise.all([
      // Views + clicks per product (last 30 days)
      db.analyticsEvent.groupBy({
        by: ["productId", "type"],
        where: {
          productId: { in: productIds },
          type: { in: ["PRODUCT_VIEW", "WHATSAPP_CLICK", "MARKETPLACE_CLICK"] },
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: { id: true },
      }),

      // Orders per product (all-time, non-cancelled)
      db.orderItem.groupBy({
        by: ["productId"],
        where: {
          productId: { in: productIds },
          order: { status: { not: "CANCELLED" } },
        },
        _count: { id: true },
      }),

      // Review stats per product
      db.review.groupBy({
        by: ["productId"],
        where: {
          productId: { in: productIds },
          isApproved: true,
        },
        _avg: { rating: true },
        _count: { rating: true },
      }),

      // Tier points per shop (batch)
      fetchShopTierPoints(shopIds),
    ]);

    // ── Build lookup maps ─────────────────────────────
    const viewMap = new Map<string, { views: number; waClicks: number; mkClicks: number }>();
    for (const stat of viewStats) {
      if (!stat.productId) continue;
      const existing = viewMap.get(stat.productId) ?? { views: 0, waClicks: 0, mkClicks: 0 };
      if (stat.type === "PRODUCT_VIEW") existing.views = stat._count.id;
      else if (stat.type === "WHATSAPP_CLICK") existing.waClicks = stat._count.id;
      else if (stat.type === "MARKETPLACE_CLICK") existing.mkClicks = stat._count.id;
      viewMap.set(stat.productId, existing);
    }

    const orderMap = new Map(orderStats.map((o) => [o.productId, o._count.id]));

    const reviewMap = new Map(
      reviewStats.map((r) => [
        r.productId,
        { avg: r._avg.rating, count: r._count.rating },
      ])
    );

    // ── Step 3: Compute scores ────────────────────────
    const rankingFactors: {
      productId: string;
      shopId: string;
      viewScore: number;
      orderScore: number;
      ratingScore: number;
      freshnessScore: number;
      sellerTierScore: number;
      qualityScore: number;
    }[] = [];

    const productUpdates: { id: string; qualityScore: number }[] = [];

    for (const product of products) {
      const views = viewMap.get(product.id) ?? { views: 0, waClicks: 0, mkClicks: 0 };
      const orders = orderMap.get(product.id) ?? 0;
      const reviews = reviewMap.get(product.id) ?? { avg: null, count: 0 };
      const tierPoints = shopTierData.get(product.shopId) ?? 0;

      const ageDays = Math.floor((now.getTime() - product.createdAt.getTime()) / 86_400_000);
      const daysSinceUpdate = Math.floor((now.getTime() - product.updatedAt.getTime()) / 86_400_000);

      const metrics: ProductRankingMetrics = {
        views30d: views.views,
        whatsappClicks30d: views.waClicks,
        marketplaceClicks30d: views.mkClicks,
        totalOrders: orders,
        avgRating: reviews.avg,
        reviewCount: reviews.count,
        ageDays,
        daysSinceUpdate,
        sellerTierPoints: tierPoints,
      };

      const result = computeProductQuality(metrics);

      productUpdates.push({ id: product.id, qualityScore: result.score });
      rankingFactors.push({
        productId: product.id,
        shopId: product.shopId,
        viewScore: result.breakdown.engagement,
        orderScore: result.breakdown.conversion,
        ratingScore: result.breakdown.rating,
        freshnessScore: result.breakdown.freshness,
        sellerTierScore: result.breakdown.sellerTrust,
        qualityScore: result.score,
      });
    }

    // ── Step 4: Batch-write scores ────────────────────
    // Update products in batches of 100
    const BATCH_SIZE = 100;
    let productsUpdated = 0;

    for (let i = 0; i < productUpdates.length; i += BATCH_SIZE) {
      const batch = productUpdates.slice(i, i + BATCH_SIZE);
      await db.$transaction(
        batch.map((u) =>
          db.product.update({
            where: { id: u.id },
            data: { qualityScore: u.qualityScore },
          })
        )
      );
      productsUpdated += batch.length;
    }

    // Write ranking factor audit rows (batch create)
    for (let i = 0; i < rankingFactors.length; i += BATCH_SIZE) {
      const batch = rankingFactors.slice(i, i + BATCH_SIZE);
      await db.rankingFactor.createMany({ data: batch });
    }

    // ── Step 5: Compute shop health scores ────────────
    let shopsUpdated = 0;

    for (let i = 0; i < shopIds.length; i += BATCH_SIZE) {
      const batch = shopIds.slice(i, i + BATCH_SIZE);
      const updates = await Promise.all(
        batch.map(async (shopId) => {
          const rawMetrics = await getSellerHealthMetrics(shopId);
          const health = computeSellerHealth(rawMetrics);
          return { shopId, healthScore: health.score };
        })
      );

      await db.$transaction(
        updates.map((u) =>
          db.shop.update({
            where: { id: u.shopId },
            data: { healthScore: u.healthScore },
          })
        )
      );
      shopsUpdated += batch.length;
    }

    // ── Cleanup: Purge RankingFactor rows older than 30 days ──
    const thirtyDaysAgoForCleanup = new Date(now);
    thirtyDaysAgoForCleanup.setDate(thirtyDaysAgoForCleanup.getDate() - 30);
    const purged = await db.rankingFactor.deleteMany({
      where: { computedAt: { lt: thirtyDaysAgoForCleanup } },
    });

    console.log(`[ranking] Scored ${productsUpdated} products, ${shopsUpdated} shops. Purged ${purged.count} old audit rows.`);

    return NextResponse.json({
      success: true,
      productsScored: productsUpdated,
      shopsScored: shopsUpdated,
      auditRowsPurged: purged.count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("[ranking] Cron failed:", error);
    return NextResponse.json(
      { error: "Ranking computation failed" },
      { status: 500 }
    );
  }
}

// ── Helper: Batch-fetch tier points for all shops ────────────

async function fetchShopTierPoints(shopIds: string[]): Promise<Map<string, number>> {
  const [shops, productCounts, orderCounts, reviewAggs] = await Promise.all([
    db.shop.findMany({
      where: { id: { in: shopIds } },
      select: {
        id: true, createdAt: true, description: true, aboutText: true,
        address: true, city: true, latitude: true, businessHours: true,
        instagram: true, facebook: true, tiktok: true,
      },
    }),
    db.product.groupBy({
      by: ["shopId"],
      where: { shopId: { in: shopIds }, isActive: true },
      _count: true,
    }),
    db.order.groupBy({
      by: ["shopId"],
      where: { shopId: { in: shopIds } },
      _count: true,
    }),
    db.review.groupBy({
      by: ["shopId"],
      where: { shopId: { in: shopIds }, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const pCountMap = new Map(productCounts.map((p) => [p.shopId, p._count]));
  const oCountMap = new Map(orderCounts.map((o) => [o.shopId, o._count]));
  const rMap = new Map(reviewAggs.map((r) => [r.shopId, { avg: r._avg.rating, count: r._count.rating }]));

  const result = new Map<string, number>();
  for (const shop of shops) {
    const profileChecks = [
      !!shop.description, !!shop.aboutText, !!shop.address, !!shop.city,
      shop.latitude !== null, !!shop.businessHours,
      !!shop.instagram || !!shop.facebook || !!shop.tiktok,
    ];
    const metrics: TierMetrics = {
      activeProducts: pCountMap.get(shop.id) ?? 0,
      totalOrders: oCountMap.get(shop.id) ?? 0,
      avgRating: rMap.get(shop.id)?.avg ?? null,
      reviewCount: rMap.get(shop.id)?.count ?? 0,
      accountAgeDays: Math.floor((Date.now() - shop.createdAt.getTime()) / 86_400_000),
      profileCompletePct: Math.round((profileChecks.filter(Boolean).length / profileChecks.length) * 100),
    };
    result.set(shop.id, calculateTierPoints(metrics));
  }

  return result;
}
