## TradeFeed Launch-Stability Hardening Plan

### Summary
- Current state is strong: `lint`, `tsc`, and `build` all pass locally.
- Focus selected: **Launch stability** for the next 2–4 weeks.
- Priority is to harden correctness, observability, and deploy safety before more features.

### Current Health Snapshot
- Build/testability: ✅ healthy — `tsc` and `build` both pass cleanly.
- CI pipeline: ✅ GitHub Actions workflow exists (`.github/workflows/ci.yml`).
- Proxy: ✅ migrated to `proxy.ts` (Next.js 16 convention, no deprecation warning).
- Repo hygiene: clean.

### P0 (This Week) — Correctness + Platform Compatibility
1. ✅ Fix marketplace analytics identity mismatch.
- Was: marketplace click tracking sent `shop.slug` where action/database expected shop ID.
- Status: **Already fixed** — `marketplace-product-card.tsx` now passes `product.shop.id`.

2. ✅ Migrate from deprecated `middleware.ts` to `proxy.ts` (Next 16 guidance).
- Renamed file, updated header comment. Build passes without deprecation warning.
- Commit: `591322a`

3. ✅ Stabilize auth surface and remove dead legacy path.
- Status: **Already done** — `lib/auth/dev.ts` no longer exists in repo.

### P1 (Week 2) — Delivery Safety
1. ✅ Add CI pipeline (GitHub Actions).
- Gates: `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Trigger: PR + main branch push.
- File: `.github/workflows/ci.yml`

2. ✅ Add minimal automated tests.
- 168 tests across 14 test files, all passing.
- Unit: `interleavePromotedProducts`, rate limiter, WhatsApp message builder, checkout schema, AI safety, telemetry, trending, intent detection, product import parser, review schema.
- Integration: marketplace search params, product CRUD actions with mocked auth.
- Runner: Node.js native test runner via `npx tsx --test tests/**/*.test.ts`.

3. ✅ Add error telemetry.
- Sentry `^10.40.0` installed and configured (`sentry.server.config.ts`, `sentry.edge.config.ts`).
- Source map upload gated on `SENTRY_AUTH_TOKEN`.

### P2 (Week 3–4) — Operational Hardening
1. ✅ Replace in-memory rate limiting with shared-store limiter (Upstash Redis).
- Implemented in `lib/rate-limit-upstash.ts`. Falls back to in-memory when env vars missing (local dev).
- `proxy.ts` imports from `@/lib/rate-limit-upstash`.

2. ✅ Add data safety checks for production.
- `lib/env.ts` validates all required env vars at import time via Zod.
- Crashes in production if required vars missing; warns in dev.

3. Refresh project docs to match real state.
- Reconcile tracker dates/statuses and remove “done” claims that drifted from code.
- Keep one source of truth for launch checklist.

### Public API / Interface / Type Changes
1. `MarketplaceProduct` shape in data layer:
- Add `shop.id: string` to marketplace query result type.
- Keep existing `shop.slug` for URL generation.

2. `trackMarketplaceClickAction` and `trackPromotedClickAction` call sites:
- Continue same signatures, but callers pass `shop.id` (not slug).
- Optional enhancement: rename parameter names to `shopId` everywhere for semantic clarity.

3. Routing runtime hook:
- Replace exported default in `middleware.ts` with equivalent `proxy.ts` entrypoint per Next 16 recommendation.

### Tests and Validation Scenarios
1. Analytics correctness:
- Clicking marketplace product records event with real shop ID.
- Promoted click increments promotion clicks and logs event with same shop ID.

2. Proxy compatibility:
- Protected routes still require auth.
- Public routes remain public.
- Rate limits still return 429 with expected headers.

3. Regression checks:
- `npm run lint`, `npx tsc --noEmit`, `npm run build` clean in CI.
- Marketplace page behavior unchanged visually and functionally.

### Assumptions and Defaults
- Default horizon: launch-hardening first, not new feature expansion.
- Keep current UX and URL structure unchanged while fixing stability.
- Keep existing DB schema unless needed for analytics correctness; prefer minimal type/query changes first.

---

### Feature: Cash-on-Delivery (COD) Support — ✅ Complete
Added full COD payment method alongside existing PayFast online payments.

**Schema changes** (`prisma/schema.prisma`):
- `PaymentMethod` enum: PAYFAST, COD, MANUAL
- `Order.paymentMethod` (default PAYFAST), `Order.codConfirmedAt`
- `Shop.codEnabled` (default false)

**Backend** (server actions + DB layer):
- `checkoutAction` / `_attemptCheckout` accept `paymentMethod` param
- `confirmCodPaymentAction` — seller confirms cash received → sets paidAt + status
- `toggleCodAction` — seller enables/disables COD in shop settings
- `getOrderByNumber` returns `paymentMethod` + `codConfirmedAt`

**Buyer UX**:
- Cart panel shows payment method selector (radio buttons) when shop has COD enabled
- WhatsApp message includes "💳 Payment: Cash on Delivery" note
- Pay page shows COD confirmation instead of PayFast button
- Order timeline shows COD-specific payment status row

**Seller UX**:
- Shop Settings → Payment Options section with COD toggle
- Orders dashboard shows 💵 COD badge, "Confirm Cash Received" button
- COD orders hide PayFast payment link

---

### Accessibility (WCAG AA) Audit — ✅ Complete
- Contrast fixes: upgraded light-grey text (`slate-400/500`, `blue-600/80`, `emerald-200/70`) to meet 4.5:1 ratio across landing page, marketplace cards, catalog page, and product reviews.
- Form accessibility: added `aria-required="true"` on delivery address and province inputs in cart panel.
- Error handling: added `role="alert"` on review submission error messages.
- Commit: `b922260`

---

### i18n: Marketplace Page Translations — ✅ Complete
- Added 6 marketplace translation keys to all 5 locale files (en, zu, xh, af, st):
  `browseByProvince`, `suppliersIn`, `popularCities`, `browseByCategory`, `whatsappImportCta`.
- Wired `app/marketplace/page.tsx` with `getTranslations("marketplace")` server-side.
- Rich text support for WhatsApp import CTA link via `t.rich()`.
- Commit: `9439cf7`

---

### i18n: Additional Pages Wiring — ✅ Complete
- Added 3 new namespaces to all 5 locale files: `contact` (FAQ Q&A sub-keys), `onboarding`, `tracking`.
- Expanded `orders` namespace with buyer-facing strings (myOrders, signInPrompt, etc.).
- Wired 4 server pages: `app/contact/page.tsx`, `app/create-shop/page.tsx`, `app/orders/page.tsx`, `app/track/page.tsx` — all using `getTranslations()`.
- Commit: `eb732e4`

---

### Full-Text Search — ✅ Already Complete
- 3-tier search: tsvector (weighted A/B fields) → pg_trgm fuzzy → ILIKE fallback.
- Implemented in `lib/db/search.ts`, auto-healed via `instrumentation.ts` health check on cold start.
- No additional work needed.

---

### Offline Caching Enhancement — ✅ Complete
- Enhanced `public/offline.html` with IndexedDB reader: shows previously visited shops (name, avatar, time-since-visited) from `tradefeed-catalog` database when user is offline.
- Bumped service worker cache version v4 → v5 to re-cache updated offline page.
- Commit: `09fbd8f`

---

### Advanced SEO URLs — ✅ Complete
- Added `getCityBySlug()` helper to `lib/marketplace/locations.ts`.
- Created `app/city/[city]/page.tsx` — flat city redirect route (`/city/johannesburg` → `/marketplace/gauteng/johannesburg`) with `generateStaticParams` and canonical metadata.
- Added "Browse by Province" footer section on landing page with links to all 9 provinces.
- Commit: `588a909`

---

## Feature Prompt Phase Tracker

Tracks progress on the 13 growth-plan features from `docs/TradeFeed — Cursor AI Feature Prompts.md`.

### Phase 1: Trust & Friction (30 Days)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| P1 | FAQ Page `/faq` | ✅ Done | `app/(public)/faq/page.tsx` — accordion with JSON-LD FAQ schema |
| P2 | How It Works `/how-it-works` | ✅ Done | `app/(public)/how-it-works/page.tsx` — 3-step + 5-benefit sections |
| P3 | WhatsApp Magic Link Login | ✅ Done | `app/(public)/whatsapp-login/` + `MagicLinkToken` model + OTP verify |
| P4 | Bulk Image Upload | ✅ Done | `components/bulk-import/` — up to 50 images, AI listing, client compression |

### Phase 2: Conversion (60 Days)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| P5 | Inventory Alerts via WhatsApp | ✅ Done | WhatsApp push added alongside email in `checkAndNotifyLowStock()`. Commit: `b2c5bfb` |
| P6 | Buyer Reviews & Ratings | ✅ Done | `components/reviews/` — stars, aggregation, dashboard, submission form |
| P7 | First Sale Celebration | ✅ Done | Confetti modal + FIRSTSALE50 upgrade prompt + WhatsApp message. Commit: `b2c5bfb` |

### Phase 3: Professional (90 Days)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| P8 | Printable QR Code Generator | ✅ Done | 3 template styles (Dark/Light/Colorful) + A5 300DPI PNG download. Commit: `b2c5bfb` |
| P9 | Custom Domain for Pro Users | ✅ Done | 73ab649+934262c — Vercel API, step wizard UI, SSL monitoring, health cron, WhatsApp alerts, domain swap, SEO sitemap, admin dashboard |

### Phase 4: Scale (Q3 & Q4)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| P10 | Weekly WhatsApp Sales Report | ✅ Done | Commit `0e215ac` — weekly stats, WoW trends, top products in `lib/whatsapp/seller-sequences.ts` (daily cron, 7-day cadence per shop) |
| P11 | Multi-Staff Accounts | ✅ Done | Invites/roles/team page shipped earlier; RBAC enforcement added 2026-07-09 — capability matrix in `lib/auth/permissions.ts`, enforced in all mutating server actions + role-gated dashboard UI |

### Bonus: SEO & Marketing

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| P12 | Dynamic Sitemap | ✅ Done | `app/sitemap.ts` — ISR, shops, products, categories, cities |
| P13 | SEO Meta Tags | ✅ Done | All pages: OG, Twitter, JSON-LD (Product, LocalBusiness, FAQ, etc.) |

### Summary
- **Done**: 13 / 13 — all growth-plan features shipped
- **Next up**: Phase 3 trust & transaction layer (in-app order payments, delivery integration) or seller city backfill for SEO pages

---

### Security: Role-Based Access Control Enforcement (2026-07-09) — ✅ Complete

Multi-staff had shipped without authorization — any member (including view-only STAFF) could mutate anything, and two actions had **no auth at all**.

- `lib/auth/permissions.ts` — capability matrix for OWNER / MANAGER / STAFF, single source of truth (see manager/DECISIONS.md D-015).
- `requireShopAccess(slug, permission)` — optional capability check at the existing auth choke point; ~50 mutating call sites across 24 server-action files now pass the required capability (catalog, orders, reviews, settings, billing, team).
- Pre-existing manual `role ===` checks (staff.ts, shop-settings.ts, manual-upgrade.ts, activity-logs.ts) converted to the shared matrix.
- **Fixed unauthenticated endpoints:** wholesale admin actions (approve/reject/list buyer PII) now `requireAdmin()`; `getRestockAlertsAction` (returns buyer phone numbers) now requires shop membership.
- Dashboard UI role-gated: desktop nav "More" groups, mobile drawer, mobile Add-Product FAB, products-page header buttons; team-page role descriptions corrected to match enforcement.
- Tests: `tests/permissions.test.ts` pins the matrix and enforcement wiring. Full suite 259/259 green; lint and `tsc --noEmit` clean; production build passes.

---

### Buyer Self-Serve Order Payments (2026-07-09) — ✅ Complete

Audit finding: the PayFast order-payment flow (pay page `/pay/[orderNumber]`, ITN webhook with `order_` routing, amount validation, transaction-fee capture, seller notification) was **already built** — the Phase 3 tracker said "NOT STARTED". The real gap was reach: buyers could only pay after the seller manually sent a link. Closed:

- Checkout WhatsApp message now includes `💳 Pay online: /pay/{orderNumber}` for PAYFAST orders (`lib/cart/whatsapp-message.ts`) — the link lives in the chat both parties use.
- Track page: self-serve "Pay Now" CTA for unpaid non-COD orders, plus payment success/cancelled banners (PayFast's return URL pointed at `/track?payment=…` but the page ignored it).
- Post-checkout: classic cart toast offers "Pay Now" as the primary action for PAYFAST orders (new i18n keys `cart.payNow` / `cart.payOnlineNow` in all 5 locales); TF redesign confirmation panel gets a "Pay … online now" button.
- Tests: 3 new message-builder cases (PAYFAST link, no-order-number, COD unchanged).

### Seller City Backfill Nudge (2026-07-09) — ✅ Complete

~74 pre-June-2026 sellers have no city, so they're invisible on marketplace city/province SEO pages.

- Dashboard banner (`components/dashboard/location-nudge-banner.tsx`) on the overview page (both classic and TF skins) when `shop.city` is null — benefit-led copy, links to settings. Self-dismisses once city is saved.
- One-time WhatsApp nudge (`nudge_location`) in the seller-sequences daily cron for shops ≥7 days old with products and no city. Deduped via the `SellerMessage` log (`status: "sent"`, so failures retry) — no schema migration needed. New signups can't hit it since city became required.
- Verification: 262/262 tests, lint + tsc clean, build passes.
