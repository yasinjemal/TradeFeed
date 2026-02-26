// ============================================================
// Component — Add Combo to Cart
// ============================================================
// Simple add-to-cart for combo deals. No variant selection needed
// — combos are fixed bundles at a fixed price.
// ============================================================

"use client";

import { useState, useCallback } from "react";
import { useCart } from "@/lib/cart/cart-context";
import { formatZAR } from "@/types";
import { toast } from "sonner";

interface AddComboToCartProps {
  comboId: string;
  comboName: string;
  priceCents: number;
  retailPriceCents: number | null;
  stock: number;
  imageUrl?: string;
  items: { productName: string; variantLabel: string | null; quantity: number }[];
}

export function AddComboToCart({
  comboId,
  comboName,
  priceCents,
  retailPriceCents: _retailPriceCents,
  stock,
  imageUrl,
  items,
}: AddComboToCartProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = useCallback(() => {
    addItem(
      {
        variantId: `combo-${comboId}`, // Unique ID for cart keying
        productId: comboId,
        productName: `📦 ${comboName}`,
        imageUrl,
        size: `${items.length} items`, // Show item count as "size"
        color: null,
        option1Label: "Bundle",
        option2Label: "Items",
        priceInCents: priceCents,
        maxStock: stock,
      },
      quantity
    );

    setJustAdded(true);
    toast.success(`${comboName} added to cart!`);
    setTimeout(() => setJustAdded(false), 1500);
  }, [addItem, comboId, comboName, imageUrl, items.length, priceCents, stock, quantity]);

  return (
    <div className="space-y-4">
      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-stone-700">Quantity</span>
        <div className="flex items-center rounded-xl border border-stone-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
            disabled={quantity <= 1}
          >
            −
          </button>
          <span className="w-12 h-10 flex items-center justify-center text-sm font-semibold text-stone-900 border-x border-stone-200">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(stock, quantity + 1))}
            className="w-10 h-10 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
            disabled={quantity >= stock}
          >
            +
          </button>
        </div>
        <span className="text-sm font-semibold text-stone-900">
          {formatZAR(priceCents * quantity)}
        </span>
      </div>

      {/* Add to Cart button */}
      <button
        type="button"
        onClick={handleAdd}
        className={`min-h-[48px] w-full rounded-2xl px-6 py-3 text-sm font-bold transition-all duration-200 ${
          justAdded
            ? "bg-emerald-100 text-emerald-700 scale-95"
            : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
        }`}
      >
        {justAdded ? "✓ Added to Cart!" : `Add Combo to Cart — ${formatZAR(priceCents * quantity)}`}
      </button>
    </div>
  );
}
