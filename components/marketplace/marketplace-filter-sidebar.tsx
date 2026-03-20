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

function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/80">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open ? <div className="border-t border-slate-200 px-4 py-4">{children}</div> : null}
    </section>
  );
}

export function MarketplaceFilterSidebar({
  categories,
  currentFilters,
  onApply,
}: MarketplaceFilterSidebarProps) {
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

  function applyFilters(next?: Partial<{ province: string; minPrice: string; maxPrice: string; verifiedOnly: boolean; category: string }>) {
    const nextProvince = next?.province ?? province;
    const nextMinPrice = next?.minPrice ?? minPrice;
    const nextMaxPrice = next?.maxPrice ?? maxPrice;
    const nextVerifiedOnly = next?.verifiedOnly ?? verifiedOnly;
    const nextCategory = next?.category ?? selectedCategory;

    onApply({
      province: nextProvince || undefined,
      minPrice: nextMinPrice ? String(Math.round(parseFloat(nextMinPrice) * 100)) : undefined,
      maxPrice: nextMaxPrice ? String(Math.round(parseFloat(nextMaxPrice) * 100)) : undefined,
      verified: nextVerifiedOnly ? "true" : undefined,
      category: nextCategory || undefined,
    });
  }

  function handleReset() {
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
  }

  const activeChips = [
    selectedCategory
      ? {
          label: categoryOptions.find((option) => option.slug === selectedCategory)?.label ?? selectedCategory,
          onRemove: () => {
            setSelectedCategory("");
            applyFilters({ category: "" });
          },
        }
      : null,
    province
      ? {
          label: province,
          onRemove: () => {
            setProvince("");
            applyFilters({ province: "" });
          },
        }
      : null,
    minPrice || maxPrice
      ? {
          label: `${minPrice ? `R${minPrice}` : "Any"} - ${maxPrice ? `R${maxPrice}` : "Any"}`,
          onRemove: () => {
            setMinPrice("");
            setMaxPrice("");
            applyFilters({ minPrice: "", maxPrice: "" });
          },
        }
      : null,
    verifiedOnly
      ? {
          label: "Verified only",
          onRemove: () => {
            setVerifiedOnly(false);
            applyFilters({ verifiedOnly: false });
          },
        }
      : null,
  ].filter(Boolean) as { label: string; onRemove: () => void }[];

  return (
    <aside className="hidden w-[300px] shrink-0 lg:block">
      <div className="sticky top-20 space-y-4 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Refine results</p>
            <p className="mt-1 text-xs text-slate-500">Filter by trust, location, and spend range.</p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
          >
            Clear all
          </button>
        </div>

        {activeChips.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.onRemove}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                <span>{chip.label}</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
          </div>
        ) : null}

        <CollapsibleSection title="Category" subtitle="Browse the most active shopping categories.">
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("");
                applyFilters({ category: "" });
              }}
              className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left text-sm transition-colors ${
                selectedCategory === ""
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <span>All categories</span>
              <span className="text-xs text-slate-400">Browse all</span>
            </button>
            {categoryOptions.map((option) => {
              const isActive = selectedCategory === option.slug;
              return (
                <button
                  key={option.slug}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(isActive ? "" : option.slug);
                    applyFilters({ category: isActive ? "" : option.slug });
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span>{option.label}</span>
                  <span className={`text-xs ${isActive ? "text-emerald-500" : "text-slate-400"}`}>{option.count}</span>
                </button>
              );
            })}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Location" subtitle="Prioritize products near your buyers.">
          <select
            value={province}
            onChange={(event) => {
              setProvince(event.target.value);
              applyFilters({ province: event.target.value });
            }}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
          >
            <option value="">All provinces</option>
            {SA_PROVINCES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </CollapsibleSection>

        <CollapsibleSection title="Price" subtitle="Use a budget band or set a custom range.">
          <div className="grid grid-cols-2 gap-2">
            {PRICE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setMinPrice(preset.min);
                  setMaxPrice(preset.max);
                  applyFilters({ minPrice: preset.min, maxPrice: preset.max });
                }}
                className={`rounded-2xl border px-3 py-2 text-xs font-medium transition-colors ${
                  minPrice === preset.min && maxPrice === preset.max
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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

          <button
            type="button"
            onClick={() => applyFilters()}
            className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Apply price range
          </button>
        </CollapsibleSection>

        <CollapsibleSection title="Trust" subtitle="Only surface stores buyers can trust quickly.">
          <button
            type="button"
            onClick={() => {
              const nextValue = !verifiedOnly;
              setVerifiedOnly(nextValue);
              applyFilters({ verifiedOnly: nextValue });
            }}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-slate-300"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">Verified sellers only</p>
              <p className="mt-1 text-xs text-slate-500">Show shops with visible TradeFeed verification.</p>
            </div>
            <div className={`flex h-6 w-11 items-center rounded-full px-1 transition-colors ${verifiedOnly ? "bg-emerald-500" : "bg-slate-200"}`}>
              <div className={`h-4 w-4 rounded-full bg-white transition-transform ${verifiedOnly ? "translate-x-5" : "translate-x-0"}`} />
            </div>
          </button>
        </CollapsibleSection>
      </div>
    </aside>
  );
}
