// ============================================================
// Component — Floating Wishlist Button
// ============================================================
// Small heart button in the bottom-left corner showing count.
// Tapping opens the wishlist panel (slide-out drawer).
//
// DESIGN:
// - Only visible when wishlist has items
// - Shows heart icon + count badge
// - Mobile-friendly tap target
// ============================================================

"use client";

import { useState } from "react";
import { useWishlist } from "@/lib/wishlist/wishlist-context";
import { WishlistPanel } from "./wishlist-panel";

interface WishlistButtonProps {
  shopSlug: string;
}

export function WishlistButton({ shopSlug }: WishlistButtonProps) {
  const { count } = useWishlist();
  const [isOpen, setIsOpen] = useState(false);

  // Don't render if wishlist is empty
  if (count === 0) return null;

  return (
    <>
      {/* ── Floating Button (above bottom nav) ────────────── */}
      <div className="fixed bottom-[4.5rem] left-3 sm:left-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-white hover:bg-stone-50 text-stone-700 pl-3 pr-3.5 py-2 rounded-2xl shadow-lg shadow-stone-200/40 border border-stone-200/60 transition-all duration-200 active:scale-95"
        >
          {/* Heart icon */}
          <div className="relative">
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            {/* Count badge */}
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {count > 99 ? "99+" : count}
            </span>
          </div>

          {/* Label */}
          <span className="text-xs font-semibold">
            Favourites
          </span>
        </button>
      </div>

      {/* ── Wishlist Panel (Slide-out) ───────────────────── */}
      <WishlistPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        shopSlug={shopSlug}
      />
    </>
  );
}
