// ============================================================
// Data Access — Platform Admin
// ============================================================
// Cross-tenant queries for platform admins.
// Used by the admin dashboard for seller verification,
// platform metrics, shop management, category CRUD,
// promotion moderation, and marketplace analytics.
//
// RULES:
// - Every function requires admin auth (checked at action/page level)
// - Cross-tenant access is intentional here
// - Audit-friendly: returns only what admins need
// ============================================================

import { db } from "@/lib/db";

// ══════════════════════════════════════════════════════════════
// Platform Stats
// ══════════════════════════════════════════════════════════════

/**
 * Get platform-wide statistics.
 * WHAT: Counts of shops, products, users, subscriptions.
 */
export async function getAdminStats() {
  const [
    totalShops,
    activeShops,
    verifiedShops,
    totalProducts,
    totalUsers,
    proSubscriptions,
  ] = await Promise.all([
    db.shop.count(),
    db.shop.count({ where: { isActive: true } }),
    db.shop.count({ where: { isVerified: true } }),
    db.product.count(),
    db.user.count(),
    db.subscription.count({
      where: {
        status: "ACTIVE",
        plan: { slug: { not: "free" } },
      },
    }),
  ]);

  return {
    totalShops,
    activeShops,
    verifiedShops,
    totalProducts,
    totalUsers,
    proSubscriptions,
  };
}

// ══════════════════════════════════════════════════════════════
// Shop Management
// ══════════════════════════════════════════════════════════════

/**
 * Get all shops with owner info for admin management.
 * Supports search and pagination.
 */
export async function getAdminShops(options?: {
  search?: string;
  page?: number;
  limit?: number;
  filter?: "all" | "verified" | "unverified" | "inactive";
}) {
  const { search, page = 1, limit = 20, filter = "all" } = options || {};

  const where: Record<string, unknown> = {};

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }

  // Status filter
  if (filter === "verified") where.isVerified = true;
  if (filter === "unverified") where.isVerified = false;
  if (filter === "inactive") where.isActive = false;

  const [shops, total] = await Promise.all([
    db.shop.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        whatsappNumber: true,
        city: true,
        province: true,
        isActive: true,
        isVerified: true,
        isFeaturedShop: true,
        logoUrl: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
          },
        },
        subscription: {
          select: {
            status: true,
            plan: { select: { name: true, slug: true } },
          },
        },
        users: {
          where: { role: "OWNER" },
          select: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.shop.count({ where }),
  ]);

  return {
    shops,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Verify or unverify a shop.
 */
export async function setShopVerified(shopId: string, verified: boolean) {
  return db.shop.update({
    where: { id: shopId },
    data: { isVerified: verified },
    select: { id: true, name: true, isVerified: true },
  });
}

/**
 * Activate or deactivate a shop.
 */
export async function setShopActive(shopId: string, active: boolean) {
  return db.shop.update({
    where: { id: shopId },
    data: { isActive: active },
    select: { id: true, name: true, isActive: true },
  });
}

/**
 * M7.2 — Toggle featured shop status.
 * Featured shops get free promotion on marketplace homepage.
 */
export async function setShopFeatured(shopId: string, featured: boolean) {
  return db.shop.update({
    where: { id: shopId },
    data: { isFeaturedShop: featured },
    select: { id: true, name: true, isFeaturedShop: true },
  });
}

// ══════════════════════════════════════════════════════════════
// M7.1 — Global Category CRUD
// ══════════════════════════════════════════════════════════════

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  parentId: string | null;
  productCount: number;
  children: AdminCategory[];
}

/**
 * Get all categories as a tree for admin management.
 */
export async function getAdminCategories(): Promise<AdminCategory[]> {
  const categories = await db.globalCategory.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      imageUrl: true,
      displayOrder: true,
      isActive: true,
      parentId: true,
      _count: { select: { products: true } },
    },
    orderBy: { displayOrder: "asc" },
  });

  // Build tree
  const childMap = new Map<string, AdminCategory[]>();
  const topLevel: AdminCategory[] = [];

  for (const cat of categories) {
    const node: AdminCategory = {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      imageUrl: cat.imageUrl,
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
      parentId: cat.parentId,
      productCount: cat._count.products,
      children: [],
    };
    if (cat.parentId) {
      const siblings = childMap.get(cat.parentId) ?? [];
      siblings.push(node);
      childMap.set(cat.parentId, siblings);
    } else {
      topLevel.push(node);
    }
  }

  for (const parent of topLevel) {
    parent.children = childMap.get(parent.id) ?? [];
    parent.productCount += parent.children.reduce((s, c) => s + c.productCount, 0);
  }

  return topLevel;
}

/**
 * Create a new global category.
 */
export async function createGlobalCategory(data: {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  parentId?: string;
  displayOrder?: number;
}) {
  return db.globalCategory.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      icon: data.icon ?? null,
      imageUrl: data.imageUrl ?? null,
      parentId: data.parentId ?? null,
      displayOrder: data.displayOrder ?? 0,
      isActive: true,
    },
    select: { id: true, name: true, slug: true },
  });
}

/**
 * Update a global category.
 */
export async function updateGlobalCategory(
  categoryId: string,
  data: {
    name?: string;
    slug?: string;
    description?: string | null;
    icon?: string | null;
    imageUrl?: string | null;
    parentId?: string | null;
    displayOrder?: number;
    isActive?: boolean;
  }
) {
  return db.globalCategory.update({
    where: { id: categoryId },
    data,
    select: { id: true, name: true, slug: true },
  });
}

/**
 * Reorder categories — batch update displayOrder values.
 */
export async function reorderCategories(
  updates: { id: string; displayOrder: number }[]
) {
  await db.$transaction(
    updates.map((u) =>
      db.globalCategory.update({
        where: { id: u.id },
        data: { displayOrder: u.displayOrder },
      })
    )
  );
}

/**
 * Delete a category (only if no products assigned).
 * Returns null if category has products.
 */
export async function deleteGlobalCategory(categoryId: string) {
  const category = await db.globalCategory.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      name: true,
      _count: { select: { products: true, children: true } },
    },
  });

  if (!category) return null;

  if (category._count.products > 0) {
    throw new Error(
      `Cannot delete "${category.name}" — ${category._count.products} products are assigned to it. Reassign them first.`
    );
  }
  if (category._count.children > 0) {
    throw new Error(
      `Cannot delete "${category.name}" — it has ${category._count.children} child categories. Delete or reassign them first.`
    );
  }

  await db.globalCategory.delete({ where: { id: categoryId } });
  return { id: category.id, name: category.name };
}

// ══════════════════════════════════════════════════════════════
// M7.3 — Promotion Revenue
// ══════════════════════════════════════════════════════════════

export interface PromotionRevenueStats {
  totalRevenueCents: number;
  totalPromotions: number;
  activePromotions: number;
  revenueByPeriod: {
    daily: number; // last 24h
    weekly: number; // last 7d
    monthly: number; // last 30d
  };
  topSpenders: {
    shopId: string;
    shopName: string;
    shopSlug: string;
    totalSpentCents: number;
    promotionCount: number;
  }[];
  revenueByTier: {
    tier: string;
    revenueCents: number;
    count: number;
  }[];
  topCategories: {
    categoryName: string;
    categorySlug: string;
    promotionCount: number;
  }[];
}

/**
 * M7.3 — Get comprehensive promotion revenue data.
 */
export async function getPromotionRevenue(): Promise<PromotionRevenueStats> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    allPromotions,
    activeCount,
    dailyRevenue,
    weeklyRevenue,
    monthlyRevenue,
    topSpendersRaw,
    tierBreakdown,
  ] = await Promise.all([
    // Total revenue + count
    db.promotedListing.aggregate({
      _sum: { amountPaidCents: true },
      _count: { id: true },
    }),
    // Active count
    db.promotedListing.count({
      where: { status: "ACTIVE", expiresAt: { gt: now } },
    }),
    // Daily revenue
    db.promotedListing.aggregate({
      where: { createdAt: { gte: oneDayAgo } },
      _sum: { amountPaidCents: true },
    }),
    // Weekly revenue
    db.promotedListing.aggregate({
      where: { createdAt: { gte: sevenDaysAgo } },
      _sum: { amountPaidCents: true },
    }),
    // Monthly revenue
    db.promotedListing.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum: { amountPaidCents: true },
    }),
    // Top spenders — group by shopId
    db.promotedListing.groupBy({
      by: ["shopId"],
      _sum: { amountPaidCents: true },
      _count: { id: true },
      orderBy: { _sum: { amountPaidCents: "desc" } },
      take: 10,
    }),
    // Revenue by tier
    db.promotedListing.groupBy({
      by: ["tier"],
      _sum: { amountPaidCents: true },
      _count: { id: true },
    }),
  ]);

  // Fetch shop names for top spenders
  const shopIds = topSpendersRaw.map((s) => s.shopId);
  const shops = shopIds.length > 0
    ? await db.shop.findMany({
        where: { id: { in: shopIds } },
        select: { id: true, name: true, slug: true },
      })
    : [];
  const shopMap = new Map(shops.map((s) => [s.id, s]));

  const topSpenders = topSpendersRaw.map((s) => {
    const shop = shopMap.get(s.shopId);
    return {
      shopId: s.shopId,
      shopName: shop?.name ?? "Unknown",
      shopSlug: shop?.slug ?? "",
      totalSpentCents: s._sum.amountPaidCents ?? 0,
      promotionCount: s._count.id,
    };
  });

  // Top promoted categories
  const promotedProducts = await db.promotedListing.findMany({
    select: {
      product: {
        select: {
          globalCategory: { select: { name: true, slug: true } },
        },
      },
    },
    take: 500,
  });

  const catCounts = new Map<string, { name: string; slug: string; count: number }>();
  for (const pl of promotedProducts) {
    const cat = pl.product.globalCategory;
    if (cat) {
      const existing = catCounts.get(cat.slug);
      if (existing) {
        existing.count++;
      } else {
        catCounts.set(cat.slug, { name: cat.name, slug: cat.slug, count: 1 });
      }
    }
  }

  const topCategories = Array.from(catCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((c) => ({
      categoryName: c.name,
      categorySlug: c.slug,
      promotionCount: c.count,
    }));

  return {
    totalRevenueCents: allPromotions._sum.amountPaidCents ?? 0,
    totalPromotions: allPromotions._count.id,
    activePromotions: activeCount,
    revenueByPeriod: {
      daily: dailyRevenue._sum.amountPaidCents ?? 0,
      weekly: weeklyRevenue._sum.amountPaidCents ?? 0,
      monthly: monthlyRevenue._sum.amountPaidCents ?? 0,
    },
    topSpenders,
    revenueByTier: tierBreakdown.map((t) => ({
      tier: t.tier,
      revenueCents: t._sum.amountPaidCents ?? 0,
      count: t._count.id,
    })),
    topCategories,
  };
}

// ══════════════════════════════════════════════════════════════
// M7.4 — Promotion Moderation
// ══════════════════════════════════════════════════════════════

export interface AdminPromotion {
  id: string;
  tier: string;
  status: string;
  impressions: number;
  clicks: number;
  amountPaidCents: number;
  startsAt: Date;
  expiresAt: Date;
  createdAt: Date;
  shop: { id: string; name: string; slug: string };
  product: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    hasImages: boolean;
    hasActiveVariants: boolean;
    hasDescription: boolean;
  };
}

/**
 * M7.4 — Get all promotions with moderation data.
 */
export async function getAdminPromotions(options?: {
  status?: "ACTIVE" | "EXPIRED" | "CANCELLED" | "all";
  page?: number;
  limit?: number;
}): Promise<{ promotions: AdminPromotion[]; total: number; page: number; totalPages: number }> {
  const { status = "all", page = 1, limit = 20 } = options || {};

  const now = new Date();
  const where: Record<string, unknown> = {};
  if (status === "ACTIVE") {
    where.status = "ACTIVE";
    where.expiresAt = { gt: now };
  } else if (status !== "all") {
    where.status = status;
  }

  const [promotions, total] = await Promise.all([
    db.promotedListing.findMany({
      where,
      select: {
        id: true,
        tier: true,
        status: true,
        impressions: true,
        clicks: true,
        amountPaidCents: true,
        startsAt: true,
        expiresAt: true,
        createdAt: true,
        shop: { select: { id: true, name: true, slug: true } },
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            images: { select: { url: true }, take: 1, orderBy: { position: "asc" } },
            variants: { where: { isActive: true }, select: { id: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.promotedListing.count({ where }),
  ]);

  return {
    promotions: promotions.map((p) => ({
      id: p.id,
      tier: p.tier,
      status: p.status,
      impressions: p.impressions,
      clicks: p.clicks,
      amountPaidCents: p.amountPaidCents,
      startsAt: p.startsAt,
      expiresAt: p.expiresAt,
      createdAt: p.createdAt,
      shop: p.shop,
      product: {
        id: p.product.id,
        name: p.product.name,
        description: p.product.description,
        imageUrl: p.product.images[0]?.url ?? null,
        hasImages: p.product.images.length > 0,
        hasActiveVariants: p.product.variants.length > 0,
        hasDescription: !!p.product.description && p.product.description.length > 10,
      },
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * M7.4 — Admin cancel a promotion (for policy violations).
 * Uses CANCELLED status — no schema migration needed.
 */
export async function adminCancelPromotion(promotionId: string) {
  return db.promotedListing.update({
    where: { id: promotionId },
    data: { status: "CANCELLED" },
    select: { id: true, product: { select: { name: true } }, shop: { select: { name: true } } },
  });
}

// ══════════════════════════════════════════════════════════════
// M7.5 — Marketplace Analytics
// ══════════════════════════════════════════════════════════════

export interface MarketplaceAnalytics {
  overview: {
    totalViews: number;
    totalClicks: number;
    totalPromotedClicks: number;
    totalPromotedImpressions: number;
  };
  dailyViews: { date: string; views: number; clicks: number; promotedClicks: number }[];
  topCategories: { name: string; slug: string; views: number }[];
  topProvinces: { province: string; shopCount: number; productCount: number }[];
  searchTerms: { term: string; count: number }[];
}

/**
 * M7.5 — Platform-wide marketplace analytics.
 */
export async function getMarketplaceAnalytics(days: number = 30): Promise<MarketplaceAnalytics> {
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);

  const [
    totalViews,
    totalClicks,
    totalPromotedClicks,
    totalPromotedImpressions,
    events,
  ] = await Promise.all([
    db.analyticsEvent.count({
      where: { type: "MARKETPLACE_VIEW", createdAt: { gte: from } },
    }),
    db.analyticsEvent.count({
      where: { type: "MARKETPLACE_CLICK", createdAt: { gte: from } },
    }),
    db.analyticsEvent.count({
      where: { type: "PROMOTED_CLICK", createdAt: { gte: from } },
    }),
    db.analyticsEvent.count({
      where: { type: "PROMOTED_IMPRESSION", createdAt: { gte: from } },
    }),
    // Fetch events for daily breakdown
    db.analyticsEvent.findMany({
      where: {
        type: { in: ["MARKETPLACE_VIEW", "MARKETPLACE_CLICK", "PROMOTED_CLICK"] },
        createdAt: { gte: from },
      },
      select: { type: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Build daily breakdown
  const dailyMap = new Map<string, { views: number; clicks: number; promotedClicks: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().split("T")[0]!;
    dailyMap.set(key, { views: 0, clicks: 0, promotedClicks: 0 });
  }

  for (const event of events) {
    const key = event.createdAt.toISOString().split("T")[0]!;
    const entry = dailyMap.get(key);
    if (!entry) continue;
    if (event.type === "MARKETPLACE_VIEW") entry.views++;
    else if (event.type === "MARKETPLACE_CLICK") entry.clicks++;
    else if (event.type === "PROMOTED_CLICK") entry.promotedClicks++;
  }

  const dailyViews = Array.from(dailyMap.entries()).map(([date, d]) => ({ date, ...d }));

  // Top categories by product count (active products in active shops)
  const categoryProducts = await db.globalCategory.findMany({
    where: { isActive: true },
    select: {
      name: true,
      slug: true,
      _count: {
        select: {
          products: {
            where: { isActive: true, shop: { isActive: true } },
          },
        },
      },
    },
    orderBy: { products: { _count: "desc" } },
    take: 10,
  });

  const topCategories = categoryProducts
    .filter((c) => c._count.products > 0)
    .map((c) => ({
      name: c.name,
      slug: c.slug,
      views: c._count.products, // Using product count as proxy for popularity
    }));

  // Geographic distribution — active shops by province
  const provinceCounts = await db.shop.groupBy({
    by: ["province"],
    where: { isActive: true, province: { not: null } },
    _count: { id: true },
  });

  // Product counts per province
  const topProvinces: MarketplaceAnalytics["topProvinces"] = [];
  for (const pc of provinceCounts) {
    if (!pc.province) continue;
    const prodCount = await db.product.count({
      where: { isActive: true, shop: { isActive: true, province: pc.province } },
    });
    topProvinces.push({
      province: pc.province,
      shopCount: pc._count.id,
      productCount: prodCount,
    });
  }
  topProvinces.sort((a, b) => b.shopCount - a.shopCount);

  // Search terms — extracted from MARKETPLACE_VIEW events with referrer data
  // For MVP, we return empty. Real search tracking needs a SearchLog model.
  const searchTerms: MarketplaceAnalytics["searchTerms"] = [];

  return {
    overview: { totalViews, totalClicks, totalPromotedClicks, totalPromotedImpressions },
    dailyViews,
    topCategories,
    topProvinces,
    searchTerms,
  };
}

// ══════════════════════════════════════════════════════════════
// M7.6 — Content Guidelines Enforcement
// ══════════════════════════════════════════════════════════════

export interface ContentViolation {
  productId: string;
  productName: string;
  shopName: string;
  shopSlug: string;
  promotionId: string;
  tier: string;
  issues: string[];
}

/**
 * M7.6 — Scan active promotions for content guideline violations.
 *
 * Guidelines: promoted product MUST have:
 * - At least 1 image
 * - A description (min 10 chars)
 * - At least 1 active variant with stock > 0
 */
export async function getContentViolations(): Promise<ContentViolation[]> {
  const now = new Date();

  const activePromotions = await db.promotedListing.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gt: now },
    },
    select: {
      id: true,
      tier: true,
      product: {
        select: {
          id: true,
          name: true,
          description: true,
          images: { select: { id: true }, take: 1 },
          variants: {
            where: { isActive: true },
            select: { id: true, stock: true },
          },
        },
      },
      shop: { select: { name: true, slug: true } },
    },
  });

  const violations: ContentViolation[] = [];

  for (const promo of activePromotions) {
    const issues: string[] = [];
    const p = promo.product;

    if (p.images.length === 0) {
      issues.push("No product images");
    }
    if (!p.description || p.description.length < 10) {
      issues.push("Missing or too short description (min 10 chars)");
    }
    if (p.variants.length === 0) {
      issues.push("No active variants");
    } else if (p.variants.every((v) => v.stock <= 0)) {
      issues.push("All variants out of stock");
    }

    if (issues.length > 0) {
      violations.push({
        productId: p.id,
        productName: p.name,
        shopName: promo.shop.name,
        shopSlug: promo.shop.slug,
        promotionId: promo.id,
        tier: promo.tier,
        issues,
      });
    }
  }

  return violations;
}
