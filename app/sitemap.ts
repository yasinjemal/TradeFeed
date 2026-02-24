// ============================================================
// Dynamic Sitemap — /sitemap.xml
// ============================================================
// Generates a sitemap listing all active shops and their products
// for search engine crawlers. Updates automatically.
//
// URLS:
//   - / (home)
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

  // ── Shop catalog pages ────────────────────────────────
  const shops = await db.shop.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  const shopPages: MetadataRoute.Sitemap = shops.map((shop) => ({
    url: `${APP_URL}/catalog/${shop.slug}`,
    lastModified: shop.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // ── Product detail pages ──────────────────────────────
  const products = await db.product.findMany({
    where: {
      isActive: true,
      shop: { isActive: true },
    },
    select: {
      id: true,
      updatedAt: true,
      shop: { select: { slug: true } },
    },
    take: 5000, // Cap for performance — most sitemaps max at 50k URLs
  });

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${APP_URL}/catalog/${product.shop.slug}/products/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...shopPages, ...productPages];
}
