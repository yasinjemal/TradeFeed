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
import {
  addToWishlistAction,
  removeFromWishlistAction,
  getWishlistItemsAction,
} from "@/app/actions/wishlist";

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
  shopId?: string;
}

export function WishlistProvider({ children, shopSlug, shopId }: WishlistProviderProps) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    setItems(loadWishlist(shopSlug));
  }, [shopSlug]);

  // Merge DB wishlist items on mount (signed-in users get cross-device sync)
  useEffect(() => {
    if (!shopId) return;
    let cancelled = false;
    getWishlistItemsAction(shopId).then((result) => {
      if (cancelled || !result.success) return;
      const dbProductIds = new Set(result.productIds);
      if (dbProductIds.size === 0) return;
      setItems((prev) => {
        // Sync localStorage items to DB (fire-and-forget)
        for (const item of prev) {
          if (!dbProductIds.has(item.productId)) {
            void addToWishlistAction({
              productId: item.productId,
              shopId: shopId!,
              productName: item.productName,
              imageUrl: item.imageUrl,
            });
          }
        }
        // Add DB-only items to local state (items that exist in DB but not localStorage)
        const localIds = new Set(prev.map((i) => i.productId));
        const newFromDb = result.productIds
          .filter((id) => !localIds.has(id))
          .map((productId) => ({
            productId,
            productName: "",
            imageUrl: null,
            priceInCents: 0,
            addedAt: Date.now(),
          }));
        return newFromDb.length > 0 ? [...prev, ...newFromDb] : prev;
      });
    });
    return () => { cancelled = true; };
  }, [shopId]);

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
      // Fire-and-forget server sync
      if (shopId) {
        void addToWishlistAction({
          productId: item.productId,
          shopId,
          productName: item.productName,
          imageUrl: item.imageUrl,
        });
      }
    },
    [shopId],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    // Fire-and-forget server sync
    void removeFromWishlistAction(productId);
  }, []);

  const toggleItem = useCallback(
    (item: Omit<WishlistItem, "addedAt">) => {
      let removed = false;
      setItems((prev) => {
        const exists = prev.some((i) => i.productId === item.productId);
        if (exists) {
          removed = true;
          return prev.filter((i) => i.productId !== item.productId);
        }
        return [...prev, { ...item, addedAt: Date.now() }];
      });
      // Fire-and-forget server sync — must be OUTSIDE the updater
      // to avoid "Cannot update Router while rendering WishlistProvider"
      if (removed) {
        void removeFromWishlistAction(item.productId);
      } else if (shopId) {
        void addToWishlistAction({
          productId: item.productId,
          shopId,
          productName: item.productName,
          imageUrl: item.imageUrl,
        });
      }
    },
    [shopId],
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
