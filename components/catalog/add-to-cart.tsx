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

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/lib/cart/cart-context";
import { formatZAR } from "@/types";
import { toast } from "sonner";

interface Variant {
  id: string;
  size: string;
  color: string | null;
  priceInCents: number;
  retailPriceCents: number | null;
  stock: number;
}

interface AddToCartProps {
  productId: string;
  productName: string;
  imageUrl?: string;
  variants: Variant[];
  option1Label?: string;
  option2Label?: string;
  minWholesaleQty?: number;
  bulkDiscountTiers?: { minQuantity: number; discountPercent: number }[];
}

export function AddToCart({
  productId,
  productName,
  imageUrl,
  variants,
  option1Label = "Size",
  option2Label = "Color",
  minWholesaleQty = 1,
  bulkDiscountTiers = [],
}: AddToCartProps) {
  const { addItem } = useCart();
  const t = useTranslations("catalog");

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<"wholesale" | "retail">("wholesale");
  const [quantity, setQuantity] = useState(minWholesaleQty);
  const [justAdded, setJustAdded] = useState(false);

  // Show retail toggle when any variant has a retail price set
  // (retail availability is driven by product data, not shop config)
  const hasAnyRetailPrice = variants.some((v) => v.retailPriceCents !== null && v.retailPriceCents > 0);
  const showRetailToggle = hasAnyRetailPrice;

  // Effective minimum based on order type
  const effectiveMinQty = orderType === "retail" ? 1 : minWholesaleQty;

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
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    setSelectedColor(null);
    setQuantity(effectiveMinQty);

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
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setQuantity(effectiveMinQty);
  };

  // Reset quantity when order type changes
  const handleOrderTypeChange = (type: "wholesale" | "retail") => {
    setOrderType(type);
    const newMin = type === "retail" ? 1 : minWholesaleQty;
    setQuantity((prev) => Math.max(newMin, prev <= newMin ? newMin : prev));
  };

  const handleAdd = () => {
    if (!selectedVariant || !canAdd) return;

    const isRetail = orderType === "retail";
    let unitPrice = isRetail && selectedVariant.retailPriceCents
      ? selectedVariant.retailPriceCents
      : selectedVariant.priceInCents;

    // Apply bulk discount for wholesale orders
    if (!isRetail && bulkDiscountTiers.length > 0) {
      const sorted = [...bulkDiscountTiers].sort((a, b) => a.minQuantity - b.minQuantity);
      const applied = sorted.filter((t) => quantity >= t.minQuantity).pop();
      if (applied) {
        unitPrice = Math.round(unitPrice * (1 - applied.discountPercent / 100));
      }
    }

    addItem({
      variantId: selectedVariant.id,
      productId,
      productName,
      imageUrl,
      size: selectedVariant.size,
      color: selectedVariant.color,
      option1Label,
      option2Label,
      priceInCents: unitPrice,
      maxStock: selectedVariant.stock,
      minWholesaleQty,
      orderType,
    }, quantity);

    // Show toast
    toast.success(`${productName} added to cart`, {
      description: `${quantity}× ${selectedVariant.size}${selectedVariant.color ? " / " + selectedVariant.color : ""} — ${formatZAR(unitPrice * quantity)}${isRetail ? " (retail)" : ""}`,
      duration: 2500,
    });

    // Show feedback
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);

    // Reset for next add
    setQuantity(effectiveMinQty);
  };

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
                    ? "text-white shadow-md scale-105"
                    : inStock
                    ? "bg-stone-100 text-stone-700 hover:bg-stone-200 active:scale-95"
                    : "bg-stone-50 text-stone-300 line-through cursor-not-allowed"
                }`}
                style={isSelected ? { backgroundColor: "var(--shop-primary, #059669)" } : undefined}
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
                      ? "text-white shadow-md"
                      : "bg-stone-50 border border-stone-200 text-stone-700 hover:border-stone-300 active:scale-95"
                  }`}
                  style={isSelected ? { backgroundColor: "var(--shop-primary, #059669)" } : undefined}
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
          {/* ── Wholesale / Retail Toggle ─── */}
          {showRetailToggle && (
            <div className="mb-4">
              <div className="flex rounded-xl bg-white border border-stone-200 p-0.5">
                <button
                  onClick={() => handleOrderTypeChange("wholesale")}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    orderType === "wholesale"
                      ? "text-white shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                  style={orderType === "wholesale" ? { backgroundColor: "var(--shop-primary, #059669)" } : undefined}
                >
                  🏭 Wholesale
                </button>
                <button
                  onClick={() => handleOrderTypeChange("retail")}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    orderType === "retail"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  🛍️ Retail
                </button>
              </div>
            </div>
          )}

          {/* Price + Stock */}
          <div className="flex items-center justify-between mb-4">
            <div>
              {orderType === "retail" && selectedVariant.retailPriceCents ? (
                <>
                  <span className="text-2xl font-bold text-stone-900">
                    {formatZAR(selectedVariant.retailPriceCents)}
                  </span>
                  <span className="text-xs text-stone-500 ml-1">each</span>
                  <div className="text-xs text-stone-400 mt-0.5">
                    Wholesale: <span className="font-semibold text-stone-500">{formatZAR(selectedVariant.priceInCents)}</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold text-stone-900">
                    {formatZAR(selectedVariant.priceInCents)}
                  </span>
                  <span className="text-xs text-stone-500 ml-1">each</span>
                  {selectedVariant.retailPriceCents && (
                    <div className="text-xs text-stone-400 mt-0.5">
                      Retail: <span className="font-semibold text-stone-500">{formatZAR(selectedVariant.retailPriceCents)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {t("inStock", { count: selectedVariant.stock })}
            </span>
          </div>

          {/* Quantity Stepper */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
              Qty
            </span>
            <div className="flex items-center bg-white rounded-xl border border-stone-200 overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(effectiveMinQty, q - 1))}
                disabled={quantity <= effectiveMinQty}
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
                = {formatZAR((orderType === "retail" && selectedVariant.retailPriceCents ? selectedVariant.retailPriceCents : selectedVariant.priceInCents) * quantity)}
              </span>
            )}
          </div>

          {/* MOQ notice — only for wholesale */}
          {orderType === "wholesale" && minWholesaleQty > 1 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-4 flex items-center gap-1.5">
              <span>📦</span> Wholesale min. order: <span className="font-bold">{minWholesaleQty} units</span>
            </p>
          )}
          {orderType === "retail" && (
            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 mb-4 flex items-center gap-1.5">
              <span>🛍️</span> Retail — order from <span className="font-bold">1 unit</span>
            </p>
          )}

          {/* Bulk discount indicator */}
          {bulkDiscountTiers.length > 0 && orderType === "wholesale" && (() => {
            const sorted = [...bulkDiscountTiers].sort((a, b) => a.minQuantity - b.minQuantity);
            const applied = sorted.filter((t) => quantity >= t.minQuantity).pop();
            const next = sorted.find((t) => quantity < t.minQuantity);
            return (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
                {applied ? (
                  <p className="text-amber-800 font-semibold">
                    🎉 {applied.discountPercent}% bulk discount applied!
                    {next && (
                      <span className="font-normal text-amber-600">
                        {" "}· Add {next.minQuantity - quantity} more for {next.discountPercent}% off
                      </span>
                    )}
                  </p>
                ) : next ? (
                  <p className="text-amber-700">
                    📦 Order {next.minQuantity}+ units for {next.discountPercent}% off
                  </p>
                ) : null}
              </div>
            );
          })()}

          <div className="hidden sm:block">
            <button
              onClick={handleAdd}
              disabled={!canAdd || justAdded}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 active:scale-[0.98] ${
                justAdded
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                  : "text-white shadow-md hover:shadow-lg hover:brightness-110"
              }`}
              style={!justAdded ? { backgroundColor: "var(--shop-primary, #1c1917)" } : undefined}
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
                  Add to Cart — {formatZAR((orderType === "retail" && selectedVariant.retailPriceCents ? selectedVariant.retailPriceCents : selectedVariant.priceInCents) * quantity)}
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
              <button
                onClick={handleAdd}
                disabled={!canAdd || justAdded}
                className={`min-h-[48px] flex-1 rounded-xl px-3 text-sm font-semibold transition-all duration-300 active:scale-[0.99] ${
                  justAdded
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                    : "text-white shadow-md hover:brightness-110"
                }`}
                style={!justAdded ? { backgroundColor: "var(--shop-primary, #1c1917)" } : undefined}
              >
                {justAdded
                  ? "Added to Cart"
                  : `Add to Cart — ${formatZAR((orderType === "retail" && selectedVariant.retailPriceCents ? selectedVariant.retailPriceCents : selectedVariant.priceInCents) * quantity)}`}
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
