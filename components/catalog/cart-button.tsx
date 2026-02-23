// ============================================================
// Component — Floating Cart Button
// ============================================================
// Sticky button in the bottom-right corner showing cart count.
// Tapping opens the cart panel (slide-out drawer).
//
// DESIGN:
// - Only visible when cart has items
// - Bounces on add (draws attention)
// - Shows item count + total price
// - Mobile-friendly tap target (min 48px)
// ============================================================

"use client";

import { useState, useEffect, useRef } from "react";
import { useCart } from "@/lib/cart/cart-context";
import { formatZAR } from "@/types";
import { CartPanel } from "./cart-panel";

export function CartButton() {
  const { totalItems, totalPriceInCents } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [shouldBounce, setShouldBounce] = useState(false);
  const prevCount = useRef(totalItems);

  // Bounce animation when items are added
  useEffect(() => {
    if (totalItems > prevCount.current) {
      setShouldBounce(true);
      const timer = setTimeout(() => setShouldBounce(false), 600);
      return () => clearTimeout(timer);
    }
    prevCount.current = totalItems;
  }, [totalItems]);

  // Don't render if cart is empty
  if (totalItems === 0) return null;

  return (
    <>
      {/* ── Floating Button ──────────────────────────────── */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-3 bg-stone-900 hover:bg-stone-800 text-white pl-4 pr-5 py-3 rounded-2xl shadow-2xl shadow-stone-900/30 transition-all duration-300 hover:shadow-3xl active:scale-95 ${
            shouldBounce ? "animate-bounce" : ""
          }`}
        >
          {/* Cart icon */}
          <div className="relative">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
            {/* Count badge */}
            <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          </div>

          {/* Total price */}
          <div className="text-left">
            <div className="text-sm font-bold leading-none">
              {formatZAR(totalPriceInCents)}
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">
              View Cart
            </div>
          </div>
        </button>
      </div>

      {/* ── Cart Panel (Slide-out) ───────────────────────── */}
      <CartPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
