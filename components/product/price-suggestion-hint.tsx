// ============================================================
// Component — Price Suggestion Hint (Phase 3)
// ============================================================
// Shows a percentile-based price range from similar listings
// in the chosen marketplace category. Tapping a price fills
// the Add product screen's price field. Renders nothing without
// enough market data or when the flag is off.
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import { getPriceSuggestionAction } from "@/app/actions/price-suggestion";
import type { PriceSuggestion } from "@/lib/ai/price-suggestion";

interface PriceSuggestionHintProps {
  shopSlug: string;
  globalCategoryId: string;
  onPick?: (priceInRands: string) => void;
}

function rands(cents: number): string {
  const value = cents / 100;
  return Number.isInteger(value) ? `R${value}` : `R${value.toFixed(2)}`;
}

export function PriceSuggestionHint({
  shopSlug,
  globalCategoryId,
  onPick,
}: PriceSuggestionHintProps) {
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null);

  useEffect(() => {
    if (!FEATURE_FLAGS.PRICE_SUGGESTIONS || !globalCategoryId) {
      setSuggestion(null);
      return;
    }
    let cancelled = false;
    getPriceSuggestionAction(shopSlug, globalCategoryId).then((res) => {
      if (!cancelled && res.success) setSuggestion(res.suggestion);
    });
    return () => {
      cancelled = true;
    };
  }, [shopSlug, globalCategoryId]);

  if (!suggestion) return null;

  const options = [
    { label: "Competitive", cents: suggestion.p25Cents },
    { label: "Typical", cents: suggestion.medianCents },
    { label: "Premium", cents: suggestion.p75Cents },
  ];

  return (
    <div className="rounded-xl border border-tf-stone-200 bg-tf-stone-50 p-3">
      <p className="mb-2 flex items-start gap-2 text-sm text-tf-ink">
        <Lightbulb aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tf-primary" />
        <span>
          Similar products sell for {rands(suggestion.p25Cents)}–{rands(suggestion.p75Cents)}
          <span className="text-tf-stone-600"> ({suggestion.sampleSize} listings)</span>
        </span>
      </p>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onPick?.((opt.cents / 100).toFixed(2))}
            className="min-h-11 flex-1 cursor-pointer rounded-[10px] border border-tf-stone-300 bg-tf-raised px-2 py-1.5 text-center outline-none transition-colors hover:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary motion-reduce:transition-none"
          >
            <span className="block text-xs font-medium text-tf-stone-600">{opt.label}</span>
            <span className="block text-sm font-semibold tabular-nums text-tf-ink">{rands(opt.cents)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
