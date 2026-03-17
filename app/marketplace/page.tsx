import type { Metadata } from "next";
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
import { generateMarketplaceJsonLd } from "@/lib/seo/json-ld";
import { expirePromotedListings } from "@/lib/db/promotions";
import { SA_PROVINCES } from "@/lib/marketplace/locations";

// ============================================================
// /marketplace — Public Discovery Page
// ============================================================
// The main marketplace page where anyone can browse ALL products
// across ALL sellers. No auth required.
//
// Server component: fetches initial data, passes to client shell.
// ============================================================

// ISR: revalidate marketplace every 5 minutes for fresh listings
export const revalidate = 300;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface MarketplacePageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    province?: string;
    minPrice?: string;
    maxPrice?: string;
    verified?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: MarketplacePageProps): Promise<Metadata> {
  const params = await searchParams;
  const category = params.category;

  // Look up category display name if filtering
  let categoryName = "";
  if (category) {
    const categories = await getGlobalCategories();
    const match = categories.find((c) => c.slug === category);
    categoryName = match?.name || category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const title = categoryName
    ? `Buy ${categoryName} Online South Africa — Wholesale & Retail | TradeFeed Marketplace`
    : "Buy Online South Africa — Wholesale Clothing, Shoes, Fashion & More | TradeFeed Marketplace";

  const description = categoryName
    ? `Shop ${categoryName.toLowerCase()} from verified South African sellers on TradeFeed. Wholesale & retail prices. Free delivery options. Order via WhatsApp. Browse ${categoryName.toLowerCase()} from Johannesburg, Durban, Cape Town & more.`
    : "Browse thousands of products from verified South African fashion sellers. Wholesale & retail clothing, shoes, bags & accessories. Compare prices, order via WhatsApp. Sellers in all 9 provinces.";

  // Build OG image URL
  const ogUrl = new URL("/api/og", APP_URL);
  ogUrl.searchParams.set("type", "marketplace");
  if (categoryName) ogUrl.searchParams.set("category", categoryName);

  const canonicalUrl = category
    ? `${APP_URL}/marketplace?category=${category}`
    : `${APP_URL}/marketplace`;

  return {
    title,
    description,
    keywords: [
      "buy online South Africa",
      "TradeFeed marketplace",
      "wholesale South Africa",
      "SA marketplace",
      "buy wholesale online SA",
      "cheap clothes South Africa",
      "buy shoes online South Africa",
      "fashion South Africa",
      "online shopping South Africa",
      ...(categoryName ? [
        categoryName.toLowerCase(),
        `buy ${categoryName.toLowerCase()} South Africa`,
        `${categoryName.toLowerCase()} wholesale`,
        `cheap ${categoryName.toLowerCase()} South Africa`,
        `${categoryName.toLowerCase()} online South Africa`,
      ] : []),
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "TradeFeed",
      type: "website",
      images: [{ url: ogUrl.toString(), width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl.toString()],
    },
  };
}

export default async function MarketplacePage({
  searchParams,
}: MarketplacePageProps) {
  const params = await searchParams;

  // Build filters from URL params
  const filters = {
    category: params.category,
    search: params.search,
    sortBy: (params.sort as "quality" | "newest" | "trending" | "price_asc" | "price_desc" | "popular" | "top_rated") || "quality",
    province: params.province,
    minPrice: params.minPrice ? parseInt(params.minPrice, 10) : undefined,
    maxPrice: params.maxPrice ? parseInt(params.maxPrice, 10) : undefined,
    verifiedOnly: params.verified === "true",
    page: params.page ? parseInt(params.page, 10) : 1,
    pageSize: 24,
  };

  // M5.4 — Expire stale promotions before fetching (fast updateMany)
  await expirePromotedListings();

  // Fetch all data in parallel
  const [productsResult, promoted, categories, trending, newArrivals, featuredShops] =
    await Promise.all([
      getMarketplaceProducts(filters),
      getPromotedProducts(12),
      getGlobalCategories(),
      getTrendingProducts(12),
      getNewArrivals(8),
      getFeaturedShops(8),
    ]);

  // Interleave promoted products into organic results
  const interleavedProducts = interleavePromotedProducts(
    productsResult.products,
    promoted
  );

  // Generate JSON-LD structured data for SEO
  const jsonLd = generateMarketplaceJsonLd(
    interleavedProducts.slice(0, 20).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      shopSlug: p.shop.slug,
      image: p.imageUrl,
      priceInCents: p.minPriceCents,
    })),
    filters.category
      ? categories.find((c) => c.slug === filters.category)?.name
      : undefined
  );

  return (
    <>
      {/* JSON-LD structured data */}
      {jsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

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

      {/* ── Internal linking for SEO ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-16 border-t border-stone-800/30">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Browse by Province */}
          <div>
            <h2 className="text-lg font-bold text-stone-200 mb-4">
              Browse Suppliers by Province
            </h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
              {SA_PROVINCES.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/marketplace/${p.slug}`}
                    className="text-sm text-stone-400 hover:text-emerald-400 transition-colors"
                  >
                    Suppliers in {p.name} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Browse by Category */}
          <div>
            <h2 className="text-lg font-bold text-stone-200 mb-4">
              Browse by Category
            </h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
              {categories
                .filter((c) => !c.parentId)
                .slice(0, 12)
                .map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/marketplace/category/${c.slug}`}
                      className="text-sm text-stone-400 hover:text-emerald-400 transition-colors"
                    >
                      {c.name} →
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* WhatsApp Import CTA */}
        <div className="mt-10 pt-8 border-t border-stone-800/30 text-center">
          <p className="text-sm text-stone-500">
            Already selling on WhatsApp?{" "}
            <Link
              href="/import-whatsapp-catalogue"
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            >
              Import your WhatsApp catalogue
            </Link>{" "}
            and get your own online shop in 30 seconds.
          </p>
        </div>
      </section>
    </>
  );
}
