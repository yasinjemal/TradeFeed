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
} from "@/lib/db/marketplace";
import { MarketplaceShell } from "@/components/marketplace/marketplace-shell";
import { generateMarketplaceJsonLd, generateLocationPageJsonLd } from "@/lib/seo/json-ld";
import { expirePromotedListings } from "@/lib/db/promotions";
import {
  getAllCityParams,
  getCity,
  provinceSlugToDbValue,
  citySlugToDbValue,
} from "@/lib/marketplace/locations";

// ============================================================
// /marketplace/[province]/[city] — City SEO Landing Page
// ============================================================
// Generates pages like /marketplace/gauteng/johannesburg.
// Targets "suppliers in Johannesburg", "wholesale Johannesburg".
// ============================================================

export const revalidate = 300;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface Props {
  params: Promise<{ province: string; city: string }>;
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    verified?: string;
    page?: string;
  }>;
}

export function generateStaticParams() {
  return getAllCityParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { province: pSlug, city: cSlug } = await params;
  const result = getCity(pSlug, cSlug);
  if (!result) return { title: "Not Found" };

  const { province, city } = result;
  const title = `Suppliers in ${city.name}, ${province.name} — Wholesale & Retail | TradeFeed`;
  const description = `Find wholesale clothing, fashion, electronics and more from suppliers in ${city.name}, ${province.name}. Order via WhatsApp on TradeFeed — South Africa's online marketplace.`;

  const allNames = [city.name, ...city.aliases];

  return {
    title,
    description,
    keywords: [
      `suppliers in ${city.name}`,
      `suppliers ${city.name}`,
      `wholesale ${city.name}`,
      `wholesale clothing ${city.name}`,
      `buy online ${city.name}`,
      `${city.name} shops`,
      `${city.name} marketplace`,
      ...city.aliases.map((a) => `wholesale ${a}`),
      `suppliers ${province.name}`,
      "wholesale South Africa",
      "TradeFeed",
    ],
    alternates: { canonical: `${APP_URL}/marketplace/${pSlug}/${cSlug}` },
    openGraph: {
      title,
      description,
      url: `${APP_URL}/marketplace/${pSlug}/${cSlug}`,
      siteName: "TradeFeed",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CityPage({ params, searchParams }: Props) {
  const { province: pSlug, city: cSlug } = await params;
  const result = getCity(pSlug, cSlug);
  if (!result) return notFound();

  const { province, city } = result;
  const sp = await searchParams;
  const provinceName = provinceSlugToDbValue(pSlug);
  const cityName = citySlugToDbValue(pSlug, cSlug);

  const filters = {
    category: sp.category,
    search: sp.search,
    sortBy:
      (sp.sort as
        | "newest"
        | "trending"
        | "price_asc"
        | "price_desc"
        | "popular"
        | "top_rated") || "newest",
    province: provinceName,
    city: cityName,
    minPrice: sp.minPrice ? parseInt(sp.minPrice, 10) : undefined,
    maxPrice: sp.maxPrice ? parseInt(sp.maxPrice, 10) : undefined,
    verifiedOnly: sp.verified === "true",
    page: sp.page ? parseInt(sp.page, 10) : 1,
    pageSize: 24,
  };

  await expirePromotedListings();

  const [productsResult, promoted, categories, trending, newArrivals, featuredShops] =
    await Promise.all([
      getMarketplaceProducts(filters),
      getPromotedProducts(12),
      getGlobalCategories(),
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
    undefined,
  );

  const locationJsonLd = generateLocationPageJsonLd({
    provinceName: province.name,
    provinceSlug: province.slug,
    cityName: city.name,
    citySlug: city.slug,
  });

  // Sibling cities in same province (for internal linking)
  const siblingCities = province.cities.filter((c) => c.slug !== cSlug);

  return (
    <>
      {[...jsonLd, ...locationJsonLd].map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

      {/* City hero */}
      <div className="bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 border-b border-stone-800/40">
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-10 sm:pt-24 sm:pb-12">
          <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-6">
            <Link href="/marketplace" className="hover:text-emerald-400 transition-colors">
              Marketplace
            </Link>
            <span>/</span>
            <Link href={`/marketplace/${province.slug}`} className="hover:text-emerald-400 transition-colors">
              {province.name}
            </Link>
            <span>/</span>
            <span className="text-stone-300">{city.name}</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-stone-100">
            Suppliers in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              {city.name}
            </span>
          </h1>
          <p className="mt-4 text-stone-400 text-lg max-w-2xl leading-relaxed">
            Browse wholesale and retail products from verified sellers in{" "}
            {city.name}, {province.name}. Compare prices and order directly via
            WhatsApp on TradeFeed.
          </p>

          {/* Sibling city pills */}
          {siblingCities.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="text-xs text-stone-500 self-center mr-1">
                Also in {province.name}:
              </span>
              {siblingCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/marketplace/${province.slug}/${c.slug}`}
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
