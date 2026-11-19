// ============================================================
// Landing-page proof — data loaders
// ============================================================
// Queries behind the counters, featured shops and showcase
// products on /sell. Every result passes through the gates in
// lib/growth/landing-proof.ts before it reaches a component.
//
// Two kinds of shop are excluded in the query itself, so they can
// not inflate a counter either: deny-listed shops, and shops owned
// by a platform admin account (the operator's own shops and their
// test orders are not evidence that other people use TradeFeed).
//
// Callers must treat a rejected promise as "unknown", not "zero":
// catch it and pass `null` / `[]` so the page hides the proof
// instead of printing "0 registered shops".
// ============================================================

import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { getAdminUserIds } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { getMarketplaceProducts } from "@/lib/db/marketplace";
import {
  displayableRating,
  isFeaturableShop,
  proofShopDenylist,
  selectFeaturedProducts,
  type PlatformStats,
} from "@/lib/growth/landing-proof";

// Published listings only — hidden and flagged products never count
// towards a shop's eligibility (same predicate as discover-shops.ts).
const publishedProduct = { isActive: true, isFlagged: false } as const;

const FEATURED_SHOP_LIMIT = 6;
const FEATURED_PRODUCT_LIMIT = 8;
// Gate candidates are over-fetched, then filtered: most shops will not pass.
const SHOP_CANDIDATE_POOL = 60;
const PRODUCT_CANDIDATE_POOL = 48;

/** Active shops that count as independent proof: not deny-listed, not operator-owned. */
function independentShopWhere(): Prisma.ShopWhereInput {
  const adminIds = getAdminUserIds();
  return {
    isActive: true,
    slug: { notIn: proofShopDenylist() },
    ...(adminIds.length > 0 && {
      users: { none: { role: "OWNER", user: { clerkId: { in: adminIds } } } },
    }),
  };
}

async function loadShopCandidates(where: Prisma.ShopWhereInput, take?: number) {
  const adminIds = getAdminUserIds();
  const shops = await db.shop.findMany({
    where: { isActive: true, ...where },
    select: {
      name: true,
      slug: true,
      logoUrl: true,
      city: true,
      isVerified: true,
      isActive: true,
      users: {
        where: { role: "OWNER" },
        select: { user: { select: { clerkId: true } } },
      },
      products: {
        where: publishedProduct,
        select: {
          images: {
            orderBy: [{ position: "asc" }, { id: "asc" }],
            take: 1,
            select: { url: true },
          },
        },
      },
    },
    orderBy: [{ isFeaturedShop: "desc" }, { isVerified: "desc" }, { createdAt: "asc" }],
    ...(take ? { take } : {}),
  });

  return shops.map(({ products, users, ...shop }) => ({
    ...shop,
    isOperatorOwned: users.some((owner) => adminIds.includes(owner.user.clerkId)),
    productCount: products.length,
    productImageUrls: products.map((product) => product.images[0]?.url ?? null),
  }));
}

export interface LandingPlatformStats extends PlatformStats {
  /** Up to three cities with the most shops, comma-separated. May be empty. */
  topCities: string;
}

/** Platform counters over independent shops only. Cached for 5 minutes. */
export const getLandingPlatformStats = unstable_cache(
  async (): Promise<LandingPlatformStats> => {
    const shop = independentShopWhere();

    const [shopCount, productCount, orderCount, cityCounts] = await Promise.all([
      db.shop.count({ where: shop }),
      db.product.count({ where: { isActive: true, shop } }),
      db.order.count({ where: { shop } }),
      db.shop.groupBy({
        by: ["city"],
        where: { ...shop, city: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    return {
      shopCount,
      productCount,
      orderCount,
      cityCount: cityCounts.length,
      topCities: cityCounts
        .slice(0, 3)
        .map((row) => row.city)
        .filter(Boolean)
        .join(", "),
    };
  },
  ["landing-platform-stats-v3"],
  { revalidate: 300 },
);

/** Shops that pass the featured-shop gate, best first. Cached for 10 minutes. */
export const getLandingFeaturedShops = unstable_cache(
  async () => {
    const denylist = proofShopDenylist();
    const candidates = await loadShopCandidates(
      { ...independentShopWhere(), products: { some: publishedProduct } },
      SHOP_CANDIDATE_POOL,
    );
    return candidates
      .filter((shop) => isFeaturableShop(shop, denylist))
      .slice(0, FEATURED_SHOP_LIMIT)
      .map((shop) => ({
        name: shop.name,
        slug: shop.slug,
        logoUrl: shop.logoUrl,
        city: shop.city,
        isVerified: shop.isVerified,
        productCount: shop.productCount,
      }));
  },
  ["landing-featured-shops-v3"],
  { revalidate: 600 },
);

/**
 * Showcase products, already shaped for TfProductCard so the cache
 * stores plain JSON. A product is shown only if its shop passes the
 * featured-shop gate; a rating is attached only when enough reviews
 * back it. Cached for 5 minutes.
 */
export const getLandingFeaturedProducts = unstable_cache(
  async () => {
    const denylist = proofShopDenylist();
    const { products } = await getMarketplaceProducts({
      sortBy: "quality",
      page: 1,
      pageSize: PRODUCT_CANDIDATE_POOL,
    });
    if (!products.length) return [];

    const shops = await loadShopCandidates({
      id: { in: [...new Set(products.map((p) => p.shop.id))] },
    });
    const featurableShops = new Set(
      shops.filter((shop) => isFeaturableShop(shop, denylist)).map((shop) => shop.slug),
    );

    const picked = selectFeaturedProducts(
      products.map((p) => ({
        title: p.name,
        imageUrl: p.imageUrl,
        priceCents: p.minPriceCents,
        shopSlug: p.shop.slug,
        source: p,
      })),
      featurableShops,
      FEATURED_PRODUCT_LIMIT,
    );

    return picked.map(({ source: p }) => {
      const rating = displayableRating(p.avgRating, p.reviewCount);
      return {
        href: `/catalog/${p.shop.slug}/products/${p.slug ?? p.id}`,
        title: p.name,
        price: p.minPriceCents / 100,
        imageUrl: p.imageUrl,
        sellerName: p.shop.name,
        sellerVerified: p.shop.isVerified,
        rating: rating?.rating,
        ratingCount: rating?.ratingCount,
        location: p.shop.city ?? p.shop.province ?? undefined,
        whatsappNumber: p.shop.whatsappNumber,
        isNew: Date.now() - new Date(p.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000,
      };
    });
  },
  ["landing-featured-products-v3"],
  { revalidate: 300 },
);
