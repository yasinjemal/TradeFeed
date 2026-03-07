// ============================================================
// Catalog Cache Manager — Silent IndexedDB Caching
// ============================================================
// Mounted inside the catalog layout. When the page loads with
// fresh server-rendered products, it caches them in IndexedDB
// for offline browsing later.
//
// This component renders nothing — it's a pure side-effect.
// ============================================================

"use client";

import { useEffect } from "react";
import {
  cacheProducts,
  cacheShop,
  clearExpiredCache,
  type CachedProduct,
  type CachedShop,
} from "@/lib/offline/catalog-cache";

interface CatalogCacheManagerProps {
  shop: CachedShop;
  products: CachedProduct[];
}

export function CatalogCacheManager({ shop, products }: CatalogCacheManagerProps) {
  useEffect(() => {
    // Only cache when online — we're reading fresh server data
    if (typeof navigator === "undefined" || !navigator.onLine) return;

    // Fire-and-forget — never block rendering
    cacheShop(shop).catch(() => {});
    cacheProducts(products).catch(() => {});
    clearExpiredCache().catch(() => {});
  }, [shop, products]);

  return null; // pure side-effect component
}
