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
//   - /marketplace?category=[slug] (each category)
//   - /catalog/[slug] (each active shop)
//   - /catalog/[slug]/products/[id] (each active product)
//   - /privacy, /terms (legal pages)
// ============================================================

import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import {
  getAllProvinceSlugs,
  getAllCityParams,
  SA_PROVINCES,
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
  const productCount = await db.product.count({
    where: { isActive: true, shop: { isActive: true } },
  });
  // Static + categories + shops contribute ~200 URLs at most for now.
  // City+category combos add ~31 cities × ~41 categories ≈ 1,271 URLs.
  // Products are the main scaling dimension.
  const estimatedTotal = productCount + 1500;
  const chunks = Math.max(1, Math.ceil(estimatedTotal / MAX_URLS_PER_SITEMAP));
  return Array.from({ length: chunks }, (_, i) => ({ id: i }));
}

// ── Per-chunk sitemap ───────────────────────────────────────

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  // Next.js may pass id as a string from the route segment — coerce safely
  const chunkId = Number(id) || 0;

  // ── Static pages (only in first chunk) ─────────────────
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

  // ── Province & city location pages (only in first chunk) ─
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

  // ── City + Category combo pages (only in first chunk) ───
  // These target "buy [category] in [city]" searches.
  const allCityParams = chunkId === 0 ? getAllCityParams() : [];
  const allCategorySlugs: string[] = [];
  // We'll populate these after the DB query below.

  // ── Marketplace category pages (only in first chunk) ───
  // Run all DB queries in parallel for speed (avoids Vercel timeout at scale)
  const [globalCategories, subCategories, shops, products] = await Promise.all([
    chunkId === 0
      ? db.globalCategory.findMany({
          where: { parentId: null },
          select: { slug: true, updatedAt: true },
        })
      : Promise.resolve([]),
    chunkId === 0
      ? db.globalCategory.findMany({
          where: { parentId: { not: null } },
          select: { slug: true, updatedAt: true },
        })
      : Promise.resolve([]),
    chunkId === 0
      ? db.shop.findMany({
          where: { isActive: true },
          select: { slug: true, updatedAt: true },
        })
      : Promise.resolve([]),
    // Products are paginated across chunks
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

  const categoryPages: MetadataRoute.Sitemap = globalCategories.map((cat) => ({
    url: `${APP_URL}/marketplace?category=${cat.slug}`,
    lastModified: cat.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // ── Clean URL category path pages (/marketplace/category/[slug]) ──
  const allCats = [...globalCategories, ...subCategories];
  const categoryPathPages: MetadataRoute.Sitemap = allCats.map((cat) => ({
    url: `${APP_URL}/marketplace/category/${cat.slug}`,
    lastModified: cat.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // ── City + Category combo pages (/marketplace/[province]/[city]/[category]) ──
  const cityCategoryPages: MetadataRoute.Sitemap = chunkId === 0
    ? allCityParams.flatMap(({ province, city }) =>
        allCats.map((cat) => ({
          url: `${APP_URL}/marketplace/${province}/${city}/${cat.slug}`,
          lastModified: cat.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
      )
    : [];

  const subCategoryPages: MetadataRoute.Sitemap = subCategories.map((cat) => ({
    url: `${APP_URL}/marketplace?category=${cat.slug}`,
    lastModified: cat.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // ── Shop catalog pages ────────────────────────────────
  const shopPages: MetadataRoute.Sitemap = shops.map((shop) => ({
    url: `${APP_URL}/catalog/${shop.slug}`,
    lastModified: shop.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // ── Product detail pages ──────────────────────────────
  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${APP_URL}/catalog/${product.shop.slug}/products/${product.slug ?? product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...provincePages,
    ...cityPages,
    ...categoryPages,
    ...categoryPathPages,
    ...cityCategoryPages,
    ...subCategoryPages,
    ...shopPages,
    ...productPages,
  ];
}
