"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const RECENT_SEARCHES_KEY = "tradefeed-marketplace-recent-searches";

interface SearchSuggestions {
  products: { name: string; slug: string }[];
  categories: { name: string; slug: string }[];
}

interface MarketplaceSearchBarProps {
  value: string;
  placeholder: string;
  suggestions: SearchSuggestions;
  trendingTerms?: string[];
  size?: "compact" | "prominent";
  className?: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onClear: () => void;
  onSelectProductSuggestion: (name: string) => void;
  onSelectCategorySuggestion: (slug: string) => void;
}

export function MarketplaceSearchBar({
  value,
  placeholder,
  suggestions,
  trendingTerms = [],
  size = "prominent",
  className,
  onValueChange,
  onSubmit,
  onClear,
  onSelectProductSuggestion,
  onSelectCategorySuggestion,
}: MarketplaceSearchBarProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((item): item is string => typeof item === "string"));
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedTrendingTerms = useMemo(
    () =>
      Array.from(
        new Set(
          trendingTerms
            .map((term) => term.trim())
            .filter(Boolean)
            .slice(0, 6)
        )
      ),
    [trendingTerms]
  );

  const hasDropdownContent =
    recentSearches.length > 0 ||
    normalizedTrendingTerms.length > 0 ||
    suggestions.categories.length > 0 ||
    suggestions.products.length > 0;

  function saveRecentSearch(term: string) {
    const next = [term, ...recentSearches.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(0, 5);
    setRecentSearches(next);
    try {
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors.
    }
  }

  function submitSearch(nextValue: string) {
    const trimmed = nextValue.trim();
    if (!trimmed) {
      onClear();
      setIsOpen(false);
      return;
    }
    saveRecentSearch(trimmed);
    onSubmit(trimmed);
    setIsOpen(false);
  }

  function removeRecentSearch(term: string) {
    const next = recentSearches.filter((item) => item !== term);
    setRecentSearches(next);
    try {
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors.
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch(value);
        }}
        className="relative"
      >
        <svg
          className={cn(
            "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400",
            size === "prominent" ? "h-5 w-5" : "h-4 w-4"
          )}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>

        <input
          type="search"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full border border-slate-200 bg-white text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10",
            size === "prominent"
              ? "rounded-2xl py-4 pl-12 pr-28 text-base shadow-lg shadow-slate-200/50"
              : "rounded-xl py-2.5 pl-10 pr-24 text-sm shadow-sm",
            className
          )}
        />

        {value.trim() ? (
          <button
            type="button"
            onClick={() => {
              onClear();
              setIsOpen(false);
            }}
            aria-label="Clear search"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200",
              size === "prominent" ? "right-16 h-8 w-8" : "right-12 h-7 w-7"
            )}
          >
            <svg className="mx-auto h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}

        <button
          type="submit"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 rounded-xl bg-emerald-600 font-semibold text-white transition-colors hover:bg-emerald-500",
            size === "prominent" ? "right-3 px-4 py-2 text-sm" : "right-2 px-3 py-1.5 text-xs"
          )}
        >
          Search
        </button>
      </form>

      {isOpen && hasDropdownContent ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
          {recentSearches.length > 0 ? (
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Recent searches</p>
                <button
                  type="button"
                  onClick={() => {
                    setRecentSearches([]);
                    try {
                      window.localStorage.removeItem(RECENT_SEARCHES_KEY);
                    } catch {
                      // Ignore storage errors.
                    }
                  }}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <span key={term} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        submitSearch(term);
                      }}
                    >
                      {term}
                    </button>
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        removeRecentSearch(term);
                      }}
                      aria-label={`Remove ${term}`}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {normalizedTrendingTerms.length > 0 ? (
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Trending now</p>
              <div className="flex flex-wrap gap-2">
                {normalizedTrendingTerms.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      submitSearch(term);
                    }}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {suggestions.categories.length > 0 ? (
            <div className="px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Matching categories</p>
              <div className="space-y-1">
                {suggestions.categories.map((category) => (
                  <button
                    key={category.slug}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onSelectCategorySuggestion(category.slug);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <span>{category.name}</span>
                    <span className="text-xs text-slate-400">Category</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {suggestions.products.length > 0 ? (
            <div className="border-t border-slate-100 px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Product suggestions</p>
              <div className="space-y-1">
                {suggestions.products.map((product) => (
                  <button
                    key={product.slug}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      saveRecentSearch(product.name);
                      onSelectProductSuggestion(product.name);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <span>{product.name}</span>
                    <span className="text-xs text-slate-400">Product</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}