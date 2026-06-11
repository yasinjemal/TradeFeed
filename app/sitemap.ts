// ============================================================
// Dynamic Sitemap — /sitemap.xml
// ============================================================
// Generates a single sitemap listing all active shops, products,
// marketplace pages, and category pages for search engine crawlers.
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
  getCity,
} from "@/lib/marketplace/locations";
import { getProvince } from "@/lib/marketplace/locations";
import { shopIndexable, productIndexable, INDEX_GATES } from "@/lib/seo/should-index";

// Generate sitemap at runtime — DB queries can't run at build time,
// and URL count scales with data so static export is not viable.
export const dynamic = "force-dynamic";
export const revalidate = 3600; // regenerate at most once per hour

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Always return static pages even if DB queries fail
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
      url: `${APP_URL}/import-whatsapp-catalogue`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    // ── Money pages (SEO blueprint §7) ──────────────────────
    ...[
      "sell-online-south-africa",
      "sell-on-whatsapp",
      "whatsapp-catalog",
      "create-online-shop",
      "pricing",
      "compare/shopify-alternative-south-africa",
      "compare/whatsapp-groups",
    ].map((path) => ({
      url: `${APP_URL}/${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
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
  ];

  // Province & city pages are static data — no DB needed
  // Inventory-gated (blueprint §5): only provinces/cities with enough live
  // sellers + products enter the sitemap. Their pages also emit noindex when
  // below the gate, so sitemap and robots signals stay consistent.
  const shopsByProvince = new Map<string, number>();
  const provinceProductCounts = new Map<string, number>();
  try {
    const rows = await db.shop.findMany({
      where: { isActive: true, province: { not: null } },
      select: { province: true, _count: { select: { products: { where: { isActive: true } } } } },
    });
    for (const r of rows) {
      shopsByProvince.set(r.province!, (shopsByProvince.get(r.province!) ?? 0) + 1);
      provinceProductCounts.set(
        r.province!,
        (provinceProductCounts.get(r.province!) ?? 0) + r._count.products,
      );
    }
  } catch {}

  const provincePages: MetadataRoute.Sitemap = getAllProvinceSlugs().filter((slug) => {
    const name = getProvince(slug)?.name;
    if (!name) return false;
    return (
      (shopsByProvince.get(name) ?? 0) >= INDEX_GATES.province.minSellers &&
      (provinceProductCounts.get(name) ?? 0) >= INDEX_GATES.province.minProducts
    );
  }).map((slug) => ({
    url: `${APP_URL}/marketplace/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.85,
  }));

  let cityCounts = new Map<string, { sellers: number; products: number }>();
  try {
    const cityRows = await db.shop.findMany({
      where: { isActive: true, city: { not: null } },
      select: { city: true, _count: { select: { products: { where: { isActive: true } } } } },
    });
    cityCounts = cityRows.reduce((m, r) => {
      const key = r.city!.toLowerCase();
      const cur = m.get(key) ?? { sellers: 0, products: 0 };
      m.set(key, { sellers: cur.sellers + 1, products: cur.products + r._count.products });
      return m;
    }, new Map<string, { sellers: number; products: number }>());
  } catch {}

  const cityPages: MetadataRoute.Sitemap = getAllCityParams().filter(({ province, city }) => {
    const resolved = getCity(province, city);
    const c = resolved ? cityCounts.get(resolved.city.name.toLowerCase()) : undefined;
    return (
      !!c &&
      c.sellers >= INDEX_GATES.city.minSellers &&
      c.products >= INDEX_GATES.city.minProducts
    );
  }).map(({ province, city }) => ({
    url: `${APP_URL}/marketplace/${province}/${city}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // DB-dependent pages — wrapped in try/catch so a DB failure
  // still returns a valid sitemap with static + location pages.
  let categoryPathPages: MetadataRoute.Sitemap = [];
  const cityCategoryPages: MetadataRoute.Sitemap = [];
  let shopPages: MetadataRoute.Sitemap = [];
  let productPages: MetadataRoute.Sitemap = [];

  try {
    const [allCategories, shops, products] = await Promise.all([
      db.globalCategory.findMany({
        select: { slug: true, updatedAt: true, parentId: true },
      }),
      db.shop.findMany({
        where: { isActive: true },
        select: {
          slug: true,
          updatedAt: true,
          description: true,
          aboutText: true,
          _count: { select: { products: { where: { isActive: true } } } },
        },
      }),
      db.product.findMany({
        where: { isActive: true, shop: { isActive: true } },
        select: {
          id: true,
          slug: true,
          updatedAt: true,
          description: true,
          shop: { select: { slug: true } },
          _count: { select: { images: true } },
        },
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
    // City+category combos removed from the sitemap (blueprint §5.3):
    // with current inventory nearly all combos are thin. The pages stay
    // routable + noindexed; re-enable here per-combo once a combo passes
    // INDEX_GATES.cityCategory.minProducts.
    void POPULAR_CITIES;

    // ── Shop catalog pages (always use tradefeed.co.za URLs in sitemap —
    // sitemap protocol requires all URLs from the same host)
    shopPages = shops.filter((shop) =>
      shopIndexable({
        productCount: shop._count.products,
        description: shop.description,
        aboutText: shop.aboutText,
      }),
    ).map((shop) => ({
      url: `${APP_URL}/catalog/${shop.slug}`,
      lastModified: shop.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    // ── Product detail pages (always tradefeed.co.za URLs for sitemap)
    productPages = products.filter((product) =>
      productIndexable({
        imageCount: product._count.images,
        description: product.description,
      }),
    ).map((product) => ({
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
