// ============================================================
// Category Bar — Horizontal scrollable category pills
// ============================================================

"use client";

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
  if (categories.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 pb-2">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* All pill */}
          <button
            type="button"
            onClick={() => onSelectCategory(undefined)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              !selectedCategory
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "bg-stone-900 border border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300"
            }`}
          >
            All Products
          </button>

          {/* Category pills */}
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                onSelectCategory(selectedCategory === cat.slug ? undefined : cat.slug)
              }
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === cat.slug
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-stone-900 border border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300"
              }`}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
              {cat.productCount > 0 && (
                <span className={`text-[10px] ${selectedCategory === cat.slug ? "text-emerald-200" : "text-stone-600"}`}>
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
