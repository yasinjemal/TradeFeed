// ============================================================
// Wishlist Types
// ============================================================
// Shared types for the client-side wishlist (favourites).
//
// DESIGN:
// - Wishlist is per-shop (scoped by shopSlug, like the cart)
// - Items keyed by productId (not variant — you favourite the product)
// - Client-only localStorage — no auth needed
// ============================================================

/**
 * A single item in the wishlist.
 */
export interface WishlistItem {
  productId: string;
  productName: string;
  imageUrl: string | null;
  priceInCents: number; // Min price across variants (for display)
  addedAt: number;      // Date.now() timestamp
}

/**
 * Wishlist context value exposed to components.
 */
export interface WishlistContextValue {
  items: WishlistItem[];
  /** Add a product to wishlist */
  addItem: (item: Omit<WishlistItem, "addedAt">) => void;
  /** Remove a product from wishlist */
  removeItem: (productId: string) => void;
  /** Toggle a product in/out of wishlist */
  toggleItem: (item: Omit<WishlistItem, "addedAt">) => void;
  /** Check if a product is in the wishlist */
  isInWishlist: (productId: string) => boolean;
  /** Total items in wishlist */
  count: number;
  /** Clear all items */
  clearWishlist: () => void;
}
