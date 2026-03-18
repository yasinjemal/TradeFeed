// ============================================================
// Marketplace Shell — Client-Side Interactive Wrapper
// ============================================================
// Handles search, filter state, URL updates, and renders all
// marketplace sections. Receives server-fetched data as props.
// ============================================================

"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { MarketplaceFilterSidebar } from "./marketplace-filter-sidebar";
import { MarketplaceActivity } from "./marketplace-activity";
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
    <main className="min-h-screen bg-white text-slate-900">
      {/* ── Navbar ──────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <TradeFeedLogo variant="dark" />
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full" ref={suggestionsBoxRef}>
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
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
                className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Autocomplete dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden z-50">
                  {suggestions.categories.length > 0 && (
                    <div className="px-3 pt-2.5 pb-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">Categories</p>
                      {suggestions.categories.map((c) => (
                        <button
                          key={c.slug}
                          type="button"
                          onMouseDown={() => selectCategorySuggestion(c.slug)}
                          className="w-full text-left px-2 py-1.5 text-sm text-blue-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                          </svg>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {suggestions.products.length > 0 && (
                    <div className="px-3 pt-2 pb-2">
                      {suggestions.categories.length > 0 && <div className="border-t border-slate-100 mb-2" />}
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1">Products</p>
                      {suggestions.products.map((p) => (
                        <button
                          key={p.slug}
                          type="button"
                          onMouseDown={() => selectSuggestion(p.name)}
                          className="w-full text-left px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
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
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                >
                  Start Selling
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero — Trust Header ───────────────────────── */}
      <section className="relative pt-24 pb-10 sm:pt-28 sm:pb-14 px-4 sm:px-6 overflow-hidden">
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-white to-white pointer-events-none" />
        {/* Decorative gradient orbs */}
        <div className="absolute -top-24 left-1/4 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/3 w-[400px] h-[400px] bg-indigo-200/15 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          className="relative max-w-7xl mx-auto text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900">
            Find trusted products from{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">
              South African sellers
            </span>
          </h1>
          <p className="mt-3 text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
            Browse thousands of products. Wholesale &amp; retail prices. Order directly via WhatsApp.
          </p>

          {/* Trust badges — pill style */}
          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-medium text-blue-700">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified Sellers
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 text-xs font-medium text-green-700">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Local Businesses
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-medium text-emerald-700">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              </svg>
              WhatsApp Ordering
            </span>
          </div>

          {/* Live activity signal */}
          <div className="mt-4 flex justify-center">
            <MarketplaceActivity totalProducts={totalProducts} totalShops={featuredShops.length} />
          </div>

          {/* Desktop search (centered, large) */}
          <form onSubmit={handleSearch} className="hidden md:block mt-8 max-w-2xl mx-auto">
            <div className="relative" ref={suggestionsBoxRef}>
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
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
                className="w-full rounded-2xl bg-white border border-slate-200 pl-12 pr-14 py-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 shadow-lg shadow-slate-200/50 transition-all"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSuggestions({ products: [], categories: [] });
                    setShowSuggestions(false);
                    updateFilters({ search: undefined });
                  }}
                  aria-label="Clear search"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
                >
                  Search
                </button>
              )}

              {/* Autocomplete dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden z-50">
                  {suggestions.categories.length > 0 && (
                    <div className="px-3 pt-2.5 pb-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">Categories</p>
                      {suggestions.categories.map((c) => (
                        <button
                          key={c.slug}
                          type="button"
                          onMouseDown={() => selectCategorySuggestion(c.slug)}
                          className="w-full text-left px-2 py-1.5 text-sm text-blue-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                          </svg>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {suggestions.products.length > 0 && (
                    <div className="px-3 pt-2 pb-2">
                      {suggestions.categories.length > 0 && <div className="border-t border-slate-100 mb-2" />}
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1">Products</p>
                      {suggestions.products.map((p) => (
                        <button
                          key={p.slug}
                          type="button"
                          onMouseDown={() => selectSuggestion(p.name)}
                          className="w-full text-left px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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

          {/* Mobile search */}
          <form onSubmit={handleSearch} className="md:hidden mt-6">
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
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
                className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </form>
        </motion.div>
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
        <section className="px-4 sm:px-6 pt-8 pb-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                🔥 Featured Products
              </h2>
            </div>
            <FeaturedCarousel products={promotedProducts} />
          </div>
        </section>
      )}

      {/* ── Featured Shops (only on default view) ───────── */}
      {featuredShops.length > 0 && !hasFiltersOrSearch && (
        <section className="px-4 sm:px-6 py-10 sm:py-12 bg-gradient-to-b from-slate-50/80 to-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Featured Shops
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-semibold text-blue-600">
                  {featuredShops.length} verified
                </span>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6">
              {featuredShops.map((shop) => (
                <FeaturedShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trending (only on default view, no search) ──── */}
      {trendingProducts.length > 0 && !hasFiltersOrSearch && (
        <section className="px-4 sm:px-6 py-8 sm:py-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                📈 Trending This Week
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
        <section className="px-4 sm:px-6 py-8 sm:py-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                ✨ Just Listed
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
      <section className="px-4 sm:px-6 pt-8 pb-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Filter button (hidden on lg: where sidebar is visible) */}
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className={`lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all btn-press ${
                  activeFilterCount > 0
                    ? "bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-sm"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Results count */}
              <div className="flex items-center gap-1.5">
                {isPending ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                )}
                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-800">{totalProducts.toLocaleString()}</span>{" "}
                  {totalProducts === 1 ? "product" : "products"}
                  {currentFilters.search && (
                    <span className="text-slate-500">
                      {" "}for &ldquo;<span className="text-blue-600 font-medium">{currentFilters.search}</span>&rdquo;
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
              className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-blue-400 cursor-pointer shadow-sm"
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
                className="text-xs text-blue-600 hover:text-blue-500 font-medium px-2 py-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Product Grid with Desktop Sidebar ───────────── */}
      <section className="px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto flex gap-6">
          {/* Desktop filter sidebar */}
          <MarketplaceFilterSidebar
            categories={categories}
            currentFilters={currentFilters}
            onApply={(filters) => updateFilters(filters)}
          />

          {/* Main product area */}
          <div className="flex-1 min-w-0">
          {allProducts.length === 0 && !isPending ? (
            /* Empty State */
            <div className="flex flex-col items-center py-20 text-center">
              <IllustrationSearchNotFound className="w-44 h-44 mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">{t("noResults")}</h3>
              <p className="text-sm text-slate-500 max-w-sm mb-4">
                Try adjusting your filters, search for something else, or browse all products.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  router.push("/marketplace");
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
              >
                Browse All Products
              </button>
            </div>
          ) : (
            <>
              {/* Loading overlay with skeleton shimmer */}
              <div className={`transition-opacity duration-300 ${isPending ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {allProducts.map((product, idx) => (
                    <MarketplaceProductCard key={`${product.id}-${idx}`} product={product} />
                  ))}
                </div>
              </div>

              {/* Searching indicator */}
              {isPending && allProducts.length === 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                      <div className="aspect-square bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                      <div className="p-3 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 80 + 40}ms` }} />
                        <div className="h-3 w-1/2 rounded bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 80 + 80}ms` }} />
                        <div className="h-5 w-1/3 rounded bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 80 + 120}ms` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Infinite scroll sentinel + loading indicator */}
              {hasMore && (
                <div ref={sentinelRef} className="flex items-center justify-center py-10">
                  {isLoadingMore && (
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      Loading more products…
                    </div>
                  )}
                </div>
              )}

              {/* End of results */}
              {!hasMore && allProducts.length > 0 && totalProducts > currentFilters.pageSize && (
                <p className="text-center text-sm text-slate-400 py-8">
                  You&apos;ve seen all {totalProducts.toLocaleString()} products ✓
                </p>
              )}
            </>
          )}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-slate-200 mt-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <TradeFeedLogo size="sm" variant="dark" />
            </Link>
            <div className="flex items-center gap-6 text-xs text-slate-500">
              <Link href="/privacy" className="hover:text-slate-800 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-800 transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-slate-800 transition-colors">Contact</Link>
              {isSignedIn ? (
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
              ) : (
                <Link href="/sign-up" className="hover:text-blue-600 transition-colors">Start Selling</Link>
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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-600">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="w-3.5 h-3.5 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
      >
        <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
