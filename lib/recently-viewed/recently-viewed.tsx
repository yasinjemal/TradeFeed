// ============================================================
// Recently Viewed — Client-Side Tracker
// ============================================================
// Tracks recently viewed products in localStorage, scoped by
// shopSlug. Provides a hook to read the list and a component
// to record a view.
//
// DESIGN:
// - Max 12 items per shop (older items drop off)
// - Deduplicates by productId (most-recent view wins)
// - No server round-trips — all localStorage
// ============================================================

"use client";

import { useEffect, useState, useCallback } from "react";

const MAX_ITEMS = 12;

interface RecentlyViewedProduct {
  productId: string;
  productName: string;
  imageUrl: string | null;
  priceInCents: number;
  viewedAt: number; // Date.now()
}

function storageKey(shopSlug: string): string {
  return `tradefeed_recent_${shopSlug}`;
}

function loadRecent(shopSlug: string): RecentlyViewedProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(shopSlug));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: unknown): item is RecentlyViewedProduct =>
        typeof item === "object" &&
        item !== null &&
        "productId" in item &&
        "productName" in item,
    );
  } catch {
    return [];
  }
}

function saveRecent(shopSlug: string, items: RecentlyViewedProduct[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(shopSlug), JSON.stringify(items));
  } catch {
    // fail silently
  }
}

/**
 * Records a product view. Call this in the product detail page.
 */
export function recordProductView(
  shopSlug: string,
  product: Omit<RecentlyViewedProduct, "viewedAt">,
): void {
  const items = loadRecent(shopSlug);
  // Remove if already exists (will re-add at top)
  const filtered = items.filter((i) => i.productId !== product.productId);
  // Add to front
  const updated = [{ ...product, viewedAt: Date.now() }, ...filtered].slice(
    0,
    MAX_ITEMS,
  );
  saveRecent(shopSlug, updated);
}

/**
 * Hook to read recently viewed products.
 */
export function useRecentlyViewed(shopSlug: string): {
  items: RecentlyViewedProduct[];
  clearAll: () => void;
} {
  const [items, setItems] = useState<RecentlyViewedProduct[]>([]);

  useEffect(() => {
    setItems(loadRecent(shopSlug));
  }, [shopSlug]);

  const clearAll = useCallback(() => {
    saveRecent(shopSlug, []);
    setItems([]);
  }, [shopSlug]);

  return { items, clearAll };
}

/**
 * Client component that records a product view on mount.
 * Drop this into the product detail page (server component).
 */
export function RecentlyViewedTracker({
  shopSlug,
  productId,
  productName,
  imageUrl,
  priceInCents,
}: {
  shopSlug: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  priceInCents: number;
}) {
  useEffect(() => {
    recordProductView(shopSlug, {
      productId,
      productName,
      imageUrl,
      priceInCents,
    });
  }, [shopSlug, productId, productName, imageUrl, priceInCents]);

  return null; // Invisible — just tracks the view
}
