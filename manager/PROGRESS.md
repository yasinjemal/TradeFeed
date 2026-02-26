# TradeFeed — Progress Tracker

> Last updated: 2026-02-26
> Status: Phase 2 — Killer Differentiators (IN PROGRESS)

---

## Phase 1: Production Polish

Goal: Close all quality gaps so the platform feels professional, accessible, and production-ready.

### 1.1 Error Handling

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | `app/global-error.tsx` — root-level error boundary | DONE | Sentry integration, styled, reset + go home buttons |
| 2 | `app/error.tsx` — route-level error boundary | DONE | Styled, reset + go home buttons |
| 3 | `app/not-found.tsx` — 404 page | DONE | Styled, go home + marketplace buttons |
| 4 | Dashboard-level `error.tsx` | DONE | Route-specific error boundary exists |

### 1.2 SEO & Structured Data

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Dynamic sitemap (`app/sitemap.ts`) | DONE | Covers shops, products, categories, static pages. Capped at 5000 products. |
| 2 | `robots.ts` | DONE | Blocks dashboard/admin/API, allows public pages |
| 3 | JSON-LD — Marketplace page | DONE | ItemList + BreadcrumbList + WebPage via `lib/seo/json-ld.ts` |
| 4 | JSON-LD — Product detail pages | DONE | Product schema with AggregateOffer + BreadcrumbList |
| 5 | JSON-LD — Shop catalog pages | DONE | LocalBusiness + BreadcrumbList in layout |
| 6 | Metadata (title, description, OG, Twitter) | DONE | On all major pages |

### 1.3 PWA & Offline

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | `manifest.json` | DONE | Icons, theme, categories, lang=en-ZA |
| 2 | Service worker (`sw.js`) | DONE | Stale-while-revalidate for catalogs, cache-first for images, offline fallback |
| 3 | `offline.html` | DONE | Branded, load shedding reference, retry button |
| 4 | Service worker registration in layout | DONE | In `app/layout.tsx` |
| 5 | PWA manifest shortcuts | DONE | Marketplace, Dashboard, Create Shop shortcuts added |

### 1.4 Email Templates

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Order notification email | DONE | HTML + plain-text templates |
| 2 | Review notification email | DONE | HTML + plain-text templates |
| 3 | Low stock alert email | DONE | HTML + plain-text templates |
| 4 | Plain-text email fallbacks | DONE | `newOrderEmailText`, `newReviewEmailText`, `lowStockAlertEmailText` added |
| 5 | Welcome email for new sellers | DONE | `lib/email/templates/welcome.ts` — HTML + plain-text |
| 6 | `sendEmail` supports `text` param | DONE | `lib/email/resend.ts` updated to pass plain-text to Resend |

### 1.5 Accessibility (a11y)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Audit: aria-label coverage | DONE | 9/70 components (12.9%) — improved key panels |
| 2 | Skip-to-content link | DONE | Added to `app/layout.tsx` — sr-only, visible on focus |
| 3 | aria-labels on cart panel | DONE | Close button, remove buttons, qty steppers |
| 4 | aria-labels on wishlist panel | DONE | Close button, remove buttons, heart icon |
| 5 | Focus trapping — cart panel | DONE | Tab cycles within panel, auto-focus on open |
| 6 | Focus trapping — wishlist panel | DONE | Tab cycles within panel, auto-focus on open |
| 7 | `aria-live` regions | DONE | Cart item count, wishlist count, checkout errors use `aria-live="polite"` / `role="alert"` |
| 8 | Color contrast audit (WCAG AA) | TODO | Verify stone-400/500 text meets 4.5:1 ratio |
| 9 | Form error announcements | TODO | Screen reader-friendly form validation messages |

### 1.6 Database Performance

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Core indexes (shopId composites) | DONE | 30+ indexes exist in schema |
| 2 | Index: `ProductVariant [productId, stock]` | DONE | Added to schema — low-stock queries |
| 3 | Index: `Review [productId, rating]` | DONE | Added to schema — rating aggregation |
| 4 | Index: `AnalyticsEvent [visitorId]` | DONE | Added to schema — visitor tracking |
| 5 | Full-text search setup (PostgreSQL tsvector) | TODO | Replace ILIKE search for products (Phase 2 item) |

### 1.7 Security Hardening

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | CSP with nonces | DONE | In middleware.ts |
| 2 | Rate limiting (catalog 60/min, API 30/min) | DONE | In middleware.ts |
| 3 | HSTS, X-Frame-Options, Referrer-Policy | DONE | In middleware.ts |
| 4 | Permissions Policy | DONE | Restricts unnecessary browser APIs |
| 5 | Clerk auth on private routes | DONE | Middleware config |

---

## Phase 2: Killer Differentiators for SA (IN PROGRESS)

Goal: Features that no competitor does well — the reasons sellers choose TradeFeed.

### 2.1 Full-Text Search (PostgreSQL tsvector + pg_trgm)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Migration: tsvector column + GIN index on Product | DONE | `prisma/migrations/20260226120000_add_fulltext_search/migration.sql` |
| 2 | Migration: pg_trgm extension + trigram index on name | DONE | Fuzzy fallback for typos/misspellings |
| 3 | Auto-update trigger on Product name/description | DONE | `product_search_vector_update()` trigger |
| 4 | Search utility with ranking (`lib/db/search.ts`) | DONE | tsvector → pg_trgm → ILIKE fallback chain |
| 5 | Marketplace query updated for ranked search | DONE | `lib/db/marketplace.ts` uses `searchProductIds()` |
| 6 | Run migration on database | TODO | `npx prisma migrate deploy` |

### 2.2 i18n — Multi-Language Support

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Install `next-intl` | DONE | v4 for Next.js 16 App Router |
| 2 | i18n config (`i18n/config.ts`) | DONE | 5 locales: en, zu, xh, af, st |
| 3 | Server-side locale resolution (`i18n/request.ts`) | DONE | Cookie → Accept-Language → default (en) |
| 4 | `next.config.mjs` plugin integration | DONE | `createNextIntlPlugin` wrapping config |
| 5 | `NextIntlClientProvider` in root layout | DONE | Dynamic `lang` attribute on `<html>` |
| 6 | English translations (`messages/en.json`) | DONE | 200+ strings: nav, landing, marketplace, cart, wishlist, errors, footer |
| 7 | isiZulu translations (`messages/zu.json`) | DONE | Full translation of all keys |
| 8 | Afrikaans translations (`messages/af.json`) | DONE | Full translation of all keys |
| 9 | isiXhosa translations (`messages/xh.json`) | DONE | Full translation of all keys |
| 10 | Sesotho translations (`messages/st.json`) | DONE | Full translation of all keys |
| 11 | Language switcher component | DONE | `components/language-switcher.tsx` — dropdown, cookie-based |
| 12 | Wire `useTranslations()` into landing page | TODO | Replace hardcoded strings with translation keys |
| 13 | Wire `useTranslations()` into marketplace | TODO | Replace hardcoded strings with translation keys |
| 14 | Wire `useTranslations()` into catalog pages | TODO | Replace hardcoded strings with translation keys |

### 2.3 Offline Catalog Browsing (Enhanced PWA)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | IndexedDB catalog cache library (`lib/offline/catalog-cache.ts`) | DONE | Products + shops cached with 24h TTL |
| 2 | Service worker: RSC data caching for catalog pages | DONE | Stale-while-revalidate for Next.js RSC payloads |
| 3 | Service worker version bump (v3) | DONE | New API_CACHE store for JSON payloads |
| 4 | Wire IndexedDB caching into catalog page components | TODO | Call `cacheProducts()` after page load |
| 5 | Offline indicator banner component | TODO | Show "You're viewing cached data" when offline |

### 2.4 WhatsApp Business API Integration

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | API client (`lib/whatsapp/business-api.ts`) | DONE | Send templates, text messages, phone normalization |
| 2 | Order confirmation template function | DONE | `sendOrderConfirmation()` with template params |
| 3 | Order status update template function | DONE | `sendOrderStatusUpdate()` with tracking URL |
| 4 | Webhook handler (`app/api/webhooks/whatsapp/route.ts`) | DONE | GET verification + POST message/status handling |
| 5 | Register webhook in Meta Developer Portal | TODO | Requires Meta Business account setup |
| 6 | Create & approve message templates in Meta | TODO | "order_confirmation", "order_status_update" |
| 7 | Set env vars: WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID | TODO | From Meta Developer Portal |
| 8 | Hook into order creation flow | TODO | Send confirmation after `checkoutAction` succeeds |

### 2.5 USSD/WhatsApp-First Onboarding

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Design lightweight onboarding flow | TODO | USSD requires SA provider (e.g. Africa's Talking) |
| 2 | WhatsApp onboarding chatbot flow | TODO | Depends on WhatsApp Business API (2.4) |

---

## Phase 3: Trust & Transaction Layer

Goal: Build buyer confidence and streamline operations.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | In-app payment processing (PayFast for orders) | NOT STARTED | PayFast exists for subscriptions only |
| 2 | SnapScan / Zapper integration | NOT STARTED | Popular SA payment methods |
| 3 | Seller verification badges (CIPC check) | NOT STARTED | Trust is everything in informal trade |
| 4 | Dispute resolution system | NOT STARTED | Required for marketplace scale |
| 5 | Delivery partner integration (Pudo, CourierGuy) | NOT STARTED | Logistics is #1 pain point after cataloging |
| 6 | Invoice generation | NOT STARTED | Business tool, not just a catalog |

---

## Phase 4: Scale & Dominate

Goal: Features that cement market leadership.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Native mobile app (React Native / Expo) | NOT STARTED | App store presence + push notifications |
| 2 | Bulk operations (edit, price, stock) | NOT STARTED | Power sellers need this |
| 3 | AI-powered product recommendations | NOT STARTED | "Sellers who sell X also sell Y" |
| 4 | Financial reporting (P&L, VAT, tax) | NOT STARTED | Makes TradeFeed a business tool |
| 5 | Advanced analytics (demand forecasting) | NOT STARTED | Predictive intelligence for sellers |
| 6 | Social media integration | NOT STARTED | Instagram, Facebook shops sync |

---

## What's Already Built (Foundation)

These are complete and production-ready:

- [x] Multi-tenant architecture (shopId isolation on every query)
- [x] Clerk authentication with webhook user sync
- [x] Prisma schema (20+ models, 30+ indexes)
- [x] Product management (CRUD, variants, images, CSV import)
- [x] Public catalog pages (per-shop, shareable URLs)
- [x] WhatsApp checkout (structured order messages via URL scheme)
- [x] Marketplace discovery (search, filter, sort, promoted listings)
- [x] Seller dashboard (products, orders, analytics, revenue)
- [x] Order tracking (public lookup by order number)
- [x] Reviews & ratings with approval workflow
- [x] Promoted listings (BOOST, FEATURED, SPOTLIGHT tiers)
- [x] Referral program (codes, invite links, tracking)
- [x] PayFast subscription billing (Free/Pro tiers)
- [x] Email notifications (order, review, low-stock)
- [x] Rate limiting (catalog + API)
- [x] Security headers (CSP, HSTS, X-Frame-Options)
- [x] PWA (manifest, service worker, offline page)
- [x] SEO (sitemap, robots.txt, JSON-LD, OG tags)
- [x] Sentry error monitoring
- [x] Google Analytics 4
- [x] Vercel deployment config
- [x] POPIA awareness (privacy policy, terms, cookie consent)

---

## Quick Reference

| Metric | Value |
|--------|-------|
| Prisma models | 20+ |
| App route files | 78+ |
| React components | 70+ |
| Library files | 55+ |
| Test files (unit) | 7 |
| Test files (E2E) | 5 |
| aria-label coverage | 12.9% (9/70 components) |
| Email templates | 4 (HTML + plain-text) |
| JSON-LD pages | 3 (marketplace, product, shop) |
| Prisma indexes | 33+ (+ GIN tsvector + trigram) |
| i18n languages | 5 (en, zu, xh, af, st) |
| Translation strings | 200+ per language |
