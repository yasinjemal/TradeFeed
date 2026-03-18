"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { BackToTop } from "@/components/ui/back-to-top";
import { EmptyState } from "@/components/ui/empty-state";
import { IllustrationSearchNotFound } from "@/components/ui/illustrations";
import { TrustBadge } from "@/components/ui/trust-badge";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { CategoryWithCount, FeaturedShop, MarketplaceProduct, MarketplaceSortBy } from "@/lib/db/marketplace";
import { buildMarketplaceSearchParams } from "@/lib/marketplace/search-params";
import { loadMoreProducts, trackMarketplaceViewAction, trackPromotedImpressionsAction } from "@/app/actions/marketplace";
import { CategoryBar } from "./category-bar";
import { FeaturedCarousel } from "./featured-carousel";
import { FeaturedShopCard } from "./featured-shop-card";
import { MarketplaceActivity } from "./marketplace-activity";
import { MarketplaceFilterSheet } from "./marketplace-filter-sheet";
import { MarketplaceFilterSidebar } from "./marketplace-filter-sidebar";
import { MarketplaceProductCard, MarketplaceProductCardSkeleton } from "./marketplace-product-card";
import { MarketplaceSearchBar } from "./search-bar";

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

function flattenCategoryNames(categories: CategoryWithCount[]) {
  return categories.flatMap((category) => {
    if (category.children.length > 0) {
      return category.children.map((child) => ({ slug: child.slug, label: child.name }));
    }

    return [{ slug: category.slug, label: category.name }];
  });
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
  const [search, setSearch] = useState(currentFilters.search ?? "");
  const [filterOpen, setFilterOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [suggestions, setSuggestions] = useState<{
    products: { name: string; slug: string }[];
    categories: { name: string; slug: string }[];
  }>({ products: [], categories: [] });
  const [allProducts, setAllProducts] = useState(products);
  const [nextPage, setNextPage] = useState(currentPage + 1);
  const [hasMore, setHasMore] = useState(currentPage < totalPages);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAllProducts(products);
    setNextPage(currentPage + 1);
    setHasMore(currentPage < totalPages);
  }, [products, currentPage, totalPages]);

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
          })
            .then((result) => {
              if (result.products.length > 0) {
                setAllProducts((prev) => [...prev, ...result.products]);
              }
              setHasMore(result.hasMore);
              setNextPage(result.nextPage);
              setIsLoadingMore(false);
            })
            .catch(() => {
              setIsLoadingMore(false);
            });
        }
      },
      { rootMargin: "600px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, nextPage, currentFilters]);

  useEffect(() => {
    setSearch(currentFilters.search ?? "");
  }, [currentFilters.search]);

  useEffect(() => {
    trackMarketplaceViewAction();
  }, []);

  useEffect(() => {
    const promotedIds = promotedProducts
      .filter((product) => product.promotion)
      .map((product) => product.promotion!.promotedListingId);

    if (promotedIds.length > 0) {
      trackPromotedImpressionsAction(promotedIds);
    }
  }, [promotedProducts]);

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      startTransition(() => {
        const nextParams = buildMarketplaceSearchParams(searchParams.toString(), updates);
        router.push(`/marketplace?${nextParams}`, { scroll: false });
      });
    },
    [router, searchParams, startTransition]
  );

  const clearSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch("");
    setSuggestions({ products: [], categories: [] });
    updateFilters({ search: undefined, page: undefined });
  }, [updateFilters]);

  const submitSearch = useCallback(
    (nextValue: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const trimmed = nextValue.trim();

      if (!trimmed) {
        clearSearch();
        return;
      }

      setSearch(trimmed);
      updateFilters({ search: trimmed, page: undefined });
    },
    [clearSearch, updateFilters]
  );

  const handleSearchInput = useCallback(
    (value: string) => {
      setSearch(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const trimmed = value.trim();
        if (trimmed.length >= 2 || trimmed.length === 0) {
          updateFilters({ search: trimmed || undefined, page: undefined });
        }
      }, 400);

      if (autocompleteRef.current) clearTimeout(autocompleteRef.current);
      const trimmedForAutocomplete = value.trim();
      if (trimmedForAutocomplete.length < 2) {
        setSuggestions({ products: [], categories: [] });
        return;
      }

      autocompleteRef.current = setTimeout(async () => {
        try {
          const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(trimmedForAutocomplete)}`);
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data);
          }
        } catch {
          setSuggestions({ products: [], categories: [] });
        }
      }, 200);
    },
    [updateFilters]
  );

  const selectSuggestion = useCallback(
    (name: string) => {
      setSearch(name);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      updateFilters({ search: name, page: undefined });
    },
    [updateFilters]
  );

  const selectCategorySuggestion = useCallback(
    (slug: string) => {
      setSearch("");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      updateFilters({ category: slug, search: undefined, page: undefined });
    },
    [updateFilters]
  );

  const activeFilterCount = [
    currentFilters.category,
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

  const categoryLabels = useMemo(() => flattenCategoryNames(categories), [categories]);
  const selectedCategoryLabel = categoryLabels.find((category) => category.slug === currentFilters.category)?.label;

  const suggestedSearches = useMemo(
    () =>
      Array.from(
        new Set([
          ...trendingProducts.slice(0, 4).map((product) => product.name),
          ...categories.slice(0, 4).map((category) => category.name),
        ])
      ).slice(0, 6),
    [categories, trendingProducts]
  );

  const activeFilters = [
    currentFilters.category
      ? {
          label: selectedCategoryLabel ?? currentFilters.category,
          onRemove: () => updateFilters({ category: undefined, page: undefined }),
        }
      : null,
    currentFilters.search
      ? {
          label: `Search: ${currentFilters.search}`,
          onRemove: clearSearch,
        }
      : null,
    currentFilters.province
      ? {
          label: currentFilters.province,
          onRemove: () => updateFilters({ province: undefined, page: undefined }),
        }
      : null,
    currentFilters.minPrice || currentFilters.maxPrice
      ? {
          label: `${currentFilters.minPrice ? `R${Math.round(currentFilters.minPrice / 100)}` : "Any"} - ${currentFilters.maxPrice ? `R${Math.round(currentFilters.maxPrice / 100)}` : "Any"}`,
          onRemove: () => updateFilters({ minPrice: undefined, maxPrice: undefined, page: undefined }),
        }
      : null,
    currentFilters.verifiedOnly
      ? {
          label: "Verified only",
          onRemove: () => updateFilters({ verified: undefined, page: undefined }),
        }
      : null,
  ].filter(Boolean) as { label: string; onRemove: () => void }[];

  const headerStats = [
    { label: "Products live", value: totalProducts.toLocaleString(), tone: "text-slate-900" },
    { label: "Featured shops", value: featuredShops.length.toLocaleString(), tone: "text-emerald-700" },
    { label: "Categories", value: categories.length.toLocaleString(), tone: "text-slate-900" },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <TradeFeedLogo variant="dark" />
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 lg:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Trusted South African marketplace
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 sm:inline-flex"
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
                  className="hidden px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 sm:inline-flex"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500"
                >
                  Start Selling
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="px-4 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-7xl"
        >
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,1)_0%,_rgba(248,250,252,1)_100%)] p-6 shadow-xl shadow-slate-200/70 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600">TradeFeed Marketplace</p>
                <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  Discover verified products from sellers buyers can trust.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Compare products from real South African businesses, see trust signals up front, and order directly via WhatsApp with clear seller details and promotion labels.
                </p>

                <div className="mt-5 flex flex-wrap gap-2.5">
                  <TrustBadge variant="verified" label="Seller phone checks" />
                  <TrustBadge variant="promoted" label="Promoted listings labelled" />
                  <TrustBadge variant="response-time" label="Fast-moving marketplace" />
                </div>

                <div className="mt-6 max-w-3xl">
                  <MarketplaceSearchBar
                    value={search}
                    placeholder={t("searchPlaceholder")}
                    suggestions={suggestions}
                    trendingTerms={suggestedSearches}
                    onValueChange={handleSearchInput}
                    onSubmit={submitSearch}
                    onClear={clearSearch}
                    onSelectProductSuggestion={selectSuggestion}
                    onSelectCategorySuggestion={selectCategorySuggestion}
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-200/60">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Buyer protection</p>
                  <p className="mt-2 text-sm text-slate-700">
                    Every product page surfaces seller identity, location, and verification so buyers can make decisions with less guesswork.
                  </p>
                </div>

                <div className="mt-4 flex justify-start">
                  <MarketplaceActivity totalProducts={totalProducts} totalShops={Math.max(featuredShops.length, 1)} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {headerStats.map((stat) => (
                  <div key={stat.label} className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-200/60">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
                    <p className={`mt-3 text-3xl font-extrabold tracking-tight ${stat.tone}`}>{stat.value}</p>
                  </div>
                ))}
                <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm shadow-emerald-100/50 sm:col-span-3 lg:col-span-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">How trust shows up</p>
                  <ul className="mt-3 space-y-2 text-sm text-emerald-900">
                    <li>Verified sellers are marked on cards and product pages.</li>
                    <li>Promoted products are clearly distinguished from organic listings.</li>
                    <li>Ratings, reviews, and activity indicators stay visible as you browse.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <CategoryBar
        categories={categories}
        selectedCategory={currentFilters.category}
        onSelectCategory={(slug) => updateFilters({ category: slug || undefined, page: undefined })}
      />

      {promotedProducts.length > 0 && !hasFiltersOrSearch ? (
        <section className="px-4 pb-4 pt-8 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Promoted picks</h2>
                <p className="mt-1 text-sm text-slate-500">Sponsored products are clearly labelled so buyers always know what is paid placement.</p>
              </div>
              <TrustBadge variant="promoted" label="Clear promotion label" />
            </div>
            <FeaturedCarousel products={promotedProducts} />
          </div>
        </section>
      ) : null}

      {featuredShops.length > 0 && !hasFiltersOrSearch ? (
        <section className="bg-gradient-to-b from-slate-50/80 to-white px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Featured shops</h2>
                <p className="mt-1 text-sm text-slate-500">Real storefronts with reputation signals, product depth, and public profiles.</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {featuredShops.length} featured
              </span>
            </div>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:-mx-6 sm:px-6">
              {featuredShops.map((shop) => (
                <FeaturedShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {trendingProducts.length > 0 && !hasFiltersOrSearch ? (
        <section className="px-4 py-8 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Trending this week</h2>
                <p className="mt-1 text-sm text-slate-500">High-intent listings buyers are actively viewing and ordering right now.</p>
              </div>
              <TrustBadge variant="response-time" label="Live marketplace activity" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {trendingProducts.slice(0, 6).map((product) => (
                <MarketplaceProductCard key={`trending-${product.id}`} product={product} compact />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {newArrivals.length > 0 && !hasFiltersOrSearch ? (
        <section className="px-4 py-8 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Just listed</h2>
                <p className="mt-1 text-sm text-slate-500">Fresh inventory from sellers who are actively updating their catalogues.</p>
              </div>
              <TrustBadge variant="new-seller" label="Fresh catalog activity" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {newArrivals.slice(0, 6).map((product) => (
                <MarketplaceProductCard key={`new-${product.id}`} product={product} compact />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-4 pb-3 pt-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFilterOpen(true)}
                  className={`btn-press inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all lg:hidden ${
                    activeFilterCount > 0
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                  Filters
                  {activeFilterCount > 0 ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>

                <div className="flex items-center gap-1.5">
                  {isPending ? (
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  )}
                  <p className="text-sm text-slate-500">
                    <span className="font-semibold text-slate-800">{totalProducts.toLocaleString()}</span>{" "}
                    {totalProducts === 1 ? "product" : "products"}
                    {currentFilters.search ? (
                      <span className="text-slate-500">
                        {" "}for &ldquo;<span className="font-medium text-emerald-700">{currentFilters.search}</span>&rdquo;
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <select
                value={currentFilters.sortBy}
                onChange={(event) => updateFilters({ sort: event.target.value, page: undefined })}
                aria-label="Sort products"
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm focus:border-emerald-400 focus:outline-none"
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

            {hasFiltersOrSearch ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <FilterTag key={filter.label} label={filter.label} onRemove={filter.onRemove} />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    router.push("/marketplace");
                  }}
                  className="px-2 py-1 text-xs font-medium text-emerald-700 transition-colors hover:text-emerald-600"
                >
                  Clear all
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl gap-6">
          <MarketplaceFilterSidebar
            categories={categories}
            currentFilters={currentFilters}
            onApply={(filters) => updateFilters(filters)}
          />

          <div className="min-w-0 flex-1">
            {allProducts.length === 0 && !isPending ? (
              <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50/60 px-6 py-8">
                <EmptyState
                  illustration={<IllustrationSearchNotFound className="h-44 w-44" />}
                  heading={t("noResults")}
                  description="Try a broader search, remove one of your filters, or jump into a trending category below."
                  action={{
                    label: "Browse all products",
                    onClick: () => {
                      setSearch("");
                      router.push("/marketplace");
                    },
                  }}
                  footer={
                    suggestedSearches.length > 0 ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Suggested searches</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {suggestedSearches.map((term) => (
                            <button
                              key={term}
                              type="button"
                              onClick={() => submitSearch(term)}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null
                  }
                />
              </div>
            ) : (
              <>
                {isPending && allProducts.length === 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <MarketplaceProductCardSkeleton key={index} />
                    ))}
                  </div>
                ) : (
                  <div className={`transition-opacity duration-300 ${isPending ? "opacity-50" : "opacity-100"}`}>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                      {allProducts.map((product, index) => (
                        <MarketplaceProductCard key={`${product.id}-${index}`} product={product} />
                      ))}
                    </div>
                  </div>
                )}

                {hasMore ? (
                  <div ref={sentinelRef} className="py-8">
                    {isLoadingMore ? (
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <MarketplaceProductCardSkeleton key={index} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {!hasMore && allProducts.length > 0 && totalProducts > currentFilters.pageSize ? (
                  <p className="py-8 text-center text-sm text-slate-400">
                    You&apos;ve seen all {totalProducts.toLocaleString()} products.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="mt-12 border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link href="/" className="flex items-center gap-2">
              <TradeFeedLogo size="sm" variant="dark" />
            </Link>
            <div className="flex items-center gap-6 text-xs text-slate-500">
              <Link href="/privacy" className="transition-colors hover:text-slate-800">Privacy</Link>
              <Link href="/terms" className="transition-colors hover:text-slate-800">Terms</Link>
              <Link href="/contact" className="transition-colors hover:text-slate-800">Contact</Link>
            </div>
          </div>
        </div>
      </footer>

      <MarketplaceFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={categories}
        currentFilters={currentFilters}
        onApply={(filters) => updateFilters(filters)}
      />

      <BackToTop />
    </main>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
    >
      <span>{label}</span>
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}// ============================================================
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
  const tNav = useTranslations("nav"); // This line is retained for context

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
