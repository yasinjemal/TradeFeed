// ============================================================
// Component — Listing Quality Score
// ============================================================
// Displays a completeness score for a product listing.
// Shows a progress bar + checklist of what's done/missing.
// Used on product detail page and optionally in wizard review step.
// ============================================================

"use client";

interface QualityItem {
  label: string;
  done: boolean;
  weight: number;
}

interface ListingQualityScoreProps {
  hasImage: boolean;
  hasPrice: boolean;
  hasStock: boolean;
  hasDescription: boolean;
  hasCategory: boolean;
  /** Compact mode for inline cards (hides checklist) */
  compact?: boolean;
}

function getItems(props: ListingQualityScoreProps): QualityItem[] {
  return [
    { label: "Product photo", done: props.hasImage, weight: 30 },
    { label: "Price set", done: props.hasPrice, weight: 25 },
    { label: "Stock quantity", done: props.hasStock, weight: 20 },
    { label: "Description", done: props.hasDescription, weight: 15 },
    { label: "Category assigned", done: props.hasCategory, weight: 10 },
  ];
}

export function ListingQualityScore(props: ListingQualityScoreProps) {
  const { compact = false } = props;
  const items = getItems(props);
  const score = items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);

  const color =
    score >= 80 ? "emerald" :
    score >= 50 ? "amber" :
    "red";

  const barColor = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  }[color];

  const textColor = {
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    red: "text-red-700",
  }[color];

  const bgColor = {
    emerald: "bg-emerald-50 border-emerald-100",
    amber: "bg-amber-50 border-amber-100",
    red: "bg-red-50 border-red-100",
  }[color];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className={`text-[10px] font-bold ${textColor}`}>{score}%</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${bgColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-800">Listing Quality</h3>
        <div className="flex items-center gap-2">
          {score === 100 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
              ✓ Complete
            </span>
          )}
          <span className={`text-lg font-bold ${textColor}`}>{score}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 rounded-full bg-white/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Checklist */}
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-xs">
            {item.done ? (
              <span className="text-emerald-500 font-bold">✓</span>
            ) : (
              <span className="text-stone-300 font-bold">○</span>
            )}
            <span className={item.done ? "text-stone-600" : "text-stone-400"}>
              {item.label}
            </span>
            {!item.done && (
              <span className="ml-auto text-[10px] text-amber-500 font-medium">
                +{item.weight}%
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Compute quality score from raw product data.
 * Used by server components to derive props.
 */
export function computeQualityProps(product: {
  images: { id: string }[];
  variants: { priceInCents: number; stock: number }[];
  description: string | null;
  categoryId: string | null;
  globalCategoryId: string | null;
}): ListingQualityScoreProps {
  const hasImage = product.images.length > 0;
  const hasPrice = product.variants.some((v) => v.priceInCents > 0);
  const hasStock = product.variants.some((v) => v.stock > 0);
  const hasDescription = !!product.description && product.description.trim().length > 0;
  const hasCategory = !!product.categoryId || !!product.globalCategoryId;

  return { hasImage, hasPrice, hasStock, hasDescription, hasCategory };
}
