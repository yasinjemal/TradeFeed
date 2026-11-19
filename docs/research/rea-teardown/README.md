# Takealot vs TradeFeed page teardown (REA)

Captured 2026-11-19 with [REA](https://github.com/morluto/rea) 6.9.0 driving a separate Chrome
window over its local debug port.

## How each page was measured

`run-teardown.mjs` does the same thing for every URL:

1. Starts Chrome with a brand-new throwaway profile (nothing cached, no cookies), 1440×900.
2. REA navigates to the URL and records every network request for 8 seconds. No scrolling, no clicks.
3. REA inspects the loaded page: DOM, scripts, resources with sizes, storage key names.
4. Chrome and the profile are deleted.

`compare-teardown.mjs` turns the captures into `metrics.json` and the table below.

Limits to keep in mind:

- One run per page, from one machine, on one day.
- Desktop viewport only. Mobile was not measured.
- Sizes are uncompressed content sizes, not bytes over the wire.
- REA keeps header names but not header values, and no request or response bodies.
- "First byte" for TradeFeed was measured separately with `curl`, three runs per page. It was not measured for Takealot.

## Results

| Metric | Takealot home | Takealot product | TradeFeed home | TradeFeed marketplace | TradeFeed product |
|---|---|---|---|---|---|
| Requests during capture | 338 | 297 | 96 | 109 | 71 |
| Third-party hosts contacted | 34 | 37 | 0 | 1 | 2 |
| Page weight, uncompressed | 15.1 MB | 15.6 MB | 2.8 MB | 3.5 MB | 2.8 MB |
| JavaScript, uncompressed | 13.1 MB | 14.5 MB | 2.3 MB | 2.9 MB | 2.3 MB |
| of which third-party script | 2.8 MB | 3.3 MB | 0 | 0 | 0 |
| CSS, uncompressed | 253 KB | 253 KB | 367 KB | 340 KB | 340 KB |
| Images loaded (median size) | 110 (9 KB) | 63 (6 KB) | 9 (7 KB) | 24 (11 KB) | 2 (24 KB) |
| HTML document finished after | 0.33 s | 0.44 s | 4.2 s | 4.6 s | 3.7 s |
| Server first byte (curl, 3 runs) | not measured | not measured | 3.3–3.6 s | 0.47–0.53 s | 1.2–1.3 s |
| DOM nodes | 9,347 | 5,220 | 1,223 | 1,318 | 945 |
| `h1` elements | 0 | 2 | 1 | 1 | 1 |
| `img` tags with `fetchpriority` | 15 of 337 | 2 of 113 | 0 of 37 | 0 of 25 | 0 of 11 |
| Offline cache (Cache Storage) | none | none | `tradefeed-v6` | `tradefeed-v6` | `tradefeed-v6` |

## Findings

### Where TradeFeed is behind

1. **Server response time.** Every TradeFeed page tested came back with
   `Cache-Control: private, no-cache, no-store` and `X-Vercel-Cache: MISS`. The pages declare
   `revalidate` (300 s on `/` and `/marketplace`, 60 s on the product page), but
   `app/layout.tsx` reads request headers for the CSP nonce, which makes every route render
   per request. Takealot's document response carries `cf-cache-status` and
   `x-nextjs-postponed` headers and finishes in under half a second.
2. **Route prefetching.** The homepage fired 36 route-data requests across 19 routes during the
   capture, and the slowest took 2.6–3.2 s each. Eight of them used `/marketplace?category=…`
   links that answer with a 301 redirect first.
3. **Sign-in library on public pages.** Clerk's scripts are 1,026 KB uncompressed on every page
   tested, 36–46% of all JavaScript, plus two Clerk API calls for a signed-out visitor.
4. **No priority hint on the main product image.** No `img` on the product page carries
   `fetchpriority`.
5. **Stylesheet size.** One 334 KB stylesheet, larger than all of Takealot's CSS.
6. **Shop theme font from Google Fonts.** By design in `app/catalog/[slug]/layout.tsx`; it adds a
   third-party connection on product pages. It also appeared on `/marketplace`; cause not traced.

### Where TradeFeed is ahead

- About 5× lighter and 3–4× fewer requests.
- Almost no third parties, against 34–37 hosts on Takealot.
- Every image is AVIF through the Next.js image route with `srcset`.
- An offline cache; Takealot has none.
- Exactly one `h1` per page.

### Worth borrowing from Takealot

- A cached page shell with the personal parts streamed in afterwards.
- Site-wide guest memory (recently viewed, recent searches). TradeFeed keeps cart, wishlist and
  recently viewed per shop (`tradefeed_recent_<shop>`), not across the marketplace.
- Explicit priority on the first images.
- Deeper product pages: 55 product cards on Takealot's product page against 8 on TradeFeed's.
- Local payment and trust logos in the footer.

### Not worth copying

- 13–14.5 MB of JavaScript and 34–37 third-party hosts per page.

## Files

- `takealot/`, `tradefeed/`: `<page>-load.json` is the network recording, `<page>-page.json` the
  page inspection, `<page>-load-scenario-input.json` the exact request given to REA.
- `takealot/home-*.json`: the first, warm-cache pass on Takealot's homepage, kept for reference.
- `metrics.json`: every number in the table, plus per-page detail.
- `summarize-page.mjs`: prints a digest of a single `*-page.json`.
