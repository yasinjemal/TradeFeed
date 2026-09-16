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

const CACHE_NAME = "tradefeed-v6";
const OFFLINE_URL = "/offline.html";
const IMAGE_CACHE = "tradefeed-images-v1";


// Max entries per cache (prevent unbounded growth)
const MAX_IMAGE_ENTRIES = 200;




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
  const VALID_CACHES = [CACHE_NAME, IMAGE_CACHE];
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

// Helper: guaranteed offline response (even if offline.html isn't cached)
function offlineResponse() {
  return caches.match(OFFLINE_URL).then(
    (cached) =>
      cached ||
      new Response(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — TradeFeed</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fafaf9;color:#292524;padding:24px;text-align:center}.c{max-width:400px}.icon{font-size:64px;margin-bottom:16px}h1{font-size:20px;font-weight:700;margin-bottom:8px}p{font-size:14px;color:#78716c;margin-bottom:24px}a{display:inline-block;padding:12px 24px;background:#10b981;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px}</style></head><body><div class="c"><div class="icon">📡</div><h1>You\'re offline</h1><p>Check your internet connection and try again. Your data is safe.</p><a href="/">Try Again</a></div></body></html>',
        { status: 503, headers: { "Content-Type": "text/html" } }
      )
  );
}

// Fetch: strategy per request type
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (["localhost", "127.0.0.1"].includes(url.hostname)) return;
  if (event.request.method !== "GET") return;

  // Skip non-http(s) requests (chrome-extension://, etc.)
  if (!url.protocol.startsWith("http")) return;

  // Never cache HTML or RSC: they may include buyer defaults and fresh stock.
  // ── Other navigation: Network-first with offline fallback ──
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => offlineResponse())
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

  if (event.request.headers.get("RSC") === "1") return;

  // ── Static assets: cache-first strategy ──
  if (
    url.origin === self.location.origin &&
    (event.request.destination === "image" ||
      event.request.destination === "style" ||
      event.request.destination === "script" ||
      event.request.destination === "font")
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
