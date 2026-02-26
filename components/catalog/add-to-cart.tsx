// ============================================================
// Component — Add to Cart
// ============================================================
// Interactive variant picker for the product detail page.
// Buyer selects option1 → option2 (if applicable) → quantity → add.
//
// DESIGN:
// - Option1 pills: tap to select, shows which are in stock
// - Option2 chips: appear after option1 selection, filtered to available
// - Quantity stepper: +/- buttons, capped at stock
// - Add button: green with satisfying feedback animation
// - Shows selected variant price
//
// STATE FLOW: option1 → option2 → quantity → add to cart
// ============================================================

"use client";

import { useState, useCallback } from "react";
import { useCart } from "@/lib/cart/cart-context";
import { formatZAR } from "@/types";
import { toast } from "sonner";

interface Variant {
  id: string;
  size: string;
  color: string | null;
  priceInCents: number;
  stock: number;
}

interface AddToCartProps {
  productId: string;
  productName: string;
  imageUrl?: string;
  variants: Variant[];
  option1Label?: string;
  option2Label?: string;
  quickOrderHref?: string;
}

export function AddToCart({
  productId,
  productName,
  imageUrl,
  variants,
  option1Label = "Size",
  option2Label = "Color",
  quickOrderHref,
}: AddToCartProps) {
  const { addItem } = useCart();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // ── Derived data ─────────────────────────────────────────
  const uniqueSizes = Array.from(new Set(variants.map((v) => v.size)));

  // Colors available for the selected size
  const availableColors = selectedSize
    ? Array.from(
        new Set(
          variants
            .filter((v) => v.size === selectedSize && v.stock > 0)
            .map((v) => v.color)
            .filter(Boolean)
        )
      )
    : [];

  // The currently selected variant (if size + color match)
  const selectedVariant = variants.find((v) => {
    if (!selectedSize) return false;
    if (v.size !== selectedSize) return false;
    // If product has colors, must match color too
    if (availableColors.length > 0) {
      return v.color === selectedColor;
    }
    // No colors — just match size
    return true;
  });

  const maxStock = selectedVariant?.stock ?? 0;
  const canAdd = selectedVariant !== undefined && selectedVariant.stock > 0 && quantity > 0;

  // ── Handlers ─────────────────────────────────────────────
  const handleSizeSelect = useCallback(
    (size: string) => {
      setSelectedSize(size);
      setSelectedColor(null);
      setQuantity(1);

      // Auto-select color if only one option
      const colorsForSize = Array.from(
        new Set(
          variants
            .filter((v) => v.size === size && v.stock > 0)
            .map((v) => v.color)
            .filter(Boolean)
        )
      );
      if (colorsForSize.length === 1 && colorsForSize[0]) {
        setSelectedColor(colorsForSize[0]);
      }
    },
    [variants]
  );

  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color);
    setQuantity(1);
  }, []);

  const handleAdd = useCallback(() => {
    if (!selectedVariant || !canAdd) return;

    addItem({
      variantId: selectedVariant.id,
      productId,
      productName,
      imageUrl,
      size: selectedVariant.size,
      color: selectedVariant.color,
      option1Label,
      option2Label,
      priceInCents: selectedVariant.priceInCents,
      maxStock: selectedVariant.stock,
    }, quantity);

    // Show toast
    toast.success(`${productName} added to cart`, {
      description: `${quantity}× ${selectedVariant.size}${selectedVariant.color ? " / " + selectedVariant.color : ""} — ${formatZAR(selectedVariant.priceInCents * quantity)}`,
      duration: 2500,
    });

    // Show feedback
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);

    // Reset for next add
    setQuantity(1);
  }, [selectedVariant, canAdd, addItem, productId, productName, option1Label, option2Label, quantity]);

  // ── Check if a size has any stock ────────────────────────
  const sizeHasStock = (size: string): boolean =>
    variants.some((v) => v.size === size && v.stock > 0);

  return (
    <div className="space-y-5">
      {/* ── Size Selector ───────────────────────────────── */}
      <div>
        <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2.5">
          Select {option1Label}
        </h3>
        <div className="flex flex-wrap gap-2">
          {uniqueSizes.map((size) => {
            const inStock = sizeHasStock(size);
            const isSelected = selectedSize === size;

            return (
              <button
                key={size}
                onClick={() => inStock && handleSizeSelect(size)}
                disabled={!inStock}
                className={`min-w-[2.75rem] px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200 scale-105"
                    : inStock
                    ? "bg-stone-100 text-stone-700 hover:bg-stone-200 active:scale-95"
                    : "bg-stone-50 text-stone-300 line-through cursor-not-allowed"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Color Selector (only if product has colors) ── */}
      {selectedSize && availableColors.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2.5">
            Select {option2Label}
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => {
              const isSelected = selectedColor === color;
              return (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color!)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                      : "bg-stone-50 border border-stone-200 text-stone-700 hover:border-stone-300 active:scale-95"
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isSelected ? "border-2 border-white" : "border border-stone-300"
                    }`}
                    style={{ backgroundColor: colorToHex(color!) }}
                  />
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Selected variant info + quantity ─────────────── */}
      {selectedVariant && selectedVariant.stock > 0 && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          {/* Price + Stock */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-2xl font-bold text-stone-900">
                {formatZAR(selectedVariant.priceInCents)}
              </span>
              <span className="text-xs text-stone-500 ml-2">each</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {selectedVariant.stock} in stock
            </span>
          </div>

          {/* Quantity Stepper */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
              Qty
            </span>
            <div className="flex items-center bg-white rounded-xl border border-stone-200 overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors disabled:text-stone-300 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
              </button>
              <span className="w-12 text-center font-semibold text-stone-900 text-sm tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                disabled={quantity >= maxStock}
                className="w-10 h-10 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors disabled:text-stone-300 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
            {quantity > 1 && (
              <span className="text-sm text-stone-500 font-medium">
                = {formatZAR(selectedVariant.priceInCents * quantity)}
              </span>
            )}
          </div>

          <div className="hidden sm:block">
            <button
              onClick={handleAdd}
              disabled={!canAdd || justAdded}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 active:scale-[0.98] ${
                justAdded
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                  : "bg-stone-900 text-white hover:bg-stone-800 shadow-md hover:shadow-lg"
              }`}
            >
              {justAdded ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Added to Cart!
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                  Add to Cart — {formatZAR(selectedVariant.priceInCents * quantity)}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Prompt to select ────────────────────────────── */}
      {!selectedSize && (
        <p className="text-sm text-stone-400 text-center py-2">
          ↑ Select a {option1Label.toLowerCase()} to add to your order
        </p>
      )}
      {selectedSize && availableColors.length > 0 && !selectedColor && (
        <p className="text-sm text-stone-400 text-center py-2">
          ↑ Select a {option2Label.toLowerCase()} to continue
        </p>
      )}

      {selectedVariant && selectedVariant.stock > 0 && (
        <div className="sm:hidden">
          <div
            className="fixed inset-x-0 bottom-16 z-40 border-t border-stone-200/80 bg-white/95 px-3 pb-2 pt-2 backdrop-blur-xl"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
          >
            <div className="mx-auto flex w-full max-w-xl gap-2">
              {quickOrderHref && (
                <a
                  href={quickOrderHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              )}

              <button
                onClick={handleAdd}
                disabled={!canAdd || justAdded}
                className={`min-h-[48px] flex-1 rounded-xl px-3 text-sm font-semibold transition-all duration-300 active:scale-[0.99] ${
                  justAdded
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                    : "bg-stone-900 text-white shadow-md"
                }`}
              >
                {justAdded
                  ? "Added to Cart"
                  : `Add to Cart — ${formatZAR(selectedVariant.priceInCents * quantity)}`}
              </button>
            </div>
          </div>
          <div className="h-24" />
        </div>
      )}
    </div>
  );
}

// ================================================================
// Helper: Color name → CSS hex
// ================================================================

function colorToHex(color: string): string {
  const colorMap: Record<string, string> = {
    black: "#1a1a1a", white: "#f5f5f5", red: "#dc2626", blue: "#2563eb",
    navy: "#1e3a5f", green: "#16a34a", yellow: "#eab308", pink: "#ec4899",
    purple: "#9333ea", orange: "#ea580c", grey: "#6b7280", gray: "#6b7280",
    brown: "#92400e", beige: "#d4b896", cream: "#fffdd0", maroon: "#800000",
    olive: "#556b2f", teal: "#0d9488", coral: "#f97316", khaki: "#bdb76b",
    gold: "#ca8a04", silver: "#a8a29e", charcoal: "#374151", burgundy: "#800020",
    tan: "#d2b48c", mint: "#a7f3d0", lavender: "#c4b5fd", peach: "#fdba74",
    rose: "#fb7185", sky: "#38bdf8", denim: "#1e40af",
  };
  return colorMap[color.toLowerCase()] || "#9ca3af";
}
