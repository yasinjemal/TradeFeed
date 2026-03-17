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
 * Uses SQL aggregation to avoid fetching all rows into memory.
 */
export async function getDailyAnalytics(shopId: string, days: number = 30) {
  const { from } = getDateRange(days);

  // Use Prisma groupBy with raw date_trunc for efficient SQL aggregation
  const events = await db.analyticsEvent.groupBy({
    by: ["type"],
    where: {
      shopId,
      createdAt: { gte: from },
    },
    _count: { id: true },
  });

  // Also fetch daily breakdown using raw SQL for date grouping
  const dailyRows = await db.$queryRaw<
    { day: string; type: string; count: bigint }[]
  >`
    SELECT DATE("createdAt") as day, "type", COUNT(*) as count
    FROM "AnalyticsEvent"
    WHERE "shopId" = ${shopId} AND "createdAt" >= ${from}
    GROUP BY DATE("createdAt"), "type"
    ORDER BY day ASC
  `;

  // Build a map of date → counts, pre-populated with zeros
  const dailyMap = new Map<
    string,
    { views: number; productViews: number; clicks: number; checkouts: number }
  >();

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().split("T")[0]!;
    dailyMap.set(key, { views: 0, productViews: 0, clicks: 0, checkouts: 0 });
  }

  for (const row of dailyRows) {
    const key = typeof row.day === "string"
      ? row.day.split("T")[0]!
      : new Date(row.day).toISOString().split("T")[0]!;
    const entry = dailyMap.get(key);
    if (!entry) continue;
    const count = Number(row.count);

    switch (row.type) {
      case "PAGE_VIEW":
        entry.views += count;
        break;
      case "PRODUCT_VIEW":
        entry.productViews += count;
        break;
      case "WHATSAPP_CLICK":
        entry.clicks += count;
        break;
      case "WHATSAPP_CHECKOUT":
        entry.checkouts += count;
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

// ── Conversion Funnel ───────────────────────────────────────

export interface ConversionFunnel {
  pageViews: number;
  productViews: number;
  addToCart: number;
  checkoutStart: number;
  paymentComplete: number;
}

/**
 * Get full conversion funnel counts for a shop.
 * Tracks: Page View → Product View → Add to Cart → Checkout → Payment
 */
export async function getConversionFunnel(
  shopId: string,
  days: number = 30,
): Promise<ConversionFunnel> {
  const { from, to } = getDateRange(days);
  const where = { shopId, createdAt: { gte: from, lte: to } };

  const [pageViews, productViews, addToCart, checkoutStart, paymentComplete] =
    await Promise.all([
      db.analyticsEvent.count({ where: { ...where, type: "PAGE_VIEW" } }),
      db.analyticsEvent.count({ where: { ...where, type: "PRODUCT_VIEW" } }),
      db.analyticsEvent.count({ where: { ...where, type: "ADD_TO_CART" } }),
      db.analyticsEvent.count({ where: { ...where, type: "CHECKOUT_START" } }),
      db.analyticsEvent.count({ where: { ...where, type: "PAYMENT_COMPLETE" } }),
    ]);

  return { pageViews, productViews, addToCart, checkoutStart, paymentComplete };
}

// ── Product Performance Table ───────────────────────────────

export interface ProductPerformance {
  productId: string;
  name: string;
  imageUrl: string | null;
  views: number;
  cartAdds: number;
  orders: number;
  revenueCents: number;
}

/**
 * Get product performance data for sortable table.
 * Merges analytics events with order data.
 */
export async function getProductPerformance(
  shopId: string,
  days: number = 30,
): Promise<ProductPerformance[]> {
  const { from } = getDateRange(days);

  // Views + cart adds from analytics events
  const eventCounts = await db.$queryRaw<
    { productId: string; type: string; count: bigint }[]
  >`
    SELECT "productId", "type", COUNT(*) as count
    FROM "AnalyticsEvent"
    WHERE "shopId" = ${shopId}
      AND "productId" IS NOT NULL
      AND "type" IN ('PRODUCT_VIEW', 'ADD_TO_CART')
      AND "createdAt" >= ${from}
    GROUP BY "productId", "type"
  `;

  // Orders + revenue from order items
  const orderData = await db.$queryRaw<
    { productId: string; units: bigint; revenue: bigint }[]
  >`
    SELECT oi."productId", SUM(oi.quantity) as units, SUM(oi."priceInCents" * oi.quantity) as revenue
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    WHERE o."shopId" = ${shopId}
      AND o.status != 'CANCELLED'
      AND o."createdAt" >= ${from}
    GROUP BY oi."productId"
  `;

  // Merge into a single map
  const perfMap = new Map<string, { views: number; cartAdds: number; orders: number; revenueCents: number }>();

  for (const row of eventCounts) {
    const existing = perfMap.get(row.productId) ?? { views: 0, cartAdds: 0, orders: 0, revenueCents: 0 };
    if (row.type === "PRODUCT_VIEW") existing.views = Number(row.count);
    if (row.type === "ADD_TO_CART") existing.cartAdds = Number(row.count);
    perfMap.set(row.productId, existing);
  }

  for (const row of orderData) {
    const existing = perfMap.get(row.productId) ?? { views: 0, cartAdds: 0, orders: 0, revenueCents: 0 };
    existing.orders = Number(row.units);
    existing.revenueCents = Number(row.revenue);
    perfMap.set(row.productId, existing);
  }

  if (perfMap.size === 0) return [];

  // Fetch product details
  const productIds = Array.from(perfMap.keys());
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      images: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
    },
  });

  const productDetails = new Map(products.map((p) => [p.id, p]));

  return Array.from(perfMap.entries())
    .map(([productId, data]) => {
      const product = productDetails.get(productId);
      return {
        productId,
        name: product?.name ?? "Unknown Product",
        imageUrl: product?.images[0]?.url ?? null,
        ...data,
      };
    })
    .sort((a, b) => b.views - a.views); // Default sort by views
}
