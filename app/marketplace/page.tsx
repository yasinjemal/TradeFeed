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

// ============================================================
// /marketplace — Public Discovery Page
// ============================================================
// The main marketplace page where anyone can browse ALL products
// across ALL sellers. No auth required.
//
// Server component: fetches initial data, passes to client shell.
// ============================================================

export const metadata: Metadata = {
  title: "Marketplace — Browse SA's Best Products | TradeFeed",
  description:
    "Discover products from South Africa's top clothing sellers. Browse hoodies, sneakers, dresses, accessories and more. Wholesale & retail prices.",
  keywords: [
    "TradeFeed marketplace",
    "South Africa clothing",
    "wholesale fashion",
    "buy clothing online SA",
    "Jeppe fashion market",
  ],
};

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

  return (
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
  );
}
