// ============================================================
// Offline Catalog Cache — IndexedDB
// ============================================================
// Caches product and shop data in IndexedDB for offline browsing.
// When a buyer visits a catalog page, products are cached locally.
// If they go offline (load shedding, bad signal), cached data is served.
//
// Storage: IndexedDB "tradefeed-catalog" database
// Stores: "products", "shops"
// TTL: 24 hours (stale data is refreshed on next online visit)
// ============================================================

const DB_NAME = "tradefeed-catalog";
const DB_VERSION = 1;
const PRODUCTS_STORE = "products";
const SHOPS_STORE = "shops";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedProduct {
  id: string;
  shopId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  minPriceCents: number;
  maxPriceCents: number;
  variants: {
    id: string;
    size: string;
    color: string | null;
    priceInCents: number;
    stock: number;
  }[];
  cachedAt: number;
}

export interface CachedShop {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  whatsappNumber: string;
  cachedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
        const productStore = db.createObjectStore(PRODUCTS_STORE, { keyPath: "id" });
        productStore.createIndex("shopId", "shopId", { unique: false });
        productStore.createIndex("cachedAt", "cachedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(SHOPS_STORE)) {
        db.createObjectStore(SHOPS_STORE, { keyPath: "slug" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheProducts(products: CachedProduct[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(PRODUCTS_STORE, "readwrite");
    const store = tx.objectStore(PRODUCTS_STORE);
    const now = Date.now();

    for (const product of products) {
      store.put({ ...product, cachedAt: now });
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IndexedDB may not be available in all environments
  }
}

export async function getCachedProducts(shopId: string): Promise<CachedProduct[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(PRODUCTS_STORE, "readonly");
    const store = tx.objectStore(PRODUCTS_STORE);
    const index = store.index("shopId");

    return new Promise((resolve, reject) => {
      const request = index.getAll(shopId);
      request.onsuccess = () => {
        const products = request.result as CachedProduct[];
        const cutoff = Date.now() - CACHE_TTL_MS;
        resolve(products.filter((p) => p.cachedAt > cutoff));
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function cacheShop(shop: CachedShop): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(SHOPS_STORE, "readwrite");
    tx.objectStore(SHOPS_STORE).put({ ...shop, cachedAt: Date.now() });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silently fail — offline cache is a nice-to-have
  }
}

export async function getCachedShop(slug: string): Promise<CachedShop | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(SHOPS_STORE, "readonly");

    return new Promise((resolve, reject) => {
      const request = tx.objectStore(SHOPS_STORE).get(slug);
      request.onsuccess = () => {
        const shop = request.result as CachedShop | undefined;
        if (!shop || shop.cachedAt < Date.now() - CACHE_TTL_MS) {
          resolve(null);
          return;
        }
        resolve(shop);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function clearExpiredCache(): Promise<void> {
  try {
    const db = await openDB();
    const cutoff = Date.now() - CACHE_TTL_MS;

    const tx = db.transaction(PRODUCTS_STORE, "readwrite");
    const store = tx.objectStore(PRODUCTS_STORE);
    const index = store.index("cachedAt");

    const range = IDBKeyRange.upperBound(cutoff);
    const request = index.openCursor(range);

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Cleanup is best-effort
  }
}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}
