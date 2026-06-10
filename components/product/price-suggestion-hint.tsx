// ============================================================
// Component — Price Suggestion Hint (Phase 3)
// ============================================================
// Shows a percentile-based price range from similar listings
// in the chosen marketplace category. Tapping a price fills
// the wizard's price field. Renders nothing without enough
// market data or when the flag is off.
// ============================================================

"use client";

import { useEffect, useState } from "react";
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
    <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 px-3.5 py-3">
      <p className="text-xs font-semibold text-emerald-800 mb-2">
        💡 Similar products sell for {rands(suggestion.p25Cents)}–{rands(suggestion.p75Cents)}
        <span className="font-normal text-emerald-600"> ({suggestion.sampleSize} listings)</span>
      </p>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onPick?.((opt.cents / 100).toFixed(2))}
            className="flex-1 rounded-lg bg-white border border-emerald-200/60 px-2 py-1.5 text-center hover:border-emerald-400 transition-colors"
          >
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
              {opt.label}
            </span>
            <span className="block text-sm font-bold text-slate-900">{rands(opt.cents)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
