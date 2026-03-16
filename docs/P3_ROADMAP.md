# TradeFeed — P3 Roadmap (Future Implementation)

> Priority 3 enhancements identified during the Feb 2026 site audit.
> P1 (critical) and P2 (important) items are complete — see commit `e852f3f`.
> These P3 items are **nice-to-haves** that improve performance, UX, and revenue.
> Last updated: **2026-02-26**

---

## Status Key

| Icon | Meaning |
|------|---------|
| ⬜ | Not started |
| 🔵 | In progress |
| ✅ | Complete |

---

## 1. Performance & Infrastructure

### 1.1 ✅ Upstash Redis Rate Limiter

**Current:** Upstash Redis rate limiter in production, in-memory fallback for local dev.
**Goal:** Swap to [Upstash Redis](https://upstash.com/) for persistent, multi-instance rate limiting.

- ✅ `lib/rate-limit-upstash.ts` with `@upstash/ratelimit` + `@upstash/redis`
- ✅ Three named limiters: catalog (60/min), api (30/min), action (10/min)
- ✅ Graceful in-memory fallback when Upstash env vars missing (local dev)

### 1.2 ✅ ISR / Static Generation for High-Traffic Pages

**Current:** All catalog and marketplace pages are fully dynamic (server-rendered on every request).
**Goal:** Use Incremental Static Regeneration (ISR) for pages that don't change often.

- `/marketplace` — `revalidate: 300` (5 min)
- `/catalog/[slug]` — `revalidate: 60` (1 min)
- `/catalog/[slug]/products/[productId]` — `revalidate: 60`
- Invalidate on product create/update/delete via `revalidatePath()`
- Estimated effort: **2–3 hours**

### 1.3 ✅ Edge Runtime for Middleware

**Current:** Middleware runs on Edge Runtime.
**Goal:** Move to Edge Runtime for lower latency on Vercel (already compatible — Clerk middleware supports Edge).

- ✅ `middleware.ts` has `export const runtime = "edge"`
- ✅ Upstash Redis (Edge-compatible) used for rate limiting

### 1.4 ✅ Image Placeholder Blur (Shimmer)

**Current:** ~~`next/image` uses default loading (grey box → image pop-in).~~
**Goal:** Smooth loading experience for all buyer-facing images.

**Implementation (complete):**
- Uses animated SVG shimmer placeholders (`SHIMMER_LIGHT` / `SHIMMER_DARK`) from `lib/image-placeholder.ts`
- Applied `placeholder="blur"` + `blurDataURL` to all 9 buyer-facing image components:
  - Product gallery, catalog search cards, combo section, marketplace cards (existing)
  - Recently-viewed strip, wishlist panel, cart panel, shop banner/gallery, featured shop cards (added)
- Estimated effort: **3–4 hours** (schema migration + upload hook + component updates)

### 1.5 ✅ Service Worker Cache Strategy

**Current:** SW just serves `offline.html` on network failure.
**Goal:** Implement stale-while-revalidate for catalog pages + cache product images.

- File: `public/sw.js`
- Cache: `/catalog/*` HTML, product images from `utfs.io`
- Strategy: Network-first for HTML, cache-first for images
- Estimated effort: **2–3 hours**

---

## 2. Security & Compliance

### 2.1 ✅ CSP Nonce for Inline Scripts

**Current:** CSP uses per-request nonces for inline scripts — `'unsafe-inline'` removed from `script-src`.
**Goal:** Generate per-request nonces in middleware, inject into `<Script>` tags.

- ✅ Middleware generates `crypto.randomUUID()` nonce per request, sets as `x-nonce` header
- ✅ Full CSP header built manually with `'nonce-{value}'` + `'strict-dynamic'` in `script-src`
- ✅ Removed `'unsafe-inline'` from `script-src` (kept for `style-src` — required by React inline styles)
- ✅ Layout reads nonce from `headers()`, passes to GA4 + SW `<Script nonce={nonce}>` tags
- ✅ Removed Clerk `contentSecurityPolicy` option (CSP now fully managed in middleware)
- ✅ Added Clerk domains (`*.clerk.accounts.dev`, `*.clerk.com`, `img.clerk.com`) to relevant directives
- Files: `middleware.ts`, `app/layout.tsx`

### 2.2 ✅ POPIA Data Retention Automation

**Current:** Privacy policy states data retention rules but no automated cleanup.
**Goal:** Scheduled job to purge old PII (buyer phone numbers) from orders older than 24 months.

- Cron job (Vercel Cron or GitHub Actions) → API route `/api/cron/data-retention`
- Query: `UPDATE Order SET buyerPhone = NULL, buyerName = NULL WHERE createdAt < NOW() - INTERVAL '24 months'`
- Log audit trail
- Estimated effort: **2–3 hours**

### 2.3 ✅ Subresource Integrity (SRI) for External Scripts

**Current:** Only external script is Google Tag Manager (dynamically served, hash changes frequently).
**Goal:** Add `integrity` attribute to external `<Script>` tags where possible.

- ⚠️ SRI not feasible for GTM — Google serves different content per request/version
- ✅ Mitigated via CSP nonce (P3 2.1): `'strict-dynamic'` + per-request nonces ensure only authorized scripts execute
- ✅ GTM domain allowlisted in `script-src` CSP directive
- No other external scripts in the app — SRI not applicable

---

## 3. SEO & Discoverability

### 3.1 ✅ Structured Data for Products (JSON-LD Enhancement)

**Current:** JSON-LD on product detail pages covers basic `Product` schema.
**Goal:** Add `AggregateOffer`, `AggregateRating`, `Review`, and `Brand` to product JSON-LD.

- File: `app/catalog/[slug]/products/[productId]/page.tsx`
- Add `offers.priceCurrency: "ZAR"`, `offers.availability`, `aggregateRating`
- Estimated effort: **1–2 hours**

### 3.2 ✅ Breadcrumb JSON-LD

**Current:** No breadcrumb structured data.
**Goal:** Add `BreadcrumbList` schema to catalog and product pages.

- `/catalog/[slug]` → Home > Marketplace > Shop Name
- `/catalog/[slug]/products/[productId]` → Home > Marketplace > Shop > Product
- Estimated effort: **1 hour**

### 3.3 ✅ Per-Shop OG Images

**Current:** Shops share the generic TradeFeed OG image.
**Goal:** Generate per-shop OG images with shop name, logo, product count.

- Extend `/api/og` route to accept `shopSlug` param
- Add `openGraph` metadata to `app/catalog/[slug]/layout.tsx`
- Estimated effort: **1–2 hours**

### 3.4 ✅ Canonical URLs

**Current:** No explicit canonical tags.
**Goal:** Add `alternates.canonical` to metadata on all pages to prevent duplicate content.

- Files: layout.tsx, page.tsx for each route
- Estimated effort: **1 hour**

---

## 4. UX & Buyer Experience

### 4.1 ⬜ WhatsApp Business API Integration

**Current:** Orders open `wa.me` links (client-side redirect).
**Goal:** Send automated order confirmations + status updates via WhatsApp Cloud API.

- Meta Business verification required
- Use official WhatsApp Cloud API (not third-party)
- Message templates: order confirmation, dispatch notification, delivery update
- File: `lib/whatsapp/cloud-api.ts`
- Env vars: `WHATSAPP_BUSINESS_PHONE_ID`, `WHATSAPP_ACCESS_TOKEN`
- **High effort: 1–2 days** (Meta verification + template approval + implementation)

### 4.2 ✅ Buyer Account & Order History

**Current:** ~~Buyers browse as guests. Wishlist + recently viewed use localStorage.~~
**Goal:** Optional Clerk sign-in for buyers to see order history, persistent wishlist.

**Implementation (complete):**
- Added `buyerClerkId String?` to Order model + index
- Checkout auto-attaches Clerk userId when buyer is signed in
- Created `/orders` page — shows full order history for signed-in buyers, sign-in CTA for guests
- Created `BuyerOrderList` component with filter tabs, expandable order cards, shop links
- Added `getBuyerOrders()` to data access layer (includes shop info + items)
- Updated bottom nav "Orders" link → `/orders` for signed-in users
- Added `/orders` to middleware public routes (optional auth)
- Wishlist: added DB merge on mount — signed-in users get cross-device sync via `getWishlistItemsAction`
- Wishlist: localStorage items synced to DB on mount for logged-in users

### 4.3 ✅ Product Search (Full-Text)

**Current:** Catalog has client-side text filter (searches name only in loaded products).
**Goal:** Server-side full-text search with Prisma `search` or PostgreSQL `tsvector`.

- Prisma: `where: { name: { search: query } }` (requires `@@fulltext` preview feature)
- Alternative: Use `ILIKE` with `unaccent()` for simple fuzzy search
- Add search bar to marketplace page
- Estimated effort: **3–4 hours**

### 4.4 ✅ Cart Persistence (LocalStorage Restore)

**Current:** Cart state is in React context only — lost on refresh.
**Goal:** Persist cart to `localStorage` and restore on page load.

- File: `lib/cart/cart-context.tsx`
- Serialize cart items to localStorage on every change
- Hydrate on mount (handle SSR safely)
- Estimated effort: **1–2 hours**

### 4.5 ✅ Checkout Notes / Gift Message

**Current:** `buyerNote` field exists on Order schema but no UI to fill it.
**Goal:** Add optional note/instructions textarea in cart panel.

- File: `components/catalog/cart-panel.tsx`
- Add `buyerNote` state + textarea below buyer name/phone fields
- Wire into `checkoutAction` (replace the `undefined // buyerNote`)
- Estimated effort: **30 min**

### 4.6 ✅ Multi-Language Support (i18n)

**Implemented:** Landing page fully wired to `next-intl` with 5 SA languages (en, zu, af, xh, st).

- All major landing sections use `tLanding()` translation calls (hero, trusted-by, how-it-works, features, pricing, FAQ, CTA)
- Translation files updated: `messages/{en,zu,af,xh,st}.json` with expanded landing keys
- Language switcher already in navbar, cookie-based locale detection
- 12 feature cards, pricing tiers, section headers all translatable

---

## 5. Seller Experience

### 5.1 ✅ Bulk Product Import (CSV/Excel)

**Current:** Products created one-by-one via form.
**Goal:** Upload CSV/Excel to create multiple products at once.

- Existing page: `/dashboard/[slug]/products/import` (may be partially built)
- Parse CSV with `papaparse` or `xlsx`
- Validate rows, show preview, bulk create via Prisma `createMany`
- Estimated effort: **4–6 hours**

### 5.2 ✅ Order Management Dashboard

**Current:** Sellers see orders list but limited management.
**Goal:** Full order lifecycle: confirm → pack → dispatch → deliver, with WhatsApp status notifications.

- Update `OrderStatus` enum if needed (add PACKING, DISPATCHED, DELIVERED)
- File: `app/dashboard/[slug]/orders/page.tsx`
- Status transition buttons with optimistic UI
- Estimated effort: **4–6 hours**

### 5.3 ✅ Multi-Shop Support

**Current:** Schema supports it (ShopUser join table) but UI assumes one shop per user.
**Goal:** Shop switcher dropdown in dashboard nav for users with multiple shops.

- File: `components/dashboard/sidebar.tsx` or equivalent
- Show shop selector if user has > 1 shop
- Estimated effort: **2–3 hours**

### 5.4 ✅ Product Variant Bulk Editor

**Current:** Variants edited one-by-one on product edit page.
**Goal:** Spreadsheet-like inline editor for batch stock/price updates.

- File: `app/dashboard/[slug]/products/[productId]/page.tsx`
- Table with editable cells for stock, price per variant
- Bulk save action
- Estimated effort: **3–4 hours**

### 5.5 ✅ Low Stock Alerts

**Current:** Dashboard shows out-of-stock count but no proactive alerts.
**Goal:** WhatsApp notification or in-app alert when any variant stock drops below threshold.

- Add `lowStockThreshold` field to Shop model (default: 5)
- Check on order creation → notify seller if stock < threshold
- Estimated effort: **2–3 hours**

---

## 6. Revenue & Monetisation

### 6.1 ✅ Promotion Analytics Deep-Dive

**Current:** Comprehensive promotion analytics on promote dashboard (ROI, funnel, comparison, per-promotion charts).
**Goal:** Per-promotion ROI tracking, click-through rates, conversion funnel.

- ✅ Promote dashboard already has: ROI comparison, conversion funnel, per-promotion CTR charts
- ✅ Added promotion summary section to main analytics dashboard (stat cards + funnel)
- ✅ Analytics page fetches `getShopPromotionStats()` and `getPromotionFunnel()`
- ✅ Summary links to full promote dashboard for deeper analysis
- Files: `components/analytics/analytics-dashboard.tsx`, `app/dashboard/[slug]/analytics/page.tsx`

### 6.2 ✅ Affiliate / Referral Rewards

**Current:** Referral program fully operational with auto-apply rewards.
**Goal:** Auto-apply rewards (free month, discount) when referral converts.

- ✅ Added `ReferralReward` model (idempotent: unique on referredShopId)
- ✅ `applyReferralReward()` now uses `$transaction` to atomically extend subscription + record reward
- ✅ Idempotency guard prevents double-reward on webhook retry
- ✅ `getReferralRewards()` + `getPendingReferrals()` data access functions
- ✅ Dashboard shows "Months earned" stat, per-referral status badges ("+1 month earned" / "Pending upgrade")
- Files: `prisma/schema.prisma`, `lib/db/referrals.ts`, `app/dashboard/[slug]/referrals/page.tsx`

### 6.3 ✅ Featured Listings (Paid Boost)

**Current:** Admin-only `isFeaturedShop` toggle + SPOTLIGHT product promotions.
**Goal:** Sellers can pay to feature their shop at the top of marketplace.

- Added `featuredUntil DateTime?` to Shop model
- Self-service boost purchase via PayFast (R199/week, 5% off 2wk, 15% off 4wk)
- Dashboard page: `/dashboard/[slug]/boost` with status, pricing, purchase flow
- PayFast webhook handler for `shopboost_*` payment IDs
- `getFeaturedShops()` updated to include time-limited paid boosts
- Boost extends from current expiry if already active
- Estimated effort: **4–6 hours**

---

## 7. DevOps & Monitoring

### 7.1 ✅ Error Tracking (Sentry)

**Current:** Sentry fully integrated with client, server, and edge configs.
**Goal:** Integrate Sentry for real-time error tracking + alerts.

- ✅ `@sentry/nextjs` v10.40.0 installed, `withSentryConfig` wraps `next.config.mjs`
- ✅ `instrumentation.ts` (server) + `instrumentation-client.ts` (client + replay) + `sentry.edge.config.ts`
- ✅ Both `error.tsx` and `global-error.tsx` call `Sentry.captureException(error)`
- ✅ Session Replay: 10% sessions, 100% on error
- ✅ Traces: 20% in production, 100% in dev
- ✅ `tunnelRoute: "/monitoring"` to bypass ad blockers

### 7.2 ✅ Uptime Monitoring

**Current:** No uptime monitoring.
**Goal:** Set up free uptime monitoring (BetterUptime, UptimeRobot, or Checkly).

- Monitor: `https://tradefeed.co.za`, `/api/health` (create health endpoint)
- Alert: Email + WhatsApp on downtime
- Estimated effort: **1 hour**

### 7.3 ✅ Database Query Performance

**Current:** No query logging or slow query detection.
**Goal:** Enable Prisma query logging in dev, add indexes for common queries.

- Prisma: `log: ['query', 'warn', 'error']` in dev
- Review `EXPLAIN ANALYZE` for marketplace + catalog queries
- Candidate indexes: `Product(shopId, isActive)`, `Order(shopId, createdAt)`
- Estimated effort: **2–3 hours**

### 7.4 ⬜ Automated E2E Tests

**Current:** No automated tests.
**Goal:** Playwright E2E tests for critical buyer flows.

- Flows: Landing → Marketplace → Catalog → Add to Cart → Checkout
- Flows: Sign Up → Create Shop → Add Product
- CI: GitHub Actions on PR
- Estimated effort: **1–2 days**

### 7.5 ⬜ Staging Environment

**Current:** Deploy straight to production on `main`.
**Goal:** Preview deployments on PRs (Vercel provides this by default).

- Enable Vercel preview deployments
- Use separate Neon branch for staging DB
- Estimated effort: **1–2 hours**

---

## Priority Matrix

| Priority | Items | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 High | 1.1 (Redis), 4.1 (WhatsApp API), 7.1 (Sentry), 4.4 (Cart persist) | Mixed | Revenue + reliability |
| 🟠 Medium | 1.2 (ISR), 4.3 (Search), 5.1 (CSV import), 5.2 (Order mgmt), 3.1 (JSON-LD) | 3–6h each | SEO + seller UX |
| 🟢 Low | 1.4 (Blur), 2.3 (SRI), 3.4 (Canonical), 4.5 (Notes), 5.3 (Multi-shop) | 1–2h each | Polish |
| 🔵 Strategic | 4.6 (i18n), 6.3 (Featured), 7.4 (E2E tests) | 1–2 days | Long-term growth |

---

## Quick Wins (< 1 hour each)

1. **4.5** — Buyer note textarea in cart (30 min)
2. **3.4** — Canonical URLs on all pages (1 hour)
3. **7.2** — Uptime monitoring setup (1 hour)
4. **3.2** — Breadcrumb JSON-LD (1 hour)

---

## Implementation Order (Recommended)

```
Phase A — Stability (Week 1)
  1.1 Upstash Redis rate limiter
  7.1 Sentry error tracking
  7.2 Uptime monitoring
  4.4 Cart persistence (localStorage)

Phase B — SEO & Discovery (Week 2)
  3.1 Enhanced product JSON-LD
  3.2 Breadcrumb JSON-LD
  3.3 Per-shop OG images
  3.4 Canonical URLs
  1.2 ISR for catalog pages

Phase C — Seller Tools (Week 3)
  5.1 Bulk CSV import
  5.2 Order management dashboard
  5.4 Variant bulk editor
  5.5 Low stock alerts
  4.5 Buyer note textarea

Phase D — Growth (Week 4+)
  4.1 WhatsApp Business API
  4.2 Buyer accounts
  4.3 Full-text search
  6.2 Referral rewards
  6.3 Featured listings
```

---

*This document is a living roadmap. Update status icons as items are implemented.*
