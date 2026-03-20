// ============================================================
// Dynamic Sitemap — /sitemap.xml
// ============================================================
// Generates a sitemap listing all active shops, products,
// marketplace pages, and category pages for search engine crawlers.
//
// SITEMAP INDEX:
//   When total URLs exceed MAX_URLS_PER_SITEMAP (10,000),
//   Next.js automatically splits into multiple sitemaps with
//   the generateSitemaps() convention. Each sitemap chunk
//   stays under the 50,000 URL / 50 MB Google limit.
//
// URLS:
//   - / (home)
//   - /marketplace (marketplace hub)
//   - /marketplace/category/[slug] (each category — canonical path)
//   - /marketplace/[province] (each province)
//   - /marketplace/[province]/[city] (each city)
//   - /marketplace/[province]/[city]/[category] (popular city+category combos)
//   - /catalog/[slug] (each active shop)
//   - /catalog/[slug]/products/[id] (each active product)
//   - /privacy, /terms, /contact (legal/info pages)
// ============================================================

import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import {
  getAllProvinceSlugs,
  getAllCityParams,
  POPULAR_CITIES,
} from "@/lib/marketplace/locations";

// Generate sitemap at runtime — DB queries can't run at build time,
// and URL count scales with data so static export is not viable.
export const dynamic = "force-dynamic";
export const revalidate = 3600; // regenerate at most once per hour

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const MAX_URLS_PER_SITEMAP = 10_000;

// ── Sitemap Index — split into chunks when needed ───────────

/**
 * Next.js calls this to determine how many sitemap files to generate.
 * Returns [{ id: 0 }, { id: 1 }, ...] — one per chunk.
 * If total URLs < MAX_URLS_PER_SITEMAP, returns a single chunk.
 */
export async function generateSitemaps() {
  try {
    const productCount = await db.product.count({
      where: { isActive: true, shop: { isActive: true } },
    });
    const estimatedTotal = productCount + 1500;
    const chunks = Math.max(1, Math.ceil(estimatedTotal / MAX_URLS_PER_SITEMAP));
    return Array.from({ length: chunks }, (_, i) => ({ id: i }));
  } catch (error) {
    console.error("[sitemap] generateSitemaps failed, returning single chunk", error);
    return [{ id: 0 }];
  }
}

// ── Per-chunk sitemap ───────────────────────────────────────

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const chunkId = Number(id) || 0;

  // Always return static pages even if DB queries fail
  const staticPages: MetadataRoute.Sitemap = chunkId === 0 ? [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${APP_URL}/marketplace`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/import-whatsapp-catalogue`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ] : [];

  // Province & city pages are static data — no DB needed
  const provincePages: MetadataRoute.Sitemap = chunkId === 0
    ? getAllProvinceSlugs().map((slug) => ({
        url: `${APP_URL}/marketplace/${slug}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.85,
      }))
    : [];

  const cityPages: MetadataRoute.Sitemap = chunkId === 0
    ? getAllCityParams().map(({ province, city }) => ({
        url: `${APP_URL}/marketplace/${province}/${city}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      }))
    : [];

  // DB-dependent pages — wrapped in try/catch so a DB failure
  // still returns a valid sitemap with static + location pages.
  let categoryPathPages: MetadataRoute.Sitemap = [];
  let cityCategoryPages: MetadataRoute.Sitemap = [];
  let shopPages: MetadataRoute.Sitemap = [];
  let productPages: MetadataRoute.Sitemap = [];

  try {
    const [allCategories, shops, products] = await Promise.all([
      chunkId === 0
        ? db.globalCategory.findMany({
            select: { slug: true, updatedAt: true, parentId: true },
          })
        : Promise.resolve([]),
      chunkId === 0
        ? db.shop.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true },
          })
        : Promise.resolve([]),
      db.product.findMany({
        where: { isActive: true, shop: { isActive: true } },
        select: {
          id: true,
          slug: true,
          updatedAt: true,
          shop: { select: { slug: true } },
        },
        skip: chunkId * MAX_URLS_PER_SITEMAP,
        take: MAX_URLS_PER_SITEMAP,
        orderBy: { id: "asc" },
      }),
    ]);

    // ── Category pages — canonical /marketplace/category/[slug] paths only.
    // (The old ?category= URLs 301-redirect via middleware, so exclude them.)
    categoryPathPages = allCategories.map((cat) => ({
      url: `${APP_URL}/marketplace/category/${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: "daily" as const,
      priority: cat.parentId ? 0.7 : 0.8,
    }));

    // ── City + Category combos — only for POPULAR_CITIES (top 12)
    // to keep URL count manageable and function fast.
    if (chunkId === 0 && allCategories.length > 0) {
      const parentCategories = allCategories.filter((c) => !c.parentId);
      cityCategoryPages = POPULAR_CITIES.flatMap(({ province, city }) =>
        parentCategories.map((cat) => ({
          url: `${APP_URL}/marketplace/${province.slug}/${city.slug}/${cat.slug}`,
          lastModified: cat.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
      );
    }

    // ── Shop catalog pages
    shopPages = shops.map((shop) => ({
      url: `${APP_URL}/catalog/${shop.slug}`,
      lastModified: shop.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    // ── Product detail pages
    productPages = products.map((product) => ({
      url: `${APP_URL}/catalog/${product.shop.slug}/products/${product.slug ?? product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("[sitemap] DB queries failed, returning static pages only", error);
  }

  return [
    ...staticPages,
    ...provincePages,
    ...cityPages,
    ...categoryPathPages,
    ...cityCategoryPages,
    ...shopPages,
    ...productPages,
  ];
}
