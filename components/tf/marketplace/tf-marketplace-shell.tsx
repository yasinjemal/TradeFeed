"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Search, SearchX, SlidersHorizontal, ArrowRight } from "lucide-react";

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
// TfMarketplaceShell — professional marketplace header:
// Announcement strip → Search-dominant nav → Category bar →
// Toolbar. Trust at every level: verified badge, SA context.
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

  const onSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate({ search: value || undefined }), 400);
  };

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

  const pillBase =
    "min-h-8 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-tf-primary";
  const pillActive = "border-tf-ink bg-tf-ink text-white shadow-sm";
  const pillIdle =
    "border-tf-stone-200 bg-white text-tf-stone-600 hover:border-tf-stone-400 hover:text-tf-ink";

  return (
    <div className="min-h-screen bg-tf-surface pb-20 text-tf-ink">
      <TfFonts />

      {/* ══════════════════════════════════════════════════
          HEADER — 3 rows: announcement + nav + categories
      ══════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30">

        {/* ── Row 1: Announcement strip ─────────────────── */}
        <div style={{ backgroundColor: "#071a0f" }}>
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
            {/* Left: SA context + trust signals */}
            <div className="flex items-center gap-5 overflow-hidden">
              <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-emerald-400/90">
                <svg viewBox="0 0 20 14" width="18" height="13" aria-hidden="true" className="shrink-0">
                  {/* SA flag simplified */}
                  <rect width="20" height="14" fill="#007A4D" />
                  <polygon points="0,0 7,7 0,14" fill="#FFB612" />
                  <polygon points="0,0 5,7 0,14" fill="#007A4D" />
                  <polygon points="1,0 6,7 1,14" fill="white" />
                  <rect y="5" width="20" height="4" fill="white" />
                  <rect y="5.7" width="20" height="2.6" fill="#DE3831" />
                </svg>
                South Africa
              </span>
              <span className="hidden items-center gap-1.5 text-[11px] text-emerald-400/65 sm:flex">
                <BadgeCheck aria-hidden="true" className="size-3 shrink-0 text-emerald-400/80" />
                Verified sellers
              </span>
              <span className="hidden text-[11px] text-emerald-400/50 md:block">
                No platform fees
              </span>
              <span className="hidden text-[11px] text-emerald-400/50 lg:block">
                Orders direct via WhatsApp
              </span>
            </div>
            {/* Right: Sign in / Sell — shown here on small screens */}
            <div className="flex shrink-0 items-center gap-3 text-[11px]">
              <Link
                href="/sign-in"
                className="hidden text-emerald-400/70 transition-colors hover:text-emerald-300 sm:block"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/30"
              >
                Sell free
                <ArrowRight aria-hidden="true" className="size-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Row 2: Main nav — search dominant ─────────── */}
        <div className="border-b border-tf-stone-200 bg-tf-surface/98 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">

            {/* Logo */}
            <Link href="/" aria-label="TradeFeed home" className="hidden shrink-0 items-center gap-2 sm:flex">
              <TradeFeedLogo size="sm" />
              <span className="font-tf-display text-[13px] font-semibold text-tf-ink">
                Marketplace
              </span>
            </Link>

            {/* Search — the dominant center-stage element */}
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-tf-stone-400"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products, sellers, brands…"
                aria-label="Search the marketplace"
                className="min-h-12 w-full rounded-xl border border-tf-stone-300 bg-tf-raised pl-11 pr-4 text-[15px] text-tf-ink shadow-sm placeholder:text-tf-stone-400 outline-none transition-shadow focus-visible:border-tf-primary focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-tf-primary/20"
              />
            </div>

            {/* Filters */}
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="relative flex min-h-[46px] shrink-0 items-center gap-1.5 rounded-xl border border-tf-stone-300 bg-tf-raised px-4 text-sm font-medium text-tf-ink shadow-sm outline-none transition-all hover:border-tf-stone-400 hover:shadow-md focus-visible:ring-2 focus-visible:ring-tf-primary"
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-tf-primary px-1 text-[10px] font-bold tabular-nums text-white shadow-sm">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sign in + Sell — desktop row (hidden on sm, shown on md+) */}
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/sign-in"
                className="px-3 py-2 text-sm text-tf-stone-600 transition-colors hover:text-tf-ink"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-1.5 rounded-xl bg-tf-deep px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                Sell free
                <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Row 3: Category pills ──────────────────────── */}
        {topCategories.length > 0 && (
          <nav
            aria-label="Browse by category"
            className="border-b border-tf-stone-200 bg-tf-raised/70 backdrop-blur-sm"
          >
            <div className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6">
              <div className="flex w-max items-center gap-2 py-2.5">
                <button
                  type="button"
                  onClick={() => navigate({ category: undefined })}
                  aria-pressed={!currentFilters.category}
                  className={cn(pillBase, !currentFilters.category ? pillActive : pillIdle)}
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
                      pillBase,
                      currentFilters.category === c.slug ? pillActive : pillIdle,
                    )}
                  >
                    {c.name}
                    <span className="ml-1.5 tabular-nums opacity-50">{c.productCount}</span>
                  </button>
                ))}
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* ══════════════════════════════════════════════════
          MAIN — toolbar + grid
      ══════════════════════════════════════════════════ */}
      <main className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">

        {/* ── Toolbar ───────────────────────────────────── */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-tf-stone-500" aria-live="polite">
            <span className="font-semibold text-tf-ink">
              {totalProducts.toLocaleString("en-ZA")}
            </span>
            {" "}product{totalProducts === 1 ? "" : "s"}
            {currentFilters.search ? ` for "${currentFilters.search}"` : ""}
          </p>
          <button
            type="button"
            onClick={() => navigate({ verified: currentFilters.verifiedOnly ? undefined : "true" })}
            aria-pressed={currentFilters.verifiedOnly}
            className={cn(
              "flex min-h-9 items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-tf-primary",
              currentFilters.verifiedOnly
                ? "border-tf-ink bg-tf-ink text-white shadow-sm"
                : "border-tf-stone-200 bg-tf-raised text-tf-stone-600 hover:border-tf-stone-400 hover:text-tf-ink",
            )}
          >
            <BadgeCheck
              aria-hidden="true"
              className={cn(
                "size-4",
                currentFilters.verifiedOnly ? "text-emerald-400" : "text-tf-verified",
              )}
            />
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
                ? `Nothing found for "${currentFilters.search}". Try a shorter search or clear your filters.`
                : "Nothing matches these filters yet. Clear them to see everything on the marketplace."
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <TfButton
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    router.push("/marketplace");
                  }}
                >
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
          <TfReveal
            as="ul"
            stagger
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5"
          >
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
        {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-16" />}
        {!hasMore && allProducts.length > 0 && (
          <p className="py-10 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-tf-stone-400">
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
