// ============================================================
// Marketplace Filter Sheet — Slide-over panel for filtering
// ============================================================
// Opens from the right side on desktop, bottom on mobile.
// Filters: Province, Price Range, Verified Only, Category.
// ============================================================

"use client";

import { useState, useEffect } from "react";
import type { CategoryWithCount, MarketplaceSortBy } from "@/lib/db/marketplace";

// South African provinces
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

interface MarketplaceFilterSheetProps {
  open: boolean;
  onClose: () => void;
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

export function MarketplaceFilterSheet({
  open,
  onClose,
  categories,
  currentFilters,
  onApply,
}: MarketplaceFilterSheetProps) {
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

  // Sync state when filters change externally
  useEffect(() => {
    setProvince(currentFilters.province ?? "");
    setMinPrice(currentFilters.minPrice ? String(currentFilters.minPrice / 100) : "");
    setMaxPrice(currentFilters.maxPrice ? String(currentFilters.maxPrice / 100) : "");
    setVerifiedOnly(currentFilters.verifiedOnly);
    setSelectedCategory(currentFilters.category ?? "");
  }, [currentFilters]);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-stone-950 border-l border-stone-800 shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
            <h2 className="text-base font-bold text-stone-100">Filters</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl bg-stone-900 border border-stone-800 px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-emerald-500/50"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                Province
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full rounded-xl bg-stone-900 border border-stone-800 px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-emerald-500/50"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                Price Range (ZAR)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-500">R</span>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    min="0"
                    className="w-full rounded-xl bg-stone-900 border border-stone-800 pl-7 pr-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <span className="text-stone-600 text-sm">—</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-500">R</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    min="0"
                    className="w-full rounded-xl bg-stone-900 border border-stone-800 pl-7 pr-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Verified Only */}
            <div>
              <button
                type="button"
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className="flex items-center gap-3 w-full"
              >
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${
                    verifiedOnly ? "bg-emerald-600" : "bg-stone-800"
                  }`}
                >
                  <div
                    className={`w-5 h-5 mt-0.5 rounded-full bg-white shadow transition-transform ${
                      verifiedOnly ? "translate-x-[18px]" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-stone-200">
                    Verified sellers only
                  </p>
                  <p className="text-xs text-stone-500">
                    Only show products from verified shops
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-5 py-4 border-t border-stone-800">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-700 text-sm text-stone-300 hover:bg-stone-900 transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-all"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
