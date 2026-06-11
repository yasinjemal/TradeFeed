// ============================================================
// shouldIndex — inventory-gated indexation (SEO blueprint §5)
// ============================================================
// One rule: no page enters Google's index unless it would
// deserve to rank if a human built it by hand. Thin UGC and
// empty geo pages get `noindex, follow` so link equity still
// flows, but the page never pollutes the domain's index quality.
//
// Used by generateMetadata() on geo/storefront/product routes
// and by the sitemap generators (a page that is noindexed must
// also be absent from sitemaps).
// ============================================================

import { db } from "@/lib/db";
import { getProvince } from "@/lib/marketplace/locations";

export const INDEX_GATES = {
  province: { minSellers: 5, minProducts: 30 },
  city: { minSellers: 3, minProducts: 15 },
  cityCategory: { minProducts: 8 },
  shop: { minProducts: 3, minDescriptionWords: 40 },
  product: { minDescriptionWords: 30 },
} as const;

const wordCount = (s: string | null | undefined) =>
  s ? s.trim().split(/\s+/).filter(Boolean).length : 0;

/** Province marketplace page: ≥5 active sellers AND ≥30 active products. */
export async function provinceIndexable(provinceSlug: string): Promise<boolean> {
  const province = getProvince(provinceSlug);
  if (!province) return false;
  const [sellers, products] = await Promise.all([
    db.shop.count({ where: { isActive: true, province: province.name } }),
    db.product.count({
      where: { isActive: true, shop: { isActive: true, province: province.name } },
    }),
  ]);
  return (
    sellers >= INDEX_GATES.province.minSellers &&
    products >= INDEX_GATES.province.minProducts
  );
}

/** City marketplace page: ≥3 active sellers AND ≥15 active products. */
export async function cityIndexable(cityName: string): Promise<boolean> {
  const [sellers, products] = await Promise.all([
    db.shop.count({
      where: { isActive: true, city: { equals: cityName, mode: "insensitive" } },
    }),
    db.product.count({
      where: {
        isActive: true,
        shop: { isActive: true, city: { equals: cityName, mode: "insensitive" } },
      },
    }),
  ]);
  return (
    sellers >= INDEX_GATES.city.minSellers && products >= INDEX_GATES.city.minProducts
  );
}

/**
 * Seller storefront: ≥3 active products AND an owner description of
 * ≥40 words. Pass pre-fetched values to avoid duplicate queries.
 */
export function shopIndexable(input: {
  productCount: number;
  description: string | null;
  aboutText?: string | null;
}): boolean {
  const words = Math.max(wordCount(input.description), wordCount(input.aboutText));
  return (
    input.productCount >= INDEX_GATES.shop.minProducts &&
    words >= INDEX_GATES.shop.minDescriptionWords
  );
}

/** Product page: has at least one image AND a description of ≥30 words. */
export function productIndexable(input: {
  imageCount: number;
  description: string | null;
}): boolean {
  return (
    input.imageCount > 0 &&
    wordCount(input.description) >= INDEX_GATES.product.minDescriptionWords
  );
}

/** Metadata fragment for gated pages. Spread into generateMetadata output. */
export function robotsFor(indexable: boolean) {
  return indexable
    ? undefined
    : ({ robots: { index: false, follow: true } } as const);
}
