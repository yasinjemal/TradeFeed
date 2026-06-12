"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { TfButton } from "@/components/tf/button";
import { TfInput } from "@/components/tf/input";
import { SA_PROVINCES } from "@/lib/marketplace/locations";
import type { CategoryWithCount, MarketplaceSortBy } from "@/lib/db/marketplace";

// ============================================================
// TfFilterSheet — mobile-first bottom sheet for category, sort,
// verified-sellers, province and price filters. No desktop
// sidebar: the same sheet opens centered on lg+.
// ============================================================

const SORT_OPTIONS: { value: MarketplaceSortBy; label: string }[] = [
  { value: "quality", label: "Best match" },
  { value: "newest", label: "Newest" },
  { value: "trending", label: "Trending" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "top_rated", label: "Top rated" },
];

export interface TfFilterState {
  category?: string;
  sort?: string;
  province?: string;
  minPrice?: string;
  maxPrice?: string;
  verified?: string;
}

interface TfFilterSheetProps {
  open: boolean;
  onClose: () => void;
  categories: CategoryWithCount[];
  initial: TfFilterState;
  onApply: (state: TfFilterState) => void;
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-11 rounded-full border px-4 text-sm transition-colors motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-tf-primary",
        active
          ? "border-tf-ink bg-tf-ink font-semibold text-white"
          : "border-tf-stone-200 bg-tf-raised text-tf-stone-600 hover:border-tf-stone-400 hover:text-tf-ink",
      )}
    >
      {children}
    </button>
  );
}

export function TfFilterSheet({ open, onClose, categories, initial, onApply }: TfFilterSheetProps) {
  const [state, setState] = React.useState<TfFilterState>(initial);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) setState(initial);
  }, [open, initial]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const set = (patch: Partial<TfFilterState>) => setState((s) => ({ ...s, ...patch }));
  const topCategories = categories.filter((c) => !c.parentId && c.productCount > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
      <button aria-label="Close filters" className="absolute inset-0 bg-tf-ink/40" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filter products"
        tabIndex={-1}
        className="relative max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl bg-tf-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-tf-md outline-none lg:max-w-lg lg:rounded-2xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-tf-stone-300 lg:hidden" aria-hidden="true" />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-tf-display text-lg font-semibold text-tf-ink">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-11 items-center justify-center rounded-full text-tf-stone-500 outline-none hover:bg-tf-stone-100 focus-visible:ring-2 focus-visible:ring-tf-primary"
          >
            <X className="size-5" />
          </button>
        </div>

        <fieldset className="mb-5">
          <legend className="mb-2 text-sm font-medium text-tf-ink">Sort by</legend>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                active={(state.sort ?? "quality") === o.value}
                onClick={() => set({ sort: o.value === "quality" ? undefined : o.value })}
              >
                {o.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="mb-5">
          <legend className="mb-2 text-sm font-medium text-tf-ink">Sellers</legend>
          <Chip
            active={state.verified === "true"}
            onClick={() => set({ verified: state.verified === "true" ? undefined : "true" })}
          >
            Verified sellers only
          </Chip>
        </fieldset>

        {topCategories.length > 0 && (
          <fieldset className="mb-5">
            <legend className="mb-2 text-sm font-medium text-tf-ink">Category</legend>
            <div className="flex flex-wrap gap-2">
              <Chip active={!state.category} onClick={() => set({ category: undefined })}>
                All
              </Chip>
              {topCategories.map((c) => (
                <Chip
                  key={c.slug}
                  active={state.category === c.slug}
                  onClick={() => set({ category: state.category === c.slug ? undefined : c.slug })}
                >
                  {c.name} <span className="tabular-nums text-tf-stone-400">({c.productCount})</span>
                </Chip>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset className="mb-5">
          <legend className="mb-2 text-sm font-medium text-tf-ink">Province</legend>
          <select
            value={state.province ?? ""}
            onChange={(e) => set({ province: e.target.value || undefined })}
            className="min-h-11 w-full rounded-[10px] border border-tf-stone-300 bg-tf-raised px-3 text-[15px] text-tf-ink outline-none focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25"
          >
            <option value="">All of South Africa</option>
            {SA_PROVINCES.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="mb-6">
          <legend className="mb-2 text-sm font-medium text-tf-ink">Price (R)</legend>
          <div className="flex items-center gap-3">
            <TfInput
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Min"
              aria-label="Minimum price in Rand"
              value={state.minPrice ?? ""}
              onChange={(e) => set({ minPrice: e.target.value || undefined })}
            />
            <span className="text-tf-stone-400">–</span>
            <TfInput
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Max"
              aria-label="Maximum price in Rand"
              value={state.maxPrice ?? ""}
              onChange={(e) => set({ maxPrice: e.target.value || undefined })}
            />
          </div>
        </fieldset>

        <div className="flex gap-3">
          <TfButton
            variant="secondary"
            fullWidth
            onClick={() => {
              setState({});
              onApply({});
            }}
          >
            Clear all
          </TfButton>
          <TfButton fullWidth onClick={() => onApply(state)}>
            Show results
          </TfButton>
        </div>
      </div>
    </div>
  );
}
