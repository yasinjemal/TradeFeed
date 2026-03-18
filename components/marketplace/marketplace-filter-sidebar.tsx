// ============================================================
// Marketplace Filter Sidebar — Persistent desktop sidebar
// ============================================================
// Displayed on lg: screens alongside the product grid.
// Same filter controls as MarketplaceFilterSheet but inline.
// ============================================================

"use client";

import { useState, useEffect } from "react";
import type { CategoryWithCount, MarketplaceSortBy } from "@/lib/db/marketplace";

const SA_PROVINCES = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];

interface MarketplaceFilterSidebarProps {
  categories: CategoryWithCount[];
  currentFilters: {
    category?: string;
    province?: string;
    minPrice?: number;
    maxPrice?: number;
    verifiedOnly: boolean;
    sortBy: MarketplaceSortBy;
  };
  onApply: (filters: Record<string, string | undefined>) => void;
}

export function MarketplaceFilterSidebar({
  categories,
  currentFilters,
  onApply,
}: MarketplaceFilterSidebarProps) {
  const [province, setProvince] = useState(currentFilters.province ?? "");
  const [minPrice, setMinPrice] = useState(
    currentFilters.minPrice ? String(currentFilters.minPrice / 100) : ""
  );
  const [maxPrice, setMaxPrice] = useState(
    currentFilters.maxPrice ? String(currentFilters.maxPrice / 100) : ""
  );
  const [verifiedOnly, setVerifiedOnly] = useState(currentFilters.verifiedOnly);
  const [selectedCategory, setSelectedCategory] = useState(
    currentFilters.category ?? ""
  );

  useEffect(() => {
    setProvince(currentFilters.province ?? "");
    setMinPrice(currentFilters.minPrice ? String(currentFilters.minPrice / 100) : "");
    setMaxPrice(currentFilters.maxPrice ? String(currentFilters.maxPrice / 100) : "");
    setVerifiedOnly(currentFilters.verifiedOnly);
    setSelectedCategory(currentFilters.category ?? "");
  }, [currentFilters]);

  const handleApply = () => {
    onApply({
      province: province || undefined,
      minPrice: minPrice ? String(parseFloat(minPrice) * 100) : undefined,
      maxPrice: maxPrice ? String(parseFloat(maxPrice) * 100) : undefined,
      verified: verifiedOnly ? "true" : undefined,
      category: selectedCategory || undefined,
    });
  };

  const handleReset = () => {
    setProvince("");
    setMinPrice("");
    setMaxPrice("");
    setVerifiedOnly(false);
    setSelectedCategory("");
    onApply({
      province: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      verified: undefined,
      category: undefined,
    });
  };

  return (
    <aside className="w-[260px] flex-shrink-0 hidden lg:block">
      <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Filters</h3>
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] text-blue-600 hover:text-blue-500 font-medium"
          >
            Reset all
          </button>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              onApply({
                province: province || undefined,
                minPrice: minPrice ? String(parseFloat(minPrice) * 100) : undefined,
                maxPrice: maxPrice ? String(parseFloat(maxPrice) * 100) : undefined,
                verified: verifiedOnly ? "true" : undefined,
                category: e.target.value || undefined,
              });
            }}
            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <optgroup key={cat.id} label={`${cat.icon ?? ""} ${cat.name}`}>
                {cat.children.length > 0 ? (
                  cat.children.map((child) => (
                    <option key={child.id} value={child.slug}>
                      {child.name} ({child.productCount})
                    </option>
                  ))
                ) : (
                  <option value={cat.slug}>
                    {cat.name} ({cat.productCount})
                  </option>
                )}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Province */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Province
          </label>
          <select
            value={province}
            onChange={(e) => {
              setProvince(e.target.value);
              onApply({
                province: e.target.value || undefined,
                minPrice: minPrice ? String(parseFloat(minPrice) * 100) : undefined,
                maxPrice: maxPrice ? String(parseFloat(maxPrice) * 100) : undefined,
                verified: verifiedOnly ? "true" : undefined,
                category: selectedCategory || undefined,
              });
            }}
            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30"
          >
            <option value="">All Provinces</option>
            {SA_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Price Range (ZAR)
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">R</span>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                min="0"
                className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-6 pr-2 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30"
              />
            </div>
            <span className="text-slate-300 text-xs">&mdash;</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">R</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                min="0"
                className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-6 pr-2 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleApply}
            className="mt-2 w-full px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Apply Price
          </button>
        </div>

        {/* Verified Only */}
        <div>
          <button
            type="button"
            onClick={() => {
              const next = !verifiedOnly;
              setVerifiedOnly(next);
              onApply({
                province: province || undefined,
                minPrice: minPrice ? String(parseFloat(minPrice) * 100) : undefined,
                maxPrice: maxPrice ? String(parseFloat(maxPrice) * 100) : undefined,
                verified: next ? "true" : undefined,
                category: selectedCategory || undefined,
              });
            }}
            role="switch"
            aria-checked={verifiedOnly}
            aria-label="Show verified sellers only"
            className="flex items-center gap-2.5 w-full"
          >
            <div
              className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                verifiedOnly ? "bg-blue-600" : "bg-slate-200"
              }`}
            >
              <div
                className={`w-4 h-4 mt-0.5 rounded-full bg-white shadow transition-transform ${
                  verifiedOnly ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-slate-700">Verified only</p>
              <p className="text-[10px] text-slate-400">
                Products from verified shops
              </p>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}
