import type { Metadata } from "next";
import {
  getMarketplaceProducts,
  getPromotedProducts,
  getGlobalCategories,
  getTrendingProducts,
  getFeaturedShops,
  interleavePromotedProducts,
} from "@/lib/db/marketplace";
import { MarketplaceShell } from "@/components/marketplace/marketplace-shell";
import { generateMarketplaceJsonLd } from "@/lib/seo/json-ld";

// ============================================================
// /marketplace — Public Discovery Page
// ============================================================
// The main marketplace page where anyone can browse ALL products
// across ALL sellers. No auth required.
//
// Server component: fetches initial data, passes to client shell.
// ============================================================

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
    ? `${categoryName} — TradeFeed Marketplace`
    : "Marketplace — Browse SA's Best Products | TradeFeed";

  const description = categoryName
    ? `Shop ${categoryName.toLowerCase()} from South Africa's top clothing sellers on TradeFeed. Wholesale & retail prices. Order via WhatsApp.`
    : "Discover products from South Africa's top clothing sellers. Browse hoodies, sneakers, dresses, accessories and more. Wholesale & retail prices.";

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
      "TradeFeed marketplace",
      "South Africa clothing",
      "wholesale fashion",
      "buy clothing online SA",
      ...(categoryName ? [categoryName.toLowerCase(), `buy ${categoryName.toLowerCase()} SA`] : []),
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
    sortBy: (params.sort as "newest" | "trending" | "price_asc" | "price_desc" | "popular") || "newest",
    province: params.province,
    minPrice: params.minPrice ? parseInt(params.minPrice, 10) : undefined,
    maxPrice: params.maxPrice ? parseInt(params.maxPrice, 10) : undefined,
    verifiedOnly: params.verified === "true",
    page: params.page ? parseInt(params.page, 10) : 1,
    pageSize: 24,
  };

  // Fetch all data in parallel
  const [productsResult, promoted, categories, trending, featuredShops] =
    await Promise.all([
      getMarketplaceProducts(filters),
      getPromotedProducts(12),
      getGlobalCategories(),
      getTrendingProducts(12),
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
        featuredShops={featuredShops}
        promotedProducts={promoted}
        currentFilters={filters}
      />
    </>
  );
}
