// ============================================================
// Cart Context — Client-Side State
// ============================================================
// React context for the shopping cart. Persists to localStorage
// per shop slug so each shop's cart is independent.
//
// WHY CLIENT-SIDE:
// - No server round-trips for add/remove (instant UX)
// - No auth needed (buyers aren't logged in)
// - localStorage survives page refreshes
// - Scoped by shopSlug — browsing two shops = two carts
//
// RULES:
// - Quantities capped at maxStock (no over-ordering)
// - Prices stored as cents (ZAR)
// - Cart clears on checkout (after WhatsApp opens)
// ============================================================

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartContextValue, CartItem } from "./types";

const CartContext = createContext<CartContextValue | null>(null);

// localStorage key factory — each shop gets its own cart
function storageKey(shopSlug: string): string {
  return `tradefeed_cart_${shopSlug}`;
}

/**
 * Load cart items from localStorage.
 * Returns empty array if nothing found or data is corrupted.
 */
function loadCart(shopSlug: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(shopSlug));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Basic shape validation — don't crash on corrupted data
    return parsed.filter(
      (item: unknown): item is CartItem =>
        typeof item === "object" &&
        item !== null &&
        "variantId" in item &&
        "productId" in item &&
        "productName" in item &&
        "priceInCents" in item &&
        "quantity" in item
    );
  } catch {
    return [];
  }
}

/**
 * Save cart items to localStorage.
 */
function saveCart(shopSlug: string, items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(shopSlug), JSON.stringify(items));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

// ================================================================
// Provider
// ================================================================

interface CartProviderProps {
  children: React.ReactNode;
  shopSlug: string;
  shopId: string;
  whatsappNumber: string;
}

export function CartProvider({
  children,
  shopSlug,
  shopId,
  whatsappNumber,
}: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    setItems(loadCart(shopSlug));
    setIsHydrated(true);
  }, [shopSlug]);

  // Persist to localStorage on every change (after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveCart(shopSlug, items);
    }
  }, [items, shopSlug, isHydrated]);

  const addItem = useCallback(
    (newItem: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find(
          (item) => item.variantId === newItem.variantId
        );

        if (existing) {
          // Increment quantity, cap at maxStock
          const newQty = Math.min(
            existing.quantity + quantity,
            existing.maxStock
          );
          return prev.map((item) =>
            item.variantId === newItem.variantId
              ? { ...item, quantity: newQty }
              : item
          );
        }

        // Add new item, cap quantity at maxStock
        return [
          ...prev,
          { ...newItem, quantity: Math.min(quantity, newItem.maxStock) },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((item) => item.variantId !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.variantId !== variantId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.min(quantity, item.maxStock) }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalPriceInCents = useMemo(
    () => items.reduce((sum, item) => sum + item.priceInCents * item.quantity, 0),
    [items]
  );

  const value: CartContextValue = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPriceInCents,
      whatsappNumber,
      shopSlug,
      shopId,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPriceInCents,
      whatsappNumber,
      shopSlug,
      shopId,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ================================================================
// Hook
// ================================================================

/**
 * Access cart state and actions.
 * Must be used within a CartProvider.
 */
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
