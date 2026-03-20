"use client";

import { useEffect, useMemo, useState } from "react";
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

const PRICE_PRESETS = [
  { label: "Under R250", min: "", max: "250" },
  { label: "R250 - R750", min: "250", max: "750" },
  { label: "R750 - R1500", min: "750", max: "1500" },
  { label: "R1500+", min: "1500", max: "" },
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

interface CategoryOption {
  slug: string;
  label: string;
  count: number;
}

function flattenCategories(categories: CategoryWithCount[]) {
  const options: CategoryOption[] = [];
  for (const category of categories) {
    if (category.children.length > 0) {
      for (const child of category.children) {
        if (child.productCount > 0) {
          options.push({ slug: child.slug, label: child.name, count: child.productCount });
        }
      }
      continue;
    }
    if (category.productCount > 0) {
      options.push({ slug: category.slug, label: category.name, count: category.productCount });
    }
  }
  return options;
}

export function MarketplaceFilterSheet({
  open,
  onClose,
  categories,
  currentFilters,
  onApply,
}: MarketplaceFilterSheetProps) {
  const [province, setProvince] = useState(currentFilters.province ?? "");
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice ? String(currentFilters.minPrice / 100) : "");
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice ? String(currentFilters.maxPrice / 100) : "");
  const [verifiedOnly, setVerifiedOnly] = useState(currentFilters.verifiedOnly);
  const [selectedCategory, setSelectedCategory] = useState(currentFilters.category ?? "");
  const categoryOptions = useMemo(() => flattenCategories(categories), [categories]);

  useEffect(() => {
    setProvince(currentFilters.province ?? "");
    setMinPrice(currentFilters.minPrice ? String(currentFilters.minPrice / 100) : "");
    setMaxPrice(currentFilters.maxPrice ? String(currentFilters.maxPrice / 100) : "");
    setVerifiedOnly(currentFilters.verifiedOnly);
    setSelectedCategory(currentFilters.category ?? "");
  }, [currentFilters]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  function handleApply() {
    onApply({
      province: province || undefined,
      minPrice: minPrice ? String(Math.round(parseFloat(minPrice) * 100)) : undefined,
      maxPrice: maxPrice ? String(Math.round(parseFloat(maxPrice) * 100)) : undefined,
      verified: verifiedOnly ? "true" : undefined,
      category: selectedCategory || undefined,
    });
    onClose();
  }

  function handleReset() {
    setProvince("");
    setMinPrice("");
    setMaxPrice("");
    setVerifiedOnly(false);
    setSelectedCategory("");
  }

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm"
        aria-label="Close filters"
      />

      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-hidden rounded-t-[2rem] border-t border-slate-200 bg-white shadow-2xl shadow-slate-950/20 lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
          <div>
            <p className="text-base font-semibold text-slate-900">Refine results</p>
            <p className="mt-1 text-xs text-slate-500">Filter by category, trust, location, and price.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
            aria-label="Close filter sheet"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(88vh-138px)] overflow-y-auto px-5 pb-6">
          <div className="space-y-6">
            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Category</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("")}
                  className={`rounded-2xl border px-3 py-3 text-sm font-medium transition-colors ${
                    selectedCategory === ""
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  All categories
                </button>
                {categoryOptions.slice(0, 9).map((option) => (
                  <button
                    key={option.slug}
                    type="button"
                    onClick={() => setSelectedCategory(option.slug)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-medium transition-colors ${
                      selectedCategory === option.slug
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Province</p>
              <select
                value={province}
                onChange={(event) => setProvince(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="">All provinces</option>
                {SA_PROVINCES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </section>

            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Price</p>
              <div className="grid grid-cols-2 gap-2">
                {PRICE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setMinPrice(preset.min);
                      setMaxPrice(preset.max);
                    }}
                    className={`rounded-2xl border px-3 py-3 text-xs font-medium transition-colors ${
                      minPrice === preset.min && maxPrice === preset.max
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Min</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">R</span>
                    <input
                      type="number"
                      min="0"
                      value={minPrice}
                      onChange={(event) => setMinPrice(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-7 pr-3 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                      placeholder="0"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Max</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">R</span>
                    <input
                      type="number"
                      min="0"
                      value={maxPrice}
                      onChange={(event) => setMaxPrice(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-7 pr-3 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                      placeholder="Any"
                    />
                  </div>
                </label>
              </div>
            </section>

            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Trust</p>
              <button
                type="button"
                onClick={() => setVerifiedOnly((value) => !value)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">Verified sellers only</p>
                  <p className="mt-1 text-xs text-slate-500">Highlight sellers with visible TradeFeed verification.</p>
                </div>
                <div className={`flex h-6 w-11 items-center rounded-full px-1 transition-colors ${verifiedOnly ? "bg-emerald-500" : "bg-slate-200"}`}>
                  <div className={`h-4 w-4 rounded-full bg-white transition-transform ${verifiedOnly ? "translate-x-5" : "translate-x-0"}`} />
                </div>
              </button>
            </section>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-5 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Apply filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
