// ============================================================
// Dynamic Sitemap — /sitemap.xml
// ============================================================
// Generates a sitemap listing all active shops, products,
// marketplace pages, and category pages for search engine crawlers.
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static pages ──────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
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
  ];

  // ── Marketplace category pages ────────────────────────
  // Run all DB queries in parallel for speed (avoids Vercel timeout at scale)
  const [globalCategories, subCategories, shops, products] = await Promise.all([
    db.globalCategory.findMany({
      where: { parentId: null },
      select: { slug: true, updatedAt: true },
    }),
    db.globalCategory.findMany({
      where: { parentId: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
    db.shop.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    db.product.findMany({
      where: { isActive: true, shop: { isActive: true } },
      select: {
        id: true,
        updatedAt: true,
        shop: { select: { slug: true } },
      },
      take: 5000,
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
