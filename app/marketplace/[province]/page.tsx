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
  SA_PROVINCES,
  getProvince,
  provinceSlugToDbValue,
} from "@/lib/marketplace/locations";

// ============================================================
// /marketplace/[province] — Province SEO Landing Page
// ============================================================
// Generates one page per SA province (e.g. /marketplace/gauteng).
// Targets keywords like "suppliers in Gauteng", "wholesale Johannesburg".
// Reuses MarketplaceShell with province pre-filtered.
// ============================================================

export const revalidate = 300;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface Props {
  params: Promise<{ province: string }>;
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

// ── Static generation for all 9 provinces ───────────────────
export function generateStaticParams() {
  return SA_PROVINCES.map((p) => ({ province: p.slug }));
}

// ── SEO Metadata ────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { province: slug } = await params;
  const province = getProvince(slug);
  if (!province) return { title: "Not Found" };

  const topCities = province.cities.slice(0, 3).map((c) => c.name).join(", ");

  const title = `Suppliers in ${province.name} — Wholesale Clothing, Fashion & More | TradeFeed`;
  const description = `${province.description} Browse wholesale and retail products from verified sellers in ${topCities} and across ${province.name}. Order via WhatsApp on TradeFeed.`;

  return {
    title,
    description,
    keywords: [
      `suppliers in ${province.name}`,
      `suppliers ${province.name}`,
      `wholesale ${province.name}`,
      `wholesale clothing ${province.name}`,
      `buy online ${province.name}`,
      ...province.cities.slice(0, 4).map((c) => `suppliers ${c.name}`),
      ...province.cities.slice(0, 4).map((c) => `wholesale ${c.name}`),
      "suppliers South Africa",
      "wholesale South Africa",
      "TradeFeed",
    ],
    alternates: { canonical: `${APP_URL}/marketplace/${slug}` },
    openGraph: {
      title,
      description,
      url: `${APP_URL}/marketplace/${slug}`,
      siteName: "TradeFeed",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

// ── Page Component ──────────────────────────────────────────
export default async function ProvincePage({ params, searchParams }: Props) {
  const { province: slug } = await params;
  const province = getProvince(slug);
  if (!province) return notFound();

  const sp = await searchParams;
  const provinceName = provinceSlugToDbValue(slug);

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
  });

  return (
    <>
      {[...jsonLd, ...locationJsonLd].map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

      {/* Province hero */}
      <div className="bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 border-b border-stone-800/40">
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-10 sm:pt-24 sm:pb-12">
          <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-6">
            <Link href="/marketplace" className="hover:text-emerald-400 transition-colors">
              Marketplace
            </Link>
            <span>/</span>
            <span className="text-stone-300">{province.name}</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-stone-100">
            Suppliers in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              {province.name}
            </span>
          </h1>
          <p className="mt-4 text-stone-400 text-lg max-w-2xl leading-relaxed">
            {province.description} Browse wholesale and retail products, compare
            prices, and order directly via WhatsApp.
          </p>

          {/* City pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {province.cities.map((city) => (
              <Link
                key={city.slug}
                href={`/marketplace/${province.slug}/${city.slug}`}
                className="inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium bg-stone-800/80 border border-stone-700/50 text-stone-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
              >
                {city.name}
              </Link>
            ))}
          </div>
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
