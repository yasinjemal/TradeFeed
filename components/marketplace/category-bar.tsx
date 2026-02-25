// ============================================================
// Category Bar — Attractive mobile-first category selector
// ============================================================
// On mobile: 2-column grid with emoji icons, names, and counts
// in a visually rich card layout. On desktop: scrollable pills.
// "All Products" is always first. Selected = emerald highlight.
// ============================================================

"use client";

import { useState } from "react";
import type { CategoryWithCount } from "@/lib/db/marketplace";

interface CategoryBarProps {
  categories: CategoryWithCount[];
  selectedCategory?: string;
  onSelectCategory: (slug: string | undefined) => void;
}

export function CategoryBar({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryBarProps) {
  const [expanded, setExpanded] = useState(false);

  if (categories.length === 0) return null;

  // Show first 5 categories on mobile when collapsed, all when expanded
  const MOBILE_COLLAPSED_COUNT = 5;
  const hasMore = categories.length > MOBILE_COLLAPSED_COUNT;
  const visibleCategories = expanded
    ? categories
    : categories.slice(0, MOBILE_COLLAPSED_COUNT);

  return (
    <section className="px-4 sm:px-6 pb-2">
      <div className="max-w-7xl mx-auto">
        {/* ── Mobile: Grid Layout ────────────────────────── */}
        <div className="sm:hidden">
          <div className="grid grid-cols-3 gap-2">
            {/* All Products tile */}
            <button
              type="button"
              onClick={() => onSelectCategory(undefined)}
              className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl min-h-[76px] transition-all duration-200 active:scale-[0.96] ${
                !selectedCategory
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-1 ring-emerald-500/50"
                  : "bg-stone-900/80 text-stone-400 border border-stone-800/60 hover:border-stone-700"
              }`}
            >
              <span className="text-xl leading-none">🛍️</span>
              <span className="text-[11px] font-semibold leading-tight text-center">
                All
              </span>
              {!selectedCategory && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
            </button>

            {/* Category tiles */}
            {visibleCategories.map((cat) => {
              const isActive = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    onSelectCategory(isActive ? undefined : cat.slug)
                  }
                  className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl min-h-[76px] transition-all duration-200 active:scale-[0.96] ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-1 ring-emerald-500/50"
                      : "bg-stone-900/80 text-stone-400 border border-stone-800/60 hover:border-stone-700"
                  }`}
                >
                  {cat.icon && (
                    <span className="text-xl leading-none">{cat.icon}</span>
                  )}
                  <span className="text-[11px] font-semibold leading-tight text-center line-clamp-1">
                    {cat.name}
                  </span>
                  {cat.productCount > 0 && (
                    <span
                      className={`text-[9px] font-medium leading-none ${
                        isActive ? "text-emerald-200" : "text-stone-600"
                      }`}
                    >
                      {cat.productCount} items
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white/80" />
                  )}
                </button>
              );
            })}

            {/* Show more / less toggle */}
            {hasMore && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl min-h-[76px] bg-stone-900/50 border border-dashed border-stone-800/60 text-stone-500 hover:text-stone-300 hover:border-stone-700 transition-all duration-200 active:scale-[0.96]"
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${
                    expanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={expanded ? "M4.5 15.75l7.5-7.5 7.5 7.5" : "M19.5 8.25l-7.5 7.5-7.5-7.5"}
                  />
                </svg>
                <span className="text-[11px] font-semibold">
                  {expanded ? "Less" : `+${categories.length - MOBILE_COLLAPSED_COUNT}`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ── Desktop: Horizontal scroll pills ───────────── */}
        <div className="hidden sm:flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            type="button"
            onClick={() => onSelectCategory(undefined)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              !selectedCategory
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "bg-stone-900 border border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300"
            }`}
          >
            🛍️ All Products
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                onSelectCategory(
                  selectedCategory === cat.slug ? undefined : cat.slug
                )
              }
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === cat.slug
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-stone-900 border border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300"
              }`}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
              {cat.productCount > 0 && (
                <span
                  className={`text-[10px] ${
                    selectedCategory === cat.slug
                      ? "text-emerald-200"
                      : "text-stone-600"
                  }`}
                >
                  {cat.productCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
