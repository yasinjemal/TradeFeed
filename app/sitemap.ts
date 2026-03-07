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
  // Products are the main scaling dimension.
  const estimatedTotal = productCount + 200;
  const chunks = Math.max(1, Math.ceil(estimatedTotal / MAX_URLS_PER_SITEMAP));
  return Array.from({ length: chunks }, (_, i) => ({ id: i }));
}

// ── Per-chunk sitemap ───────────────────────────────────────

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  // ── Static pages (only in first chunk) ─────────────────
  const staticPages: MetadataRoute.Sitemap = id === 0 ? [
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
  ] : [];

  // ── Marketplace category pages (only in first chunk) ───
  // Run all DB queries in parallel for speed (avoids Vercel timeout at scale)
  const [globalCategories, subCategories, shops, products] = await Promise.all([
    id === 0
      ? db.globalCategory.findMany({
          where: { parentId: null },
          select: { slug: true, updatedAt: true },
        })
      : Promise.resolve([]),
    id === 0
      ? db.globalCategory.findMany({
          where: { parentId: { not: null } },
          select: { slug: true, updatedAt: true },
        })
      : Promise.resolve([]),
    id === 0
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
        updatedAt: true,
        shop: { select: { slug: true } },
      },
      skip: id * MAX_URLS_PER_SITEMAP,
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
    url: `${APP_URL}/catalog/${product.shop.slug}/products/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...subCategoryPages, ...shopPages, ...productPages];
}
