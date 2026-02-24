// ============================================================
// Data Access — Analytics
// ============================================================
// Lightweight event tracking + dashboard queries.
//
// DESIGN:
// - Fire-and-forget tracking (don't block page renders)
// - Aggregation queries for seller dashboard
// - No PII stored — only hashed visitor fingerprint
//
// EVENTS:
// - PAGE_VIEW: Catalog page load (server-side)
// - PRODUCT_VIEW: Product detail page load (server-side)
// - WHATSAPP_CLICK: WhatsApp enquiry button tap (client-side)
// - WHATSAPP_CHECKOUT: Cart checkout via WhatsApp (client-side)
// ============================================================

import { db } from "@/lib/db";
import type { EventType } from "@prisma/client";

interface TrackEventInput {
  type: EventType;
  shopId: string;
  productId?: string;
  visitorId?: string;
  userAgent?: string;
  referrer?: string;
}

/**
 * Record an analytics event. Fire-and-forget.
 *
 * PERF: This is intentionally NOT awaited in page renders.
 * We call it without `await` so it doesn't block SSR.
 */
export async function trackEvent(input: TrackEventInput): Promise<void> {
  try {
    await db.analyticsEvent.create({
      data: {
        type: input.type,
        shopId: input.shopId,
        productId: input.productId ?? null,
        visitorId: input.visitorId ?? null,
        userAgent: input.userAgent ?? null,
        referrer: input.referrer ?? null,
      },
    });
  } catch (err) {
    // Never let analytics failures break the app
    console.error("[analytics] Failed to track event:", err);
  }
}

// ── Dashboard Queries ────────────────────────────────────────

interface DateRange {
  from: Date;
  to: Date;
}

function getDateRange(days: number): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

/**
 * Get overview stats for the analytics dashboard.
 * Runs 4 parallel queries for speed.
 */
export async function getAnalyticsOverview(shopId: string, days: number = 30) {
  const { from, to } = getDateRange(days);

  const [
    totalPageViews,
    totalProductViews,
    totalWhatsAppClicks,
    totalCheckouts,
  ] = await Promise.all([
    db.analyticsEvent.count({
      where: { shopId, type: "PAGE_VIEW", createdAt: { gte: from, lte: to } },
    }),
    db.analyticsEvent.count({
      where: {
        shopId,
        type: "PRODUCT_VIEW",
        createdAt: { gte: from, lte: to },
      },
    }),
    db.analyticsEvent.count({
      where: {
        shopId,
        type: "WHATSAPP_CLICK",
        createdAt: { gte: from, lte: to },
      },
    }),
    db.analyticsEvent.count({
      where: {
        shopId,
        type: "WHATSAPP_CHECKOUT",
        createdAt: { gte: from, lte: to },
      },
    }),
  ]);

  // Conversion rate: WA clicks ÷ page views
  const conversionRate =
    totalPageViews > 0
      ? ((totalWhatsAppClicks + totalCheckouts) / totalPageViews) * 100
      : 0;

  return {
    totalPageViews,
    totalProductViews,
    totalWhatsAppClicks,
    totalCheckouts,
    conversionRate: Math.round(conversionRate * 10) / 10,
    days,
  };
}

/**
 * Get daily event counts for charting (sparkline/bar chart).
 * Returns an array of { date, views, clicks } for the last N days.
 */
export async function getDailyAnalytics(shopId: string, days: number = 30) {
  const { from } = getDateRange(days);

  // Fetch all events in range — group in JS (Prisma doesn't support date_trunc easily)
  const events = await db.analyticsEvent.findMany({
    where: {
      shopId,
      createdAt: { gte: from },
    },
    select: {
      type: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Build a map of date → counts
  const dailyMap = new Map<
    string,
    { views: number; productViews: number; clicks: number; checkouts: number }
  >();

  // Pre-populate all dates so chart has no gaps
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().split("T")[0]!;
    dailyMap.set(key, { views: 0, productViews: 0, clicks: 0, checkouts: 0 });
  }

  for (const event of events) {
    const key = event.createdAt.toISOString().split("T")[0]!;
    const entry = dailyMap.get(key);
    if (!entry) continue;

    switch (event.type) {
      case "PAGE_VIEW":
        entry.views++;
        break;
      case "PRODUCT_VIEW":
        entry.productViews++;
        break;
      case "WHATSAPP_CLICK":
        entry.clicks++;
        break;
      case "WHATSAPP_CHECKOUT":
        entry.checkouts++;
        break;
    }
  }

  return Array.from(dailyMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));
}

/**
 * Get the top viewed/clicked products for the seller dashboard.
 */
export async function getTopProducts(shopId: string, days: number = 30) {
  const { from } = getDateRange(days);

  // Get product view counts
  const productEvents = await db.analyticsEvent.groupBy({
    by: ["productId"],
    where: {
      shopId,
      productId: { not: null },
      type: { in: ["PRODUCT_VIEW", "WHATSAPP_CLICK"] },
      createdAt: { gte: from },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  if (productEvents.length === 0) return [];

  // Fetch product details
  const productIds = productEvents
    .map((e) => e.productId)
    .filter((id): id is string => id !== null);

  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      images: {
        take: 1,
        orderBy: { position: "asc" },
        select: { url: true },
      },
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  return productEvents
    .filter((e) => e.productId && productMap.has(e.productId))
    .map((e) => {
      const product = productMap.get(e.productId!)!;
      return {
        productId: e.productId!,
        name: product.name,
        imageUrl: product.images[0]?.url ?? null,
        totalEvents: e._count.id,
      };
    });
}

/**
 * Get unique visitor count (by visitorId).
 */
export async function getUniqueVisitors(shopId: string, days: number = 30) {
  const { from } = getDateRange(days);

  const result = await db.analyticsEvent.findMany({
    where: {
      shopId,
      type: "PAGE_VIEW",
      visitorId: { not: null },
      createdAt: { gte: from },
    },
    select: { visitorId: true },
    distinct: ["visitorId"],
  });

  return result.length;
}
