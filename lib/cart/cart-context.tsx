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
    ).map((item) => ({
      ...item,
      // Migrate old cart items that don't have orderType
      orderType: item.orderType ?? "wholesale",
    }));
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
  retailWhatsappNumber?: string;
}

export function CartProvider({
  children,
  shopSlug,
  shopId,
  whatsappNumber,
  retailWhatsappNumber,
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

  /**
   * Unique key for a cart item — same variant can exist as wholesale AND retail.
   */
  function cartKey(variantId: string, orderType: string = "wholesale"): string {
    return `${variantId}__${orderType}`;
  }

  const addItem = useCallback(
    (newItem: Omit<CartItem, "quantity">, quantity = 1) => {
      const isRetail = newItem.orderType === "retail";
      const minQty = isRetail ? 1 : (newItem.minWholesaleQty ?? 1);
      const key = cartKey(newItem.variantId, newItem.orderType);

      setItems((prev) => {
        const existing = prev.find(
          (item) => cartKey(item.variantId, item.orderType) === key
        );

        if (existing) {
          // Increment quantity, cap at maxStock, floor at minimum
          const newQty = Math.min(
            existing.quantity + quantity,
            existing.maxStock
          );
          return prev.map((item) =>
            cartKey(item.variantId, item.orderType) === key
              ? { ...item, quantity: Math.max(newQty, minQty) }
              : item
          );
        }

        // Add new item: start at minimum, cap at maxStock
        const startQty = Math.max(quantity, minQty);
        return [
          ...prev,
          { ...newItem, quantity: Math.min(startQty, newItem.maxStock) },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((variantId: string, orderType?: string) => {
    setItems((prev) => {
      if (orderType) {
        const key = cartKey(variantId, orderType);
        return prev.filter((item) => cartKey(item.variantId, item.orderType) !== key);
      }
      // Backward compat: remove by variantId only
      return prev.filter((item) => item.variantId !== variantId);
    });
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number, orderType?: string) => {
    setItems((prev) => {
      const item = orderType
        ? prev.find((i) => cartKey(i.variantId, i.orderType) === cartKey(variantId, orderType))
        : prev.find((i) => i.variantId === variantId);
      if (!item) return prev;

      const isRetail = item.orderType === "retail";
      const minQty = isRetail ? 1 : (item.minWholesaleQty ?? 1);

      // If quantity drops below minimum, remove the item entirely
      if (quantity < minQty) {
        const key = cartKey(item.variantId, item.orderType);
        return prev.filter((i) => cartKey(i.variantId, i.orderType) !== key);
      }
      const key = cartKey(item.variantId, item.orderType);
      return prev.map((i) =>
        cartKey(i.variantId, i.orderType) === key
          ? { ...i, quantity: Math.min(quantity, i.maxStock) }
          : i
      );
    });
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
      retailWhatsappNumber,
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
      retailWhatsappNumber,
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
