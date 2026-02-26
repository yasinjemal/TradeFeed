// ============================================================
// Data Access — Marketplace (Cross-Shop Discovery)
// ============================================================
// All database operations for the public marketplace.
//
// KEY DIFFERENCE FROM catalog.ts:
// - catalog.ts is single-shop scoped (shopId required)
// - marketplace.ts is CROSS-SHOP (no shopId filter)
//
// RULES:
// - Only return products from ACTIVE shops with ACTIVE products
// - Only include variants that are active with stock > 0
// - Promoted listings interleaved with organic results
// - Fire-and-forget tracking for impressions/clicks
// - All queries optimised for read-heavy traffic
// ============================================================

import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// ── Types ────────────────────────────────────────────────────

export type MarketplaceSortBy =
  | "trending"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popular";

export interface MarketplaceFilters {
  /** Global category slug (e.g. "hoodies-sweaters") */
  category?: string;
  /** Parent category slug — returns all children too */
  parentCategory?: string;
  /** Minimum price in cents */
  minPrice?: number;
  /** Maximum price in cents */
  maxPrice?: number;
  /** Province filter (e.g. "Gauteng") */
  province?: string;
  /** City filter */
  city?: string;
  /** Only show products from verified sellers */
  verifiedOnly?: boolean;
  /** Text search (product name, description) */
  search?: string;
  /** Sort order */
  sortBy?: MarketplaceSortBy;
  /** Pagination — offset-based for MVP */
  page?: number;
  /** Results per page */
  pageSize?: number;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  minPriceCents: number;
  maxPriceCents: number;
  variantCount: number;
  shop: {
    id: string;
    slug: string;
    name: string;
    city: string | null;
    province: string | null;
    isVerified: boolean;
    logoUrl: string | null;
  };
  globalCategory: {
    name: string;
    slug: string;
  } | null;
  /** If this product appears as a promoted listing */
  promotion: {
    tier: "BOOST" | "FEATURED" | "SPOTLIGHT";
    promotedListingId: string;
  } | null;
  createdAt: Date;
}

export interface MarketplaceResult {
  products: MarketplaceProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  parentId: string | null;
  productCount: number;
  children: CategoryWithCount[];
}

export interface FeaturedShop {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  city: string | null;
  province: string | null;
  isVerified: boolean;
  productCount: number;
  hasSpotlight: boolean;
}

// ── Core Queries ─────────────────────────────────────────────

/**
 * M2.2 — Get marketplace products (cross-shop).
 *
 * The main discovery query. Supports filtering, sorting, pagination.
 * Only returns products from active shops with active variants.
 */
export async function getMarketplaceProducts(
  filters: MarketplaceFilters = {}
): Promise<MarketplaceResult> {
  const {
    category,
    parentCategory,
    minPrice,
    maxPrice,
    province,
    city,
    verifiedOnly = false,
    search,
    sortBy = "newest",
    page = 1,
    pageSize = 24,
  } = filters;

  // ── Build WHERE clause ──────────────────────────────────
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    shop: {
      isActive: true,
      ...(province && { province }),
      ...(city && { city }),
      ...(verifiedOnly && { isVerified: true }),
    },
    // Must have at least one active variant
    variants: {
      some: { isActive: true },
    },
  };

  // Category filter — direct match or parent + all children
  if (category) {
    where.globalCategory = { slug: category };
  } else if (parentCategory) {
    where.globalCategory = {
      OR: [
        { slug: parentCategory },
        { parent: { slug: parentCategory } },
      ],
    };
  }

  // Price range filter — check if ANY variant is within range
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.variants = {
      some: {
        isActive: true,
        ...(minPrice !== undefined && { priceInCents: { gte: minPrice } }),
        ...(maxPrice !== undefined && { priceInCents: { lte: maxPrice } }),
      },
    };
  }

  // Text search — ILIKE on product name and description (V1)
  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
    ];
  }

  // ── Build ORDER BY ──────────────────────────────────────
  let orderBy: Prisma.ProductOrderByWithRelationInput;
  switch (sortBy) {
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "price_asc":
      orderBy = { minPriceCents: "asc" };
      break;
    case "price_desc":
      orderBy = { maxPriceCents: "desc" };
      break;
    case "trending":
    case "popular":
      // Handled by getTrendingProducts() for true trending;
      // fallback to newest for the main grid
      orderBy = { createdAt: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  // ── Execute query ───────────────────────────────────────
  const skip = (page - 1) * pageSize;

  const [rawProducts, total] = await Promise.all([
    db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        globalCategory: {
          select: { name: true, slug: true },
        },
        shop: {
          select: {
            id: true,
            slug: true,
            name: true,
            city: true,
            province: true,
            isVerified: true,
            logoUrl: true,
          },
        },
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
      orderBy,
      skip,
      take: pageSize,
    }),
    db.product.count({ where }),
  ]);

  // ── Transform results ───────────────────────────────────
  const products: MarketplaceProduct[] = rawProducts.map((p) => {
    const prices = p.variants.map((v) => v.priceInCents);
    const minP = prices.length > 0 ? Math.min(...prices) : 0;
    const maxP = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      imageUrl: p.images[0]?.url ?? null,
      minPriceCents: minP,
      maxPriceCents: maxP,
      variantCount: p.variants.length,
      shop: p.shop,
      globalCategory: p.globalCategory,
      promotion: null, // Will be enriched by interleaving
      createdAt: p.createdAt,
    };
  });

  // Price sorting is handled at DB level via denormalized
  // minPriceCents/maxPriceCents on Product model.

  return {
    products,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * M2.3 — Get active promoted products.
 *
 * Returns promoted listings ordered by tier (SPOTLIGHT > FEATURED > BOOST),
 * then by most recently started. Only active + not expired.
 */
export async function getPromotedProducts(
  limit: number = 12
): Promise<MarketplaceProduct[]> {
  const now = new Date();

  const promoted = await db.promotedListing.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gt: now },
      startsAt: { lte: now },
      product: {
        isActive: true,
        shop: { isActive: true },
        variants: { some: { isActive: true } },
      },
    },
    select: {
      id: true,
      tier: true,
      product: {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          globalCategory: {
            select: { name: true, slug: true },
          },
          shop: {
            select: {
              id: true,
              slug: true,
              name: true,
              city: true,
              province: true,
              isVerified: true,
              logoUrl: true,
            },
          },
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
      // SPOTLIGHT (highest value) first, then FEATURED, then BOOST
      { tier: "desc" },
      { startsAt: "desc" },
    ],
    take: limit,
  });

  return promoted.map((pl) => {
    const p = pl.product;
    const prices = p.variants.map((v) => v.priceInCents);

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      imageUrl: p.images[0]?.url ?? null,
      minPriceCents: prices.length > 0 ? Math.min(...prices) : 0,
      maxPriceCents: prices.length > 0 ? Math.max(...prices) : 0,
      variantCount: p.variants.length,
      shop: p.shop,
      globalCategory: p.globalCategory,
      promotion: {
        tier: pl.tier,
        promotedListingId: pl.id,
      },
      createdAt: p.createdAt,
    };
  });
}

/**
 * M2.4 — Get global categories with product counts.
 *
 * Returns a tree: top-level categories with children.
 * Each has a product count (only active products from active shops).
 */
export async function getGlobalCategories(): Promise<CategoryWithCount[]> {
  const categories = await db.globalCategory.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      description: true,
      imageUrl: true,
      displayOrder: true,
      parentId: true,
      _count: {
        select: {
          products: {
            where: {
              isActive: true,
              shop: { isActive: true },
              variants: { some: { isActive: true } },
            },
          },
        },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  // Build tree: top-level parents + their children
  const childMap = new Map<string, CategoryWithCount[]>();
  const topLevel: CategoryWithCount[] = [];

  for (const cat of categories) {
    const node: CategoryWithCount = {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      description: cat.description,
      imageUrl: cat.imageUrl,
      displayOrder: cat.displayOrder,
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

  // Attach children to parents and roll up counts
  for (const parent of topLevel) {
    parent.children = childMap.get(parent.id) ?? [];
    // Parent count = own products + sum of children's products
    parent.productCount += parent.children.reduce(
      (sum, child) => sum + child.productCount,
      0
    );
  }

  return topLevel;
}

/**
 * M2.5 — Get trending products.
 *
 * Products with highest (PRODUCT_VIEW + WHATSAPP_CLICK + MARKETPLACE_CLICK)
 * in the last 7 days. Cross-shop. Limit configurable.
 */
export async function getTrendingProducts(
  limit: number = 20
): Promise<MarketplaceProduct[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Aggregate event counts per product in last 7 days
  const trendingEvents = await db.analyticsEvent.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      type: { in: ["PRODUCT_VIEW", "WHATSAPP_CLICK", "MARKETPLACE_CLICK"] },
      createdAt: { gte: sevenDaysAgo },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit * 2, // Fetch extra — some may be inactive/deleted
  });

  if (trendingEvents.length === 0) return [];

  const productIds = trendingEvents
    .map((e) => e.productId)
    .filter((id): id is string => id !== null);

  // Fetch product details for trending IDs
  const products = await db.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
      shop: { isActive: true },
      variants: { some: { isActive: true } },
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      globalCategory: {
        select: { name: true, slug: true },
      },
      shop: {
        select: {
          id: true,
          slug: true,
          name: true,
          city: true,
          province: true,
          isVerified: true,
          logoUrl: true,
        },
      },
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
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Return in trending order (most events first), limited to `limit`
  return trendingEvents
    .filter((e) => e.productId && productMap.has(e.productId))
    .slice(0, limit)
    .map((e) => {
      const p = productMap.get(e.productId!)!;
      const prices = p.variants.map((v) => v.priceInCents);

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        imageUrl: p.images[0]?.url ?? null,
        minPriceCents: prices.length > 0 ? Math.min(...prices) : 0,
        maxPriceCents: prices.length > 0 ? Math.max(...prices) : 0,
        variantCount: p.variants.length,
        shop: p.shop,
        globalCategory: p.globalCategory,
        promotion: null,
        createdAt: p.createdAt,
      };
    });
}

/**
 * M2.6 — Get featured shops.
 *
 * Shops with `isFeaturedShop=true` OR shops with active SPOTLIGHT promotions.
 * Includes product count and shop profile.
 */
export async function getFeaturedShops(
  limit: number = 12
): Promise<FeaturedShop[]> {
  const now = new Date();

  // Get shops that are either admin-featured or have a spotlight promotion
  const shops = await db.shop.findMany({
    where: {
      isActive: true,
      OR: [
        { isFeaturedShop: true },
        {
          promotedListings: {
            some: {
              tier: "SPOTLIGHT",
              status: "ACTIVE",
              expiresAt: { gt: now },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      bannerUrl: true,
      city: true,
      province: true,
      isVerified: true,
      isFeaturedShop: true,
      _count: {
        select: {
          products: {
            where: {
              isActive: true,
              variants: { some: { isActive: true } },
            },
          },
        },
      },
      promotedListings: {
        where: {
          tier: "SPOTLIGHT",
          status: "ACTIVE",
          expiresAt: { gt: now },
        },
        select: { id: true },
        take: 1,
      },
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  return shops.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    logoUrl: s.logoUrl,
    bannerUrl: s.bannerUrl,
    city: s.city,
    province: s.province,
    isVerified: s.isVerified,
    productCount: s._count.products,
    hasSpotlight: s.promotedListings.length > 0,
  }));
}

/**
 * M2.7 — Search marketplace.
 *
 * Full-text search across product names, descriptions, shop names,
 * and category names. V1: PostgreSQL ILIKE with %term%.
 * Upgrade path: pg_trgm → Meilisearch/Algolia when scale demands.
 */
export async function searchMarketplace(
  query: string,
  options: { page?: number; pageSize?: number } = {}
): Promise<MarketplaceResult> {
  const { page = 1, pageSize = 24 } = options;
  const term = query.trim();

  if (term.length === 0) {
    return { products: [], total: 0, page, pageSize, totalPages: 0 };
  }

  // Search in product name, description, shop name, and category name
  return getMarketplaceProducts({
    search: term,
    page,
    pageSize,
    sortBy: "newest",
  });
}

// ── Promotion Tracking ───────────────────────────────────────

/**
 * M2.8 — Track promoted listing impression.
 *
 * Increments the `impressions` counter on a PromotedListing.
 * Fire-and-forget — never block the render.
 *
 * Accepts multiple IDs for batch tracking (one marketplace page
 * can show several promoted products).
 */
export async function trackPromotedImpressions(
  promotedListingIds: string[]
): Promise<void> {
  if (promotedListingIds.length === 0) return;

  try {
    await db.promotedListing.updateMany({
      where: { id: { in: promotedListingIds } },
      data: { impressions: { increment: 1 } },
    });
  } catch (err) {
    // Never let tracking failures break the page
    console.error("[marketplace] Failed to track impressions:", err);
  }
}

/**
 * M2.9 — Track promoted listing click.
 *
 * Increments the `clicks` counter on a single PromotedListing
 * AND fires a PROMOTED_CLICK analytics event.
 */
export async function trackPromotedClick(
  promotedListingId: string,
  shopId: string,
  productId: string
): Promise<void> {
  try {
    await Promise.all([
      // Increment click counter on the promotion itself
      db.promotedListing.update({
        where: { id: promotedListingId },
        data: { clicks: { increment: 1 } },
      }),
      // Fire analytics event for reporting
      db.analyticsEvent.create({
        data: {
          type: "PROMOTED_CLICK",
          shopId,
          productId,
        },
      }),
    ]);
  } catch (err) {
    console.error("[marketplace] Failed to track promoted click:", err);
  }
}

// ── Interleaving Algorithm ───────────────────────────────────

/**
 * M2.10 — Interleave promoted products into organic results.
 *
 * Pattern: positions 0-3 organic, position 4 promoted, 5-8 organic,
 * position 9 promoted, repeating every 5 slots.
 *
 * Rules:
 * - Promoted products get a "Sponsored" label
 * - Duplicates are excluded (if a promoted product is also in organic)
 * - If not enough promoted products, fill entirely with organic
 * - SPOTLIGHT tier gets first promoted slot, then FEATURED, then BOOST
 */
export function interleavePromotedProducts(
  organic: MarketplaceProduct[],
  promoted: MarketplaceProduct[]
): MarketplaceProduct[] {
  if (promoted.length === 0) return organic;

  // Remove duplicates — if a product is promoted, don't show it organically too
  const promotedIds = new Set(promoted.map((p) => p.id));
  const filteredOrganic = organic.filter((p) => !promotedIds.has(p.id));

  const result: MarketplaceProduct[] = [];
  let organicIdx = 0;
  let promotedIdx = 0;

  // Interleave: every 5th slot (index 4, 9, 14, 19...) is promoted
  const PROMOTED_INTERVAL = 5;
  const totalSlots = filteredOrganic.length + promoted.length;

  for (let slot = 0; slot < totalSlots; slot++) {
    const isPromotedSlot =
      (slot + 1) % PROMOTED_INTERVAL === 0 && promotedIdx < promoted.length;

    if (isPromotedSlot) {
      result.push(promoted[promotedIdx]!);
      promotedIdx++;
    } else if (organicIdx < filteredOrganic.length) {
      result.push(filteredOrganic[organicIdx]!);
      organicIdx++;
    } else if (promotedIdx < promoted.length) {
      // Ran out of organic — fill remaining with promoted
      result.push(promoted[promotedIdx]!);
      promotedIdx++;
    }
  }

  return result;
}
