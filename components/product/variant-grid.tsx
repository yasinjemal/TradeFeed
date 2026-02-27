// ============================================================
// Component — Variant Grid
// ============================================================
// Modern card grid displaying all product variants.
// Shows option1 value as heading, option2 with optional color dot.
// Dynamic labels from product.option1Label / option2Label.
// ============================================================

"use client";

import { deleteVariantAction } from "@/app/actions/product";
import { formatZAR } from "@/types";
import { useTransition } from "react";

interface Variant {
  id: string;
  size: string;
  color: string | null;
  priceInCents: number;
  retailPriceCents: number | null;
  stock: number;
  sku: string | null;
}

interface VariantGridProps {
  variants: Variant[];
  shopSlug: string;
  productId: string;
  option1Label?: string;
  option2Label?: string;
}

// ── Color hex map ──────────────────────────────────────────

const COLOR_HEX: Record<string, string> = {
  Black: "#000000",
  White: "#FFFFFF",
  Navy: "#1B2A4A",
  Grey: "#808080",
  Charcoal: "#333333",
  Red: "#DC2626",
  Burgundy: "#800020",
  Blue: "#2563EB",
  "Royal Blue": "#1E40AF",
  "Sky Blue": "#7DD3FC",
  Green: "#16A34A",
  Olive: "#808000",
  Khaki: "#C3B091",
  Brown: "#92400E",
  Tan: "#D2B48C",
  Beige: "#F5F5DC",
  Cream: "#FFFDD0",
  Pink: "#EC4899",
  Purple: "#7C3AED",
  Orange: "#F97316",
  Yellow: "#FACC15",
  Coral: "#FF7F50",
  Teal: "#14B8A6",
  Maroon: "#800000",
};

const LIGHT_COLORS = new Set([
  "White",
  "Cream",
  "Beige",
  "Yellow",
  "Khaki",
  "Tan",
  "Sky Blue",
]);

function StockIndicator({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        <span className="text-xs font-medium text-red-500">Out of stock</span>
      </div>
    );
  if (stock <= 10)
    return (
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span className="text-xs font-medium text-amber-600">{stock} left</span>
      </div>
    );
  return (
    <div className="flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span className="text-xs font-medium text-emerald-600">
        {stock} in stock
      </span>
    </div>
  );
}

export function VariantGrid({
  variants,
  shopSlug,
  productId,
  option1Label = "Size",
  option2Label = "Color",
}: VariantGridProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(variantId: string) {
    if (!confirm("Delete this option?")) return;
    startTransition(async () => {
      await deleteVariantAction(shopSlug, productId, variantId);
    });
  }

  // Determine if option2 values look like colors (for dot display)
  const isOption2Color = option2Label.toLowerCase() === "color" || option2Label.toLowerCase() === "shade";

  if (variants.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-stone-200 py-12 text-center">
        <div className="text-4xl mb-3">📏</div>
        <p className="text-sm font-medium text-stone-500">No options yet</p>
        <p className="text-xs text-stone-400 mt-1">
          Use the quick creator above to add {option1Label.toLowerCase()}s and {option2Label.toLowerCase()}s
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {variants.map((v) => {
        const colorHex = v.color ? (COLOR_HEX[v.color] ?? null) : null;
        const isLight = LIGHT_COLORS.has(v.color ?? "");

        return (
          <div
            key={v.id}
            className="group relative rounded-xl border border-stone-200 bg-white p-3.5 transition-all duration-200
              hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5"
          >
            {/* Delete button */}
            <button
              onClick={() => handleDelete(v.id)}
              disabled={isPending}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs
                flex items-center justify-center opacity-0 group-hover:opacity-100
                transition-all duration-200 hover:scale-110 shadow-sm z-10"
            >
              ✕
            </button>

            {/* Size */}
            <div className="text-xl font-bold text-stone-900 tracking-tight">
              {v.size}
            </div>

            {/* Option 2 */}
            {v.color ? (
              <div className="flex items-center gap-1.5 mt-1.5">
                {isOption2Color && colorHex ? (
                  <span
                    className={`w-3.5 h-3.5 rounded-full shrink-0 ${isLight ? "border border-stone-300" : ""}`}
                    style={{ backgroundColor: colorHex }}
                  />
                ) : isOption2Color ? (
                  <span className="w-3.5 h-3.5 rounded-full shrink-0 bg-stone-300" />
                ) : null}
                <span className="text-xs text-stone-500 truncate">
                  {v.color}
                </span>
              </div>
            ) : (
              <div className="mt-1.5 text-xs text-stone-400">No {option2Label.toLowerCase()}</div>
            )}

            {/* Divider */}
            <div className="border-t border-stone-100 my-2.5" />

            {/* Price */}
            <div className="text-sm font-bold text-emerald-600">
              {formatZAR(v.priceInCents)}
              <span className="text-[10px] font-normal text-stone-400 ml-1">wholesale</span>
            </div>
            {v.retailPriceCents && (
              <div className="text-xs font-semibold text-stone-500 mt-0.5">
                {formatZAR(v.retailPriceCents)}
                <span className="text-[10px] font-normal text-stone-400 ml-1">retail</span>
              </div>
            )}

            {/* Stock */}
            <div className="mt-1">
              <StockIndicator stock={v.stock} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
