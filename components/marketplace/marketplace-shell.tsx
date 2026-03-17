// ============================================================
// Marketplace Shell — Client-Side Interactive Wrapper
// ============================================================
// Handles search, filter state, URL updates, and renders all
// marketplace sections. Receives server-fetched data as props.
// ============================================================

"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
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
import { LanguageSwitcher } from "@/components/language-switcher";
import { IllustrationSearchNotFound } from "@/components/ui/illustrations";
import {
  trackMarketplaceViewAction,
  trackPromotedImpressionsAction,
  loadMoreProducts,
} from "@/app/actions/marketplace";
import { buildMarketplaceSearchParams } from "@/lib/marketplace/search-params";

interface MarketplaceShellProps {
  products: MarketplaceProduct[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  categories: CategoryWithCount[];
  trendingProducts: MarketplaceProduct[];
  newArrivals: MarketplaceProduct[];
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
  newArrivals,
  featuredShops,
  promotedProducts,
  currentFilters,
}: MarketplaceShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { isSignedIn } = useUser();
  const t = useTranslations("marketplace");
  const tNav = useTranslations("nav");
  const [search, setSearch] = useState(currentFilters.search ?? "");
  const [filterOpen, setFilterOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [suggestions, setSuggestions] = useState<{
    products: { name: string; slug: string }[];
    categories: { name: string; slug: string }[];
  }>({ products: [], categories: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsBoxRef = useRef<HTMLDivElement>(null);

  // ── Infinite scroll state ───────────────────────────────
  const [allProducts, setAllProducts] = useState(products);
  const [nextPage, setNextPage] = useState(currentPage + 1);
  const [hasMore, setHasMore] = useState(currentPage < totalPages);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset accumulated products when server data changes (filter/search/sort)
  useEffect(() => {
    setAllProducts(products);
    setNextPage(currentPage + 1);
    setHasMore(currentPage < totalPages);
  }, [products, currentPage, totalPages]);

  // IntersectionObserver to trigger loading more products
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore && hasMore) {
          setIsLoadingMore(true);
          loadMoreProducts({
            category: currentFilters.category,
            search: currentFilters.search,
            sortBy: currentFilters.sortBy,
            province: currentFilters.province,
            minPrice: currentFilters.minPrice,
            maxPrice: currentFilters.maxPrice,
            verifiedOnly: currentFilters.verifiedOnly,
            page: nextPage,
            pageSize: currentFilters.pageSize,
          }).then((result) => {
            if (result.products.length > 0) {
              setAllProducts((prev) => [...prev, ...result.products]);
            }
            setHasMore(result.hasMore);
            setNextPage(result.nextPage);
            setIsLoadingMore(false);
          }).catch(() => {
            setIsLoadingMore(false);
          });
        }
      },
      { rootMargin: "600px" } // Start loading 600px before reaching bottom
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, nextPage, currentFilters]);

  // Sync local input when URL-driven search changes (e.g. back/forward nav)
  useEffect(() => {
    setSearch(currentFilters.search ?? "");
  }, [currentFilters.search]);

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

  // Handle search submit (Enter key / button)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    updateFilters({ search: search.trim() || undefined });
  };

  // Debounced auto-search on typing (400ms delay, min 2 chars)
  const handleSearchInput = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const trimmed = value.trim();
        if (trimmed.length >= 2 || trimmed.length === 0) {
          updateFilters({ search: trimmed || undefined });
        }
      }, 400);

      // Autocomplete suggestions
      if (autocompleteRef.current) clearTimeout(autocompleteRef.current);
      const trimmedForAc = value.trim();
      if (trimmedForAc.length < 2) {
        setSuggestions({ products: [], categories: [] });
        setShowSuggestions(false);
        return;
      }
      autocompleteRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(trimmedForAc)}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data);
            setShowSuggestions(data.products.length > 0 || data.categories.length > 0);
          }
        } catch {
          // Silently fail — autocomplete is non-critical
        }
      }, 200);
    },
    [updateFilters]
  );

  // Select a suggestion
  const selectSuggestion = useCallback(
    (name: string) => {
      setSearch(name);
      setShowSuggestions(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      updateFilters({ search: name });
    },
    [updateFilters]
  );

  const selectCategorySuggestion = useCallback(
    (slug: string) => {
      setShowSuggestions(false);
      setSearch("");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      updateFilters({ category: slug, search: undefined });
    },
    [updateFilters]
  );

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsBoxRef.current && !suggestionsBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            <div className="relative w-full" ref={suggestionsBoxRef}>
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
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => {
                  if (suggestions.products.length > 0 || suggestions.categories.length > 0)
                    setShowSuggestions(true);
                }}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-xl bg-stone-900 border border-stone-800 pl-10 pr-4 py-2.5 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSuggestions({ products: [], categories: [] });
                    setShowSuggestions(false);
                    updateFilters({ search: undefined });
                  }}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-stone-700 flex items-center justify-center text-stone-400 hover:bg-stone-600 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Autocomplete dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl bg-stone-900 border border-stone-700/80 shadow-2xl overflow-hidden z-50">
                  {suggestions.categories.length > 0 && (
                    <div className="px-3 pt-2.5 pb-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 px-1">Categories</p>
                      {suggestions.categories.map((c) => (
                        <button
                          key={c.slug}
                          type="button"
                          onMouseDown={() => selectCategorySuggestion(c.slug)}
                          className="w-full text-left px-2 py-1.5 text-sm text-emerald-400 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 text-stone-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                          </svg>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {suggestions.products.length > 0 && (
                    <div className="px-3 pt-2 pb-2">
                      {suggestions.categories.length > 0 && <div className="border-t border-stone-800 mb-2" />}
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 px-1 mb-1">Products</p>
                      {suggestions.products.map((p) => (
                        <button
                          key={p.slug}
                          type="button"
                          onMouseDown={() => selectSuggestion(p.name)}
                          className="w-full text-left px-2 py-1.5 text-sm text-stone-200 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 text-stone-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                          </svg>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
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
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder={t("searchPlaceholder")}
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

      {/* ── New Arrivals (only on default view, no search) ── */}
      {newArrivals.length > 0 && !hasFiltersOrSearch && (
        <section className="px-4 sm:px-6 pt-4 pb-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✨</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400">
                Just Listed
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {newArrivals.slice(0, 6).map((product) => (
                <MarketplaceProductCard key={`new-${product.id}`} product={product} compact />
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
              aria-label="Sort products"
              className="rounded-xl bg-stone-900 border border-stone-800 px-3 py-2 text-sm text-stone-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="quality">Best Match</option>
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
          {allProducts.length === 0 && !isPending ? (
            /* Empty State */
            <div className="flex flex-col items-center py-20 text-center">
              <IllustrationSearchNotFound className="w-44 h-44 mb-4" />
              <h3 className="text-lg font-bold text-stone-300 mb-1">{t("noResults")}</h3>
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
              {/* Loading overlay with skeleton shimmer */}
              <div className={`transition-opacity duration-300 ${isPending ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {allProducts.map((product, idx) => (
                    <MarketplaceProductCard key={`${product.id}-${idx}`} product={product} />
                  ))}
                </div>
              </div>

              {/* Searching indicator */}
              {isPending && allProducts.length === 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-stone-900 border border-stone-800/50 overflow-hidden">
                      <div className="aspect-square bg-stone-800 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                      <div className="p-3 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-stone-800 animate-pulse" style={{ animationDelay: `${i * 80 + 40}ms` }} />
                        <div className="h-3 w-1/2 rounded bg-stone-800/60 animate-pulse" style={{ animationDelay: `${i * 80 + 80}ms` }} />
                        <div className="h-5 w-1/3 rounded bg-stone-800 animate-pulse" style={{ animationDelay: `${i * 80 + 120}ms` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Infinite scroll sentinel + loading indicator */}
              {hasMore && (
                <div ref={sentinelRef} className="flex items-center justify-center py-10">
                  {isLoadingMore && (
                    <div className="flex items-center gap-3 text-sm text-stone-500">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      Loading more products…
                    </div>
                  )}
                </div>
              )}

              {/* End of results */}
              {!hasMore && allProducts.length > 0 && totalProducts > currentFilters.pageSize && (
                <p className="text-center text-sm text-stone-600 py-8">
                  You&apos;ve seen all {totalProducts.toLocaleString()} products ✓
                </p>
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
              <Link href="/contact" className="hover:text-stone-300 transition-colors">Contact</Link>
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
        aria-label={`Remove ${label} filter`}
        className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 flex items-center justify-center transition-colors"
      >
        <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
