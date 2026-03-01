// ============================================================
// Marketplace Shell — Client-Side Interactive Wrapper
// ============================================================
// Handles search, filter state, URL updates, and renders all
// marketplace sections. Receives server-fetched data as props.
// ============================================================

"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import type {
  MarketplaceProduct,
  CategoryWithCount,
  FeaturedShop,
  MarketplaceSortBy,
} from "@/lib/db/marketplace";
import { MarketplaceProductCard } from "./marketplace-product-card";
import { FeaturedCarousel } from "./featured-carousel";
import { FeaturedShopCard } from "./featured-shop-card";
import { CategoryBar } from "./category-bar";
import { MarketplaceFilterSheet } from "./marketplace-filter-sheet";
import { BackToTop } from "@/components/ui/back-to-top";
import { IllustrationSearchNotFound } from "@/components/ui/illustrations";
import {
  trackMarketplaceViewAction,
  trackPromotedImpressionsAction,
} from "@/app/actions/marketplace";
import { buildMarketplaceSearchParams } from "@/lib/marketplace/search-params";

interface MarketplaceShellProps {
  products: MarketplaceProduct[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  categories: CategoryWithCount[];
  trendingProducts: MarketplaceProduct[];
  featuredShops: FeaturedShop[];
  promotedProducts: MarketplaceProduct[];
  currentFilters: {
    category?: string;
    search?: string;
    sortBy: MarketplaceSortBy;
    province?: string;
    minPrice?: number;
    maxPrice?: number;
    verifiedOnly: boolean;
    page: number;
    pageSize: number;
  };
}

export function MarketplaceShell({
  products,
  totalProducts,
  totalPages,
  currentPage,
  categories,
  trendingProducts,
  featuredShops,
  promotedProducts,
  currentFilters,
}: MarketplaceShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { isSignedIn } = useUser();
  const [search, setSearch] = useState(currentFilters.search ?? "");
  const [filterOpen, setFilterOpen] = useState(false);

  // Track marketplace page view on mount
  useEffect(() => {
    trackMarketplaceViewAction();
  }, []);

  // Track promoted impressions
  useEffect(() => {
    const promotedIds = promotedProducts
      .filter((p) => p.promotion)
      .map((p) => p.promotion!.promotedListingId);
    if (promotedIds.length > 0) {
      trackPromotedImpressionsAction(promotedIds);
    }
  }, [promotedProducts]);

  // Update URL search params
  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      startTransition(() => {
        const nextParams = buildMarketplaceSearchParams(
          searchParams.toString(),
          updates
        );
        router.push(`/marketplace?${nextParams}`, { scroll: false });
      });
    },
    [router, searchParams, startTransition]
  );

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: search.trim() || undefined });
  };

  // Count active filters
  const activeFilterCount = [
    currentFilters.province,
    currentFilters.minPrice,
    currentFilters.maxPrice,
    currentFilters.verifiedOnly ? "yes" : undefined,
  ].filter(Boolean).length;

  const hasFiltersOrSearch =
    currentFilters.category ||
    currentFilters.search ||
    currentFilters.province ||
    currentFilters.minPrice ||
    currentFilters.maxPrice ||
    currentFilters.verifiedOnly;

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      {/* ── Navbar ──────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-950/80 backdrop-blur-xl border-b border-stone-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <TradeFeedLogo />
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, shops, categories..."
                className="w-full rounded-xl bg-stone-900 border border-stone-800 pl-10 pr-4 py-2.5 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    updateFilters({ search: undefined });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-stone-700 flex items-center justify-center text-stone-400 hover:bg-stone-600 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-stone-400 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <UserButton
                  afterSignOutUrl="/marketplace"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-stone-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all"
                >
                  Start Selling
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative pt-24 pb-6 sm:pt-28 sm:pb-8 px-4 sm:px-6">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/6 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Discover SA&apos;s Best{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
                Products
              </span>
            </h1>
            <p className="mt-2 text-stone-400 text-sm sm:text-base max-w-lg">
              Browse thousands of products from verified South African sellers.
              Wholesale &amp; retail prices. Order directly via WhatsApp.
            </p>
          </div>

          {/* Mobile search */}
          <form onSubmit={handleSearch} className="md:hidden mt-4">
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, shops..."
                className="w-full rounded-xl bg-stone-900 border border-stone-800 pl-10 pr-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </form>
        </div>
      </section>

      {/* ── Category Bar ────────────────────────────────── */}
      <CategoryBar
        categories={categories}
        selectedCategory={currentFilters.category}
        onSelectCategory={(slug) =>
          updateFilters({ category: slug || undefined })
        }
      />

      {/* ── Featured Carousel (only if promoted products exist) */}
      {promotedProducts.length > 0 && !hasFiltersOrSearch && (
        <section className="px-4 sm:px-6 pt-4 pb-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔥</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400">
                Featured Products
              </h2>
            </div>
            <FeaturedCarousel products={promotedProducts} />
          </div>
        </section>
      )}

      {/* ── Featured Shops (only on default view) ───────── */}
      {featuredShops.length > 0 && !hasFiltersOrSearch && (
        <section className="px-4 sm:px-6 pt-4 pb-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⭐</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400">
                Featured Shops
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {featuredShops.map((shop) => (
                <FeaturedShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trending (only on default view, no search) ──── */}
      {trendingProducts.length > 0 && !hasFiltersOrSearch && (
        <section className="px-4 sm:px-6 pt-4 pb-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📈</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400">
                Trending This Week
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {trendingProducts.slice(0, 6).map((product) => (
                <MarketplaceProductCard key={`trending-${product.id}`} product={product} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Filter Bar + Sort ───────────────────────────── */}
      <section className="px-4 sm:px-6 pt-6 pb-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Filter button */}
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-sm text-stone-300 hover:border-stone-700 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Results count */}
              <div className="flex items-center gap-1.5">
                {isPending ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
                <p className="text-sm text-stone-500">
                  <span className="font-semibold text-stone-300">{totalProducts.toLocaleString()}</span>{" "}
                  {totalProducts === 1 ? "product" : "products"}
                  {currentFilters.search && (
                    <span className="text-stone-500">
                      {" "}for &ldquo;<span className="text-emerald-400">{currentFilters.search}</span>&rdquo;
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Sort dropdown */}
            <select
              value={currentFilters.sortBy}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="rounded-xl bg-stone-900 border border-stone-800 px-3 py-2 text-sm text-stone-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="trending">Trending</option>
              <option value="top_rated">Top Rated</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="popular">Popular</option>
            </select>
          </div>

          {/* Active filter tags */}
          {hasFiltersOrSearch && (
            <div className="flex flex-wrap gap-2 mt-3">
              {currentFilters.category && (
                <FilterTag
                  label={`Category: ${currentFilters.category}`}
                  onRemove={() => updateFilters({ category: undefined })}
                />
              )}
              {currentFilters.search && (
                <FilterTag
                  label={`Search: ${currentFilters.search}`}
                  onRemove={() => {
                    setSearch("");
                    updateFilters({ search: undefined });
                  }}
                />
              )}
              {currentFilters.province && (
                <FilterTag
                  label={currentFilters.province}
                  onRemove={() => updateFilters({ province: undefined })}
                />
              )}
              {currentFilters.verifiedOnly && (
                <FilterTag
                  label="Verified only"
                  onRemove={() => updateFilters({ verified: undefined })}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  router.push("/marketplace");
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Product Grid ────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          {products.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center py-20 text-center">
              <IllustrationSearchNotFound className="w-44 h-44 mb-4" />
              <h3 className="text-lg font-bold text-stone-300 mb-1">No products found</h3>
              <p className="text-sm text-stone-500 max-w-sm mb-4">
                Try adjusting your filters, search for something else, or browse all products.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  router.push("/marketplace");
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-all"
              >
                Browse All Products
              </button>
            </div>
          ) : (
            <>
              {/* Loading overlay */}
              <div className={`transition-opacity duration-200 ${isPending ? "opacity-50" : "opacity-100"}`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {products.map((product, idx) => (
                    <MarketplaceProductCard key={`${product.id}-${idx}`} product={product} />
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {currentPage > 1 && (
                    <button
                      type="button"
                      onClick={() => updateFilters({ page: String(currentPage - 1) })}
                      className="px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-sm text-stone-300 hover:border-stone-700 transition-all"
                    >
                      ← Previous
                    </button>
                  )}
                  <span className="text-sm text-stone-500 px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  {currentPage < totalPages && (
                    <button
                      type="button"
                      onClick={() => updateFilters({ page: String(currentPage + 1) })}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-all"
                    >
                      Next Page →
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-stone-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <TradeFeedLogo size="sm" />
            </Link>
            <div className="flex items-center gap-6 text-xs text-stone-500">
              <Link href="/privacy" className="hover:text-stone-300 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-stone-300 transition-colors">Terms</Link>
              {isSignedIn ? (
                <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Dashboard</Link>
              ) : (
                <Link href="/sign-up" className="hover:text-emerald-400 transition-colors">Start Selling</Link>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Filter Sheet (Mobile + Desktop) ─────────────── */}
      <MarketplaceFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={categories}
        currentFilters={currentFilters}
        onApply={(filters) => {
          updateFilters(filters);
          setFilterOpen(false);
        }}
      />
      <BackToTop />
    </main>
  );
}

// ── Tiny helper component ──────────────────────────────────

function FilterTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 flex items-center justify-center transition-colors"
      >
        <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
