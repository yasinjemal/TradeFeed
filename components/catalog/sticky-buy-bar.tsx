"use client";

import { useState, useEffect } from "react";
import { formatZAR } from "@/types";

interface StickyBuyBarProps {
  productName: string;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
}

/**
 * Persistent sticky mobile buy bar — always visible on mobile when
 * the user scrolls past the product info section.
 * Shows price + "Select options" CTA that scrolls to the variant picker.
 */
export function StickyBuyBar({ productName, minPrice, maxPrice, totalStock }: StickyBuyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 400px (past the image gallery)
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible || totalStock === 0) return null;

  const scrollToCart = () => {
    const el = document.getElementById("add-to-cart");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-2.5 shadow-sm sm:hidden animate-in slide-in-from-top-2 duration-200"
    >
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{productName}</p>
          <p className="text-sm font-bold text-emerald-600">
            {minPrice === maxPrice ? formatZAR(minPrice) : `${formatZAR(minPrice)} – ${formatZAR(maxPrice)}`}
          </p>
        </div>
        <button
          onClick={scrollToCart}
          className="flex-shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98]"
          style={{ backgroundColor: "var(--shop-primary, #1c1917)" }}
        >
          Select Options
        </button>
      </div>
    </div>
  );
}
