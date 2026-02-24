// ============================================================
// Component — Wishlist Heart Button
// ============================================================
// A small heart icon that toggles a product in/out of the
// wishlist. Used on product cards and product detail pages.
//
// DESIGN:
// - Outlined heart = not in wishlist
// - Filled red heart = in wishlist
// - Click animates with a scale bounce
// - Prevents event propagation (so clicking heart on a
//   <Link>-wrapped card doesn't navigate)
// ============================================================

"use client";

import { useWishlist } from "@/lib/wishlist/wishlist-context";

interface WishlistHeartProps {
  productId: string;
  productName: string;
  imageUrl: string | null;
  priceInCents: number;
  className?: string;
}

export function WishlistHeart({
  productId,
  productName,
  imageUrl,
  priceInCents,
  className = "",
}: WishlistHeartProps) {
  const { toggleItem, isInWishlist } = useWishlist();
  const active = isInWishlist(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleItem({ productId, productName, imageUrl, priceInCents });
      }}
      className={`group/heart flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
        active
          ? "bg-red-50 text-red-500 shadow-sm"
          : "bg-white/80 backdrop-blur-sm text-stone-400 hover:text-red-400 hover:bg-white shadow-sm"
      } ${className}`}
      title={active ? "Remove from favourites" : "Add to favourites"}
      aria-label={active ? "Remove from favourites" : "Add to favourites"}
    >
      <svg
        className={`w-4 h-4 transition-transform duration-200 group-active/heart:scale-125 ${
          active ? "scale-110" : ""
        }`}
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}
