// ============================================================
// Wishlist Context — Client-Side State
// ============================================================
// React context for buyer favourites. Persists to localStorage
// per shop slug so each shop's wishlist is independent.
//
// WHY CLIENT-SIDE:
// - No server round-trips for add/remove (instant UX)
// - No auth needed (buyers aren't logged in)
// - localStorage survives page refreshes
// - Scoped by shopSlug — browsing two shops = two wishlists
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
import type { WishlistContextValue, WishlistItem } from "./types";

const WishlistContext = createContext<WishlistContextValue | null>(null);

// localStorage key factory — each shop gets its own wishlist
function storageKey(shopSlug: string): string {
  return `tradefeed_wishlist_${shopSlug}`;
}

/**
 * Load wishlist items from localStorage.
 */
function loadWishlist(shopSlug: string): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(shopSlug));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: unknown): item is WishlistItem =>
        typeof item === "object" &&
        item !== null &&
        "productId" in item &&
        "productName" in item,
    );
  } catch {
    return [];
  }
}

/**
 * Save wishlist items to localStorage.
 */
function saveWishlist(shopSlug: string, items: WishlistItem[]): void {
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

interface WishlistProviderProps {
  children: React.ReactNode;
  shopSlug: string;
}

export function WishlistProvider({ children, shopSlug }: WishlistProviderProps) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    setItems(loadWishlist(shopSlug));
  }, [shopSlug]);

  // Persist to localStorage on change
  useEffect(() => {
    saveWishlist(shopSlug, items);
  }, [shopSlug, items]);

  const addItem = useCallback(
    (item: Omit<WishlistItem, "addedAt">) => {
      setItems((prev) => {
        // Don't add if already in wishlist
        if (prev.some((i) => i.productId === item.productId)) return prev;
        return [...prev, { ...item, addedAt: Date.now() }];
      });
    },
    [],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const toggleItem = useCallback(
    (item: Omit<WishlistItem, "addedAt">) => {
      setItems((prev) => {
        const exists = prev.some((i) => i.productId === item.productId);
        if (exists) {
          return prev.filter((i) => i.productId !== item.productId);
        }
        return [...prev, { ...item, addedAt: Date.now() }];
      });
    },
    [],
  );

  const isInWishlist = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items],
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      addItem,
      removeItem,
      toggleItem,
      isInWishlist,
      count: items.length,
      clearWishlist,
    }),
    [items, addItem, removeItem, toggleItem, isInWishlist, clearWishlist],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

// ================================================================
// Hook
// ================================================================

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within a <WishlistProvider>");
  }
  return ctx;
}
