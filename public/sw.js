// ============================================================
// Service Worker — TradeFeed PWA
// ============================================================
// Enhanced service worker for:
// - PWA installability
// - Offline fallback page
// - Stale-while-revalidate for catalog pages (fast revisits)
// - Cache-first for product images (utfs.io / ufs.sh)
// - Cache static assets for fast repeat loads
// - Resilience during SA load shedding
// ============================================================

const CACHE_NAME = "tradefeed-v2";
const OFFLINE_URL = "/offline.html";
const IMAGE_CACHE = "tradefeed-images-v1";
const PAGE_CACHE = "tradefeed-pages-v1";

// Max entries per cache (prevent unbounded growth)
const MAX_IMAGE_ENTRIES = 200;
const MAX_PAGE_ENTRIES = 50;

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  OFFLINE_URL,
];

// Install: pre-cache offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  const VALID_CACHES = [CACHE_NAME, IMAGE_CACHE, PAGE_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !VALID_CACHES.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Helper: trim cache to max entries (FIFO)
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await Promise.all(
      keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key))
    );
  }
}

// Helper: check if URL is a product image (utfs.io / ufs.sh)
function isProductImage(url) {
  return (
    url.hostname === "utfs.io" ||
    url.hostname.endsWith(".ufs.sh") ||
    url.hostname === "images.unsplash.com"
  );
}

// Helper: check if URL is a catalog/marketplace page
function isCatalogPage(url) {
  return (
    url.pathname.startsWith("/catalog/") ||
    url.pathname.startsWith("/marketplace")
  );
}

// Fetch: strategy per request type
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // ── Catalog / Marketplace navigation: Stale-While-Revalidate ──
  // Serve cached page instantly, then update cache in background.
  // Perfect for SA networks where latency can be high.
  if (event.request.mode === "navigate" && isCatalogPage(url)) {
    event.respondWith(
      caches.open(PAGE_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          const networkFetch = fetch(event.request)
            .then((response) => {
              if (response.ok) {
                cache.put(event.request, response.clone());
                trimCache(PAGE_CACHE, MAX_PAGE_ENTRIES);
              }
              return response;
            })
            .catch(() => cached || caches.match(OFFLINE_URL));

          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // ── Other navigation: Network-first with offline fallback ──
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // ── Product images (utfs.io / ufs.sh): Cache-first ──
  // These are immutable (content-addressed), so cache-first is safe.
  if (event.request.destination === "image" && isProductImage(url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(event.request).then(
          (cached) =>
            cached ||
            fetch(event.request).then((response) => {
              if (response.ok) {
                cache.put(event.request, response.clone());
                trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES);
              }
              return response;
            })
        )
      )
    );
    return;
  }

  // ── Static assets: cache-first strategy ──
  if (
    event.request.destination === "image" ||
    event.request.destination === "style" ||
    event.request.destination === "script" ||
    event.request.destination === "font"
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
      )
    );
    return;
  }
});
