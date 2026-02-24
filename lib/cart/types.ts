// ============================================================
// Cart Types
// ============================================================
// Shared types for the client-side shopping cart.
//
// DESIGN:
// - Cart is per-shop (scoped by shopSlug)
// - Items keyed by variantId (unique size+color per product)
// - Prices in cents (ZAR) — consistent with DB
// - Quantities are positive integers
// ============================================================

/**
 * A single item in the cart.
 * Keyed by variantId — each size/color combo is a separate line item.
 */
export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  color: string | null;
  priceInCents: number;
  quantity: number;
  maxStock: number; // Prevents over-ordering
}

/**
 * Full cart state.
 */
export interface CartState {
  items: CartItem[];
  shopSlug: string;
}

/**
 * Cart context value exposed to components.
 */
export interface CartContextValue {
  items: CartItem[];
  /** Add an item or increment quantity if already in cart */
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  /** Remove an item entirely */
  removeItem: (variantId: string) => void;
  /** Update quantity for a specific item */
  updateQuantity: (variantId: string, quantity: number) => void;
  /** Clear all items */
  clearCart: () => void;
  /** Total number of items (sum of quantities) */
  totalItems: number;
  /** Total price in cents */
  totalPriceInCents: number;
  /** WhatsApp number for checkout */
  whatsappNumber: string;
  /** Shop slug for localStorage scoping */
  shopSlug: string;
  /** Shop ID for analytics tracking */
  shopId: string;
}
