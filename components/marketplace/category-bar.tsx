// ============================================================
// Category Bar — Icon-based horizontal scroll cards
// ============================================================
// Horizontally scrollable category cards with emoji icons,
// names, and product counts. Amazon/Takealot-inspired.
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

  const nonEmptyCategories = categories.filter((c) => c.productCount > 0);
  if (nonEmptyCategories.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 pb-2">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6">
          {/* All Products card */}
          <button
            type="button"
            onClick={() => onSelectCategory(undefined)}
            className={`relative flex flex-col items-center justify-center gap-2 min-w-[90px] sm:min-w-[100px] px-4 py-4 rounded-2xl shrink-0 transition-all duration-200 active:scale-[0.96] ${
              !selectedCategory
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:shadow-md shadow-sm"
            }`}
          >
            <span className="text-2xl leading-none">🛍️</span>
            <span className="text-xs font-semibold leading-tight text-center whitespace-nowrap">
              All
            </span>
          </button>

          {/* Category cards */}
          {nonEmptyCategories.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  onSelectCategory(isActive ? undefined : cat.slug)
                }
                className={`relative flex flex-col items-center justify-center gap-2 min-w-[90px] sm:min-w-[100px] px-4 py-4 rounded-2xl shrink-0 transition-all duration-200 active:scale-[0.96] ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:shadow-md shadow-sm"
                }`}
              >
                {cat.icon && (
                  <span className="text-2xl leading-none">{cat.icon}</span>
                )}
                <span className="text-xs font-semibold leading-tight text-center whitespace-nowrap">
                  {cat.name}
                </span>
                {cat.productCount > 0 && (
                  <span
                    className={`text-[10px] font-medium leading-none ${
                      isActive ? "text-blue-200" : "text-slate-400"
                    }`}
                  >
                    {cat.productCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
