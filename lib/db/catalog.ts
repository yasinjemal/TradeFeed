// ============================================================
// Data Access — Public Catalog (Read-Only)
// ============================================================
// Queries for the public-facing catalog pages.
//
// RULES:
// - NO AUTH REQUIRED — these are public pages
// - Only return ACTIVE shops and ACTIVE products
// - Only include ACTIVE variants with stock > 0 for display
// - Never expose internal IDs unnecessarily
// - Optimised for SSR — fast queries for mobile users on SA data
// ============================================================

import { db } from "@/lib/db";

/**
 * Get a shop's public profile by slug.
 *
 * WHAT: Returns basic shop info for the catalog header/layout.
 * WHY: Buyers see the shop name, description, WhatsApp number.
 *
 * PUBLIC: No auth. Only returns active shops.
 * POPIA: WhatsApp number is shown intentionally — it's the order channel.
 */
export async function getCatalogShop(slug: string) {
  const shop = await db.shop.findFirst({
    where: {
      slug,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      whatsappNumber: true,
      retailWhatsappNumber: true,
      logoUrl: true,
      bannerUrl: true,
      isVerified: true,
      // Location
      address: true,
      city: true,
      province: true,
      latitude: true,
      longitude: true,
      // Profile
      aboutText: true,
      businessHours: true,
      instagram: true,
      facebook: true,
      tiktok: true,
      website: true,
      whatsappGroupLink: true,
      // Theme
      themePreset: true,
      themePrimary: true,
      themeAccent: true,
      themeFont: true,
      // Cash on Delivery
      codEnabled: true,
      // Trust
      createdAt: true,
      // Subscription (for Pro badge)
      subscription: {
        select: {
          status: true,
          plan: { select: { slug: true, name: true } },
        },
      },
      // Gallery
      gallery: {
        select: {
          id: true,
          url: true,
          type: true,
          caption: true,
          position: true,
        },
        orderBy: { position: "asc" as const },
        take: 12,
      },
      _count: {
        select: {
          products: {
            where: { isActive: true },
          },
          orders: {
            where: { status: "DELIVERED" },
          },
          reviews: {
            where: { isApproved: true },
          },
        },
      },
    },
  });

  if (!shop) return null;

  // Calculate average review rating
  const reviewAgg = await db.review.aggregate({
    where: { shopId: shop.id, isApproved: true },
    _avg: { rating: true },
  });

  return {
    ...shop,
    avgRating: reviewAgg._avg.rating ?? 0,
  };
}

/**
 * Get all active products for a shop's public catalog.
 *
 * WHAT: Returns products with their variants, images, and category.
 * WHY: The product grid needs name, price range, image, variant count.
 *
 * FILTERING:
 * - Only active products (isActive: true)
 * - Only active variants (isActive: true)
 * - Products sorted newest first (sellers see latest additions)
 *
 * PERFORMANCE: Includes only first image (list view thumbnail).
 */
export async function getCatalogProducts(shopId: string) {
  const products = await db.product.findMany({
    where: {
      shopId,
      isActive: true,
      // Only include products that have at least one active variant
      variants: {
        some: {
          isActive: true,
        },
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      images: {
        where: { position: 0 },
        select: {
          url: true,
          altText: true,
        },
        take: 1,
      },
      variants: {
        where: { isActive: true },
        select: {
          id: true,
          size: true,
          color: true,
          priceInCents: true,
          retailPriceCents: true,
          stock: true,
        },
        orderBy: [{ size: "asc" }, { color: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Batch-enrich with sold counts
  if (products.length === 0) return products.map((p) => ({ ...p, soldCount: 0 }));

  const productIds = products.map((p) => p.id);
  const soldStats = await db.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { in: productIds },
      order: { status: { not: "CANCELLED" } },
    },
    _sum: { quantity: true },
  });
  const soldMap = new Map(soldStats.map((s) => [s.productId, s._sum.quantity ?? 0]));

  return products.map((p) => ({
    ...p,
    soldCount: soldMap.get(p.id) ?? 0,
  }));
}

/**
 * Get a single product for the public catalog detail page.
 * Accepts either a product slug (SEO-friendly) or a product ID (backward compat).
 *
 * WHAT: Full product with all active variants.
 * WHY: Buyer needs to see every size/color option and pick what to order.
 *
 * MULTI-TENANT: Scoped by shopId — prevents accessing products via ID guessing.
 * PUBLIC: No auth, but product must be active.
 */
export async function getCatalogProduct(slugOrId: string, shopId: string) {
  const productSelect = {
    id: true as const,
    slug: true as const,
    name: true as const,
    description: true as const,
    option1Label: true as const,
    option2Label: true as const,
    minWholesaleQty: true as const,
    wholesaleOnly: true as const,
    category: {
      select: { id: true, name: true, slug: true },
    },
    images: {
      select: { id: true, url: true, altText: true, position: true },
      orderBy: { position: "asc" as const },
    },
    variants: {
      where: { isActive: true },
      select: {
        id: true,
        size: true,
        color: true,
        priceInCents: true,
        retailPriceCents: true,
        stock: true,
        sku: true,
      },
      orderBy: [
        { priceInCents: "asc" as const },
        { size: "asc" as const },
        { color: "asc" as const },
      ] as { priceInCents?: "asc" | "desc"; size?: "asc" | "desc"; color?: "asc" | "desc" }[],
    },
    bulkDiscountTiers: {
      select: { minQuantity: true, discountPercent: true },
      orderBy: { minQuantity: "asc" as const },
    },
  };

  // Try slug first (preferred — SEO-friendly URLs)
  const bySlug = await db.product.findFirst({
    where: { slug: slugOrId, shopId, isActive: true },
    select: productSelect,
  });
  if (bySlug) return bySlug;

  // Fallback to ID lookup (backward compatibility for old/bookmarked URLs)
  return db.product.findFirst({
    where: { id: slugOrId, shopId, isActive: true },
    select: productSelect,
  });
}

/**
 * Get the count of active products in a shop.
 *
 * WHAT: Simple count for display ("42 products available").
 * WHY: Gives buyers confidence that the catalog is active.
 */
export async function getCatalogProductCount(shopId: string) {
  return db.product.count({
    where: {
      shopId,
      isActive: true,
      variants: {
        some: {
          isActive: true,
        },
      },
    },
  });
}

/**
 * Get similar products (same category, different shops).
 *
 * WHAT: Returns products in the same category from other sellers.
 * WHY: Buyers explore alternatives — builds marketplace trust & discovery.
 *
 * PUBLIC: No auth. Only returns active products with active variants.
 */
export async function getSimilarProducts(
  categoryId: string,
  excludeShopId: string,
  excludeProductId: string,
  limit = 8
) {
  const products = await db.product.findMany({
    where: {
      categoryId,
      shopId: { not: excludeShopId },
      id: { not: excludeProductId },
      isActive: true,
      shop: { isActive: true },
      variants: { some: { isActive: true } },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      images: {
        select: { url: true },
        orderBy: { position: "asc" },
        take: 1,
      },
      variants: {
        where: { isActive: true },
        select: { retailPriceCents: true, priceInCents: true },
        orderBy: { priceInCents: "asc" },
        take: 1,
      },
      shop: {
        select: { name: true, slug: true, isVerified: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    imageUrl: p.images[0]?.url ?? null,
    minPriceCents: p.variants[0]?.retailPriceCents ?? p.variants[0]?.priceInCents ?? 0,
    shopName: p.shop.name,
    shopSlug: p.shop.slug,
    isVerified: p.shop.isVerified,
  }));
}

/**
 * Get more products from the same seller.
 *
 * WHAT: Returns other products from the same shop, excluding the current one.
 * WHY: Encourages browsing more of the seller's catalog — higher AOV.
 *
 * PUBLIC: No auth. Only active products with active variants.
 */
export async function getMoreFromSeller(
  shopId: string,
  excludeProductId: string,
  limit = 8
) {
  const products = await db.product.findMany({
    where: {
      shopId,
      id: { not: excludeProductId },
      isActive: true,
      variants: { some: { isActive: true } },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      images: {
        select: { url: true },
        orderBy: { position: "asc" },
        take: 1,
      },
      variants: {
        where: { isActive: true },
        select: { retailPriceCents: true, priceInCents: true },
        orderBy: { priceInCents: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    imageUrl: p.images[0]?.url ?? null,
    minPriceCents: p.variants[0]?.retailPriceCents ?? p.variants[0]?.priceInCents ?? 0,
  }));
}

/**
 * Get all active combos for a shop's public catalog.
 *
 * WHAT: Returns combos with their items, images, and category.
 * WHY: Buyers see combo deals in the catalog — bundles at special prices.
 *
 * FILTERING:
 * - Only active combos (isActive: true)
 * - Only combos with stock > 0
 * - Sorted newest first
 */
export async function getCatalogCombos(shopId: string) {
  return db.combo.findMany({
    where: {
      shopId,
      isActive: true,
      stock: { gt: 0 },
    },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      retailPriceCents: true,
      stock: true,
      comboCategory: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      items: {
        select: {
          id: true,
          productName: true,
          variantLabel: true,
          quantity: true,
        },
      },
      images: {
        where: { position: 0 },
        select: {
          url: true,
          altText: true,
        },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single combo for the public catalog detail page.
 */
export async function getCatalogCombo(comboId: string, shopId: string) {
  return db.combo.findFirst({
    where: {
      id: comboId,
      shopId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      retailPriceCents: true,
      stock: true,
      comboCategory: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      items: {
        select: {
          id: true,
          productName: true,
          variantLabel: true,
          quantity: true,
          productId: true,
        },
      },
      images: {
        select: {
          id: true,
          url: true,
          altText: true,
          position: true,
        },
        orderBy: { position: "asc" },
      },
    },
  });
}
