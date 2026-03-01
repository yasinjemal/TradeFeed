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
  return db.product.findMany({
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
}

/**
 * Get a single product for the public catalog detail page.
 *
 * WHAT: Full product with all active variants.
 * WHY: Buyer needs to see every size/color option and pick what to order.
 *
 * MULTI-TENANT: Scoped by shopId — prevents accessing products via ID guessing.
 * PUBLIC: No auth, but product must be active.
 */
export async function getCatalogProduct(productId: string, shopId: string) {
  return db.product.findFirst({
    where: {
      id: productId,
      shopId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      option1Label: true,
      option2Label: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
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
        orderBy: [{ priceInCents: "asc" }, { size: "asc" }, { color: "asc" }],
      },
    },
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
