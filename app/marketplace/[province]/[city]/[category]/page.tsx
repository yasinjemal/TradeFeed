import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getMarketplaceProducts,
  getPromotedProducts,
  getGlobalCategories,
  getTrendingProducts,
  getNewArrivals,
  getFeaturedShops,
  interleavePromotedProducts,
  type CategoryWithCount,
} from "@/lib/db/marketplace";
import { MarketplaceShell } from "@/components/marketplace/marketplace-shell";
import {
  generateMarketplaceJsonLd,
  generateCityCategoryPageJsonLd,
} from "@/lib/seo/json-ld";
import { expirePromotedListings } from "@/lib/db/promotions";
import {
  getAllCityParams,
  getCity,
  provinceSlugToDbValue,
  citySlugToDbValue,
} from "@/lib/marketplace/locations";

// ============================================================
// /marketplace/[province]/[city]/[category]
// City + Category combo page for hyper-local SEO.
// Targets: "buy hoodies in Johannesburg", "shoes Durban" etc.
// ============================================================

export const revalidate = 300;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface Props {
  params: Promise<{ province: string; city: string; category: string }>;
  searchParams: Promise<{
    search?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    verified?: string;
    page?: string;
  }>;
}

// Static generation removed — 30 cities × ~185 categories = ~5,550 pages
// was too heavy for build. ISR via revalidate = 300 handles caching.

/** Recursively find a category by slug in the tree */
function findCategory(
  categories: CategoryWithCount[],
  slug: string,
): CategoryWithCount | undefined {
  for (const cat of categories) {
    if (cat.slug === slug) return cat;
    if (cat.children) {
      const found = findCategory(cat.children, slug);
      if (found) return found;
    }
  }
  return undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { province: pSlug, city: cSlug, category: catSlug } = await params;
  const result = getCity(pSlug, cSlug);
  if (!result) return { title: "Not Found" };

  const categories = await getGlobalCategories();
  const category = findCategory(categories, catSlug);
  if (!category) return { title: "Not Found" };

  const { province, city } = result;
  const title = `${category.name} in ${city.name}, ${province.name} — Buy Wholesale & Retail | TradeFeed`;
  const description = `Buy ${category.name.toLowerCase()} from suppliers in ${city.name}, ${province.name}. Compare prices from verified sellers. Wholesale & retail. Order via WhatsApp on TradeFeed.`;

  return {
    title,
    description,
    keywords: [
      `${category.name.toLowerCase()} ${city.name}`,
      `buy ${category.name.toLowerCase()} ${city.name}`,
      `${category.name.toLowerCase()} suppliers ${city.name}`,
      `wholesale ${category.name.toLowerCase()} ${city.name}`,
      `${category.name.toLowerCase()} ${province.name}`,
      `buy ${category.name.toLowerCase()} online`,
      `cheap ${category.name.toLowerCase()} ${city.name}`,
      ...city.aliases.map(
        (a) => `${category.name.toLowerCase()} ${a}`,
      ),
      "wholesale South Africa",
      "TradeFeed",
    ],
    alternates: {
      canonical: `${APP_URL}/marketplace/${pSlug}/${cSlug}/${catSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `${APP_URL}/marketplace/${pSlug}/${cSlug}/${catSlug}`,
      siteName: "TradeFeed",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CityCategoryPage({
  params,
  searchParams,
}: Props) {
  const { province: pSlug, city: cSlug, category: catSlug } = await params;
  const result = getCity(pSlug, cSlug);
  if (!result) return notFound();

  const { province, city } = result;
  const sp = await searchParams;
  const provinceName = provinceSlugToDbValue(pSlug);
  const cityName = citySlugToDbValue(pSlug, cSlug);

  const allCategories = await getGlobalCategories();
  const category = findCategory(allCategories, catSlug);
  if (!category) return notFound();

  const isParent = category.children && category.children.length > 0;

  const filters = {
    ...(isParent ? { parentCategory: catSlug } : { category: catSlug }),
    search: sp.search,
    sortBy:
      (sp.sort as
        | "newest"
        | "trending"
        | "price_asc"
        | "price_desc"
        | "popular"
        | "top_rated"
        | "quality") || "quality",
    province: provinceName,
    city: cityName,
    minPrice: sp.minPrice ? parseInt(sp.minPrice, 10) : undefined,
    maxPrice: sp.maxPrice ? parseInt(sp.maxPrice, 10) : undefined,
    verifiedOnly: sp.verified === "true",
    page: sp.page ? parseInt(sp.page, 10) : 1,
    pageSize: 24,
  };

  await expirePromotedListings();

  const [
    productsResult,
    promoted,
    categories,
    trending,
    newArrivals,
    featuredShops,
  ] = await Promise.all([
    getMarketplaceProducts(filters),
    getPromotedProducts(12),
    Promise.resolve(allCategories),
    getTrendingProducts(12),
    getNewArrivals(8),
    getFeaturedShops(8),
  ]);

  const interleavedProducts = interleavePromotedProducts(
    productsResult.products,
    promoted,
  );

  const jsonLd = generateMarketplaceJsonLd(
    interleavedProducts.slice(0, 20).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      shopSlug: p.shop.slug,
      image: p.imageUrl,
      priceInCents: p.minPriceCents,
    })),
    category.name,
  );

  const cityCategoryJsonLd = generateCityCategoryPageJsonLd({
    provinceName: province.name,
    provinceSlug: province.slug,
    cityName: city.name,
    citySlug: city.slug,
    categoryName: category.name,
    categorySlug: catSlug,
    productCount: productsResult.total,
  });

  const parentCategory = category.parentId
    ? allCategories.find((c) => c.id === category.parentId)
    : undefined;

  // Sibling cities
  const siblingCities = province.cities.filter((c) => c.slug !== cSlug);

  // Sibling categories (same level)
  const siblingCategories = parentCategory
    ? (parentCategory.children ?? []).filter((c) => c.slug !== catSlug)
    : allCategories.filter((c) => c.slug !== catSlug);

  return (
    <>
      {[...jsonLd, ...cityCategoryJsonLd].map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

      {/* Hero */}
      <div className="bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 border-b border-stone-800/40">
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-10 sm:pt-24 sm:pb-12">
          <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-6 flex-wrap">
            <Link
              href="/marketplace"
              className="hover:text-emerald-400 transition-colors"
            >
              Marketplace
            </Link>
            <span>/</span>
            <Link
              href={`/marketplace/${province.slug}`}
              className="hover:text-emerald-400 transition-colors"
            >
              {province.name}
            </Link>
            <span>/</span>
            <Link
              href={`/marketplace/${province.slug}/${city.slug}`}
              className="hover:text-emerald-400 transition-colors"
            >
              {city.name}
            </Link>
            <span>/</span>
            <span className="text-stone-300">{category.name}</span>
          </nav>

          <div className="flex items-center gap-4">
            {category.icon && (
              <span className="text-4xl">{category.icon}</span>
            )}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-stone-100">
                {category.name}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  in {city.name}
                </span>
              </h1>
              <p className="mt-2 text-stone-500 text-sm">
                {productsResult.total} product
                {productsResult.total !== 1 ? "s" : ""} from {city.name},{" "}
                {province.name}
              </p>
            </div>
          </div>

          <p className="mt-4 text-stone-400 text-lg max-w-2xl leading-relaxed">
            Browse {category.name.toLowerCase()} from suppliers in {city.name},{" "}
            {province.name}. Compare wholesale & retail prices and order
            directly via WhatsApp on TradeFeed.
          </p>

          {/* Related categories in same city */}
          {siblingCategories.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="text-xs text-stone-500 self-center mr-1">
                Also in {city.name}:
              </span>
              {siblingCategories.slice(0, 10).map((c) => (
                <Link
                  key={c.slug}
                  href={`/marketplace/${province.slug}/${city.slug}/${c.slug}`}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-stone-800/80 border border-stone-700/50 text-stone-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                >
                  {c.icon && <span>{c.icon}</span>}
                  {c.name}
                </Link>
              ))}
            </div>
          )}

          {/* Same category in other cities */}
          {siblingCities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-stone-500 self-center mr-1">
                {category.name} in:
              </span>
              {siblingCities.slice(0, 8).map((c) => (
                <Link
                  key={c.slug}
                  href={`/marketplace/${province.slug}/${c.slug}/${catSlug}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-stone-800/80 border border-stone-700/50 text-stone-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <MarketplaceShell
        products={interleavedProducts}
        totalProducts={productsResult.total}
        totalPages={productsResult.totalPages}
        currentPage={productsResult.page}
        categories={categories}
        trendingProducts={trending}
        newArrivals={newArrivals}
        featuredShops={featuredShops}
        promotedProducts={promoted}
        currentFilters={filters}
      />
    </>
  );
}
