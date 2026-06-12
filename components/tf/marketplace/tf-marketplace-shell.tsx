"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Search, SearchX, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { TfButton } from "@/components/tf/button";
import { TfEmptyState } from "@/components/tf/empty-state";
import { TfProductCard } from "@/components/tf/product-card";
import { TfProductCardSkeleton } from "@/components/tf/skeleton";
import { TfFonts } from "@/components/tf/tf-fonts";
import { TfReveal } from "@/components/tf/motion/tf-reveal";
import { buildMarketplaceSearchParams } from "@/lib/marketplace/search-params";
import { loadMoreProducts, trackMarketplaceClickAction, trackPromotedClickAction } from "@/app/actions/marketplace";
import type { CategoryWithCount, MarketplaceProduct, MarketplaceSortBy } from "@/lib/db/marketplace";
import { TfFilterSheet, type TfFilterState } from "./tf-filter-sheet";

// ============================================================
// TfMarketplaceShell — trust-first discovery (UI_REDESIGN).
// Trust is visible at the card level: verified tick, rating,
// location on every card. Filters live in a bottom sheet.
// ============================================================

interface TfMarketplaceShellProps {
  products: MarketplaceProduct[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  categories: CategoryWithCount[];
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

function toCard(p: MarketplaceProduct) {
  return {
    href: `/catalog/${p.shop.slug}/products/${p.slug ?? p.id}`,
    title: p.name,
    price: p.minPriceCents / 100,
    imageUrl: p.imageUrl,
    sellerName: p.shop.name,
    sellerVerified: p.shop.isVerified,
    rating: p.avgRating ?? undefined,
    ratingCount: p.reviewCount > 0 ? p.reviewCount : undefined,
    location: p.shop.city ?? p.shop.province ?? undefined,
    promoted: p.promotion != null,
  };
}

export function TfMarketplaceShell({
  products,
  totalProducts,
  totalPages,
  currentPage,
  categories,
  currentFilters,
}: TfMarketplaceShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(currentFilters.search ?? "");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [allProducts, setAllProducts] = React.useState(products);
  const [nextPage, setNextPage] = React.useState(currentPage + 1);
  const [hasMore, setHasMore] = React.useState(currentPage < totalPages);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setAllProducts(products);
    setNextPage(currentPage + 1);
    setHasMore(currentPage < totalPages);
  }, [products, currentPage, totalPages]);

  const navigate = React.useCallback(
    (updates: Record<string, string | undefined>) => {
      const qs = buildMarketplaceSearchParams(searchParams.toString(), updates);
      router.push(qs ? `/marketplace?${qs}` : "/marketplace", { scroll: false });
    },
    [router, searchParams],
  );

  // Debounced search → URL
  const onSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate({ search: value || undefined }), 400);
  };

  // Infinite scroll
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !loadingMore && hasMore) {
        setLoadingMore(true);
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
            if (result.products.length > 0) setAllProducts((prev) => [...prev, ...result.products]);
            setHasMore(result.hasMore);
            setNextPage(result.nextPage);
          })
          .finally(() => setLoadingMore(false));
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, nextPage, currentFilters]);

  const onCardClick = (p: MarketplaceProduct) => {
    trackMarketplaceClickAction(p.shop.id, p.id);
    if (p.promotion) trackPromotedClickAction(p.promotion.promotedListingId, p.shop.id, p.id);
  };

  const topCategories = categories.filter((c) => !c.parentId && c.productCount > 0);
  const activeFilterCount = [
    currentFilters.category,
    currentFilters.province,
    currentFilters.minPrice,
    currentFilters.maxPrice,
    currentFilters.verifiedOnly ? "v" : undefined,
    currentFilters.sortBy !== "quality" ? "s" : undefined,
  ].filter(Boolean).length;

  const applySheet = (state: TfFilterState) => {
    setSheetOpen(false);
    navigate({
      category: state.category,
      sort: state.sort,
      province: state.province,
      minPrice: state.minPrice,
      maxPrice: state.maxPrice,
      verified: state.verified,
    });
  };

  return (
    <div className="min-h-screen bg-tf-surface pb-16 text-tf-ink">
      <TfFonts />

      {/* ── Header: logo + search ──────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-tf-stone-200 bg-tf-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link href="/" aria-label="TradeFeed home" className="hidden shrink-0 sm:block">
            <TradeFeedLogo size="sm" />
          </Link>
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-tf-stone-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products, brands, shops…"
              aria-label="Search the marketplace"
              className="min-h-11 w-full rounded-full border border-tf-stone-300 bg-tf-raised pl-10 pr-4 text-[15px] text-tf-ink placeholder:text-tf-stone-400 outline-none focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25"
            />
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="relative flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-tf-stone-300 bg-tf-raised px-4 text-sm font-medium text-tf-ink outline-none hover:border-tf-stone-400 focus-visible:ring-2 focus-visible:ring-tf-primary"
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-tf-primary px-1 text-[11px] font-semibold tabular-nums text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          {/* Sign in + Sell — desktop only */}
          <div className="hidden items-center gap-1.5 md:flex">
            <Link
              href="/sign-in"
              className="px-3 py-2 text-sm text-tf-stone-600 transition-colors hover:text-tf-ink"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-tf-deep px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-tf-deep/90"
            >
              Sell free
            </Link>
          </div>
        </div>

        {/* Category pills — horizontal scroll on mobile */}
        {topCategories.length > 0 && (
          <nav aria-label="Categories" className="mx-auto max-w-6xl overflow-x-auto px-4 pb-2.5 sm:px-6">
            <div className="flex w-max gap-2">
              <button
                type="button"
                onClick={() => navigate({ category: undefined })}
                aria-pressed={!currentFilters.category}
                className={cn(
                  "min-h-9 whitespace-nowrap rounded-full border px-4 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-tf-primary",
                  !currentFilters.category
                    ? "border-tf-ink bg-tf-ink font-semibold text-white"
                    : "border-tf-stone-200 bg-tf-raised text-tf-stone-600 hover:border-tf-stone-400 hover:text-tf-ink",
                )}
              >
                All
              </button>
              {topCategories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() =>
                    navigate({ category: currentFilters.category === c.slug ? undefined : c.slug })
                  }
                  aria-pressed={currentFilters.category === c.slug}
                  className={cn(
                    "min-h-9 whitespace-nowrap rounded-full border px-4 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-tf-primary",
                    currentFilters.category === c.slug
                      ? "border-tf-ink bg-tf-ink font-semibold text-white"
                      : "border-tf-stone-200 bg-tf-raised text-tf-stone-600 hover:border-tf-stone-400 hover:text-tf-ink",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        {/* ── Toolbar: count + verified toggle ───────────── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm tabular-nums text-tf-stone-500" aria-live="polite">
            <span className="font-semibold text-tf-ink">{totalProducts.toLocaleString("en-ZA")}</span>
            {" "}product{totalProducts === 1 ? "" : "s"}
            {currentFilters.search ? ` for "${currentFilters.search}"` : ""}
          </p>
          <button
            type="button"
            onClick={() => navigate({ verified: currentFilters.verifiedOnly ? undefined : "true" })}
            aria-pressed={currentFilters.verifiedOnly}
            className={cn(
              "flex min-h-9 items-center gap-1.5 rounded-full border px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-tf-primary",
              currentFilters.verifiedOnly
                ? "border-tf-ink bg-tf-ink font-semibold text-white"
                : "border-tf-stone-200 bg-tf-raised text-tf-stone-600 transition-colors hover:border-tf-stone-400 hover:text-tf-ink",
            )}
          >
            <BadgeCheck aria-hidden="true" className="size-4 text-tf-verified" />
            Verified sellers
          </button>
        </div>

        {/* ── Grid / empty state ─────────────────────────── */}
        {allProducts.length === 0 ? (
          <TfEmptyState
            icon={<SearchX />}
            title="No products match"
            description={
              currentFilters.search
                ? `Nothing found for "${currentFilters.search}". Try a shorter search, or clear your filters.`
                : "Nothing matches these filters yet. Clear them to see everything on the marketplace."
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <TfButton variant="secondary" onClick={() => { setSearch(""); router.push("/marketplace"); }}>
                  Clear everything
                </TfButton>
                {currentFilters.verifiedOnly && (
                  <TfButton variant="ghost" onClick={() => navigate({ verified: undefined })}>
                    Include unverified sellers
                  </TfButton>
                )}
              </div>
            }
            className="my-10"
          />
        ) : (
          <TfReveal as="ul" stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {allProducts.map((p) => (
              <li key={`${p.id}${p.promotion ? "-promo" : ""}`} onClick={() => onCardClick(p)}>
                <TfProductCard {...toCard(p)} className="h-full" />
              </li>
            ))}
            {loadingMore &&
              Array.from({ length: 4 }).map((_, i) => (
                <li key={`skeleton-${i}`}>
                  <TfProductCardSkeleton />
                </li>
              ))}
          </TfReveal>
        )}

        {/* Infinite-scroll sentinel */}
        {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-12" />}
        {!hasMore && allProducts.length > 0 && (
          <p className="py-10 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-tf-stone-400">
            You&apos;ve seen everything that matches
          </p>
        )}
      </main>

      <TfFilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={categories}
        initial={{
          category: currentFilters.category,
          sort: currentFilters.sortBy === "quality" ? undefined : currentFilters.sortBy,
          province: currentFilters.province,
          minPrice: currentFilters.minPrice?.toString(),
          maxPrice: currentFilters.maxPrice?.toString(),
          verified: currentFilters.verifiedOnly ? "true" : undefined,
        }}
        onApply={applySheet}
      />
    </div>
  );
}
