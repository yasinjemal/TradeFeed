# TradeFeed — Architecture & Technical Review

**Prepared by:** Senior Software Architect (review only — no code changed)
**Date:** 2 June 2026
**Scope:** Full codebase audit — architecture, security, performance, database, mobile, SEO, growth, technical debt

---

## Executive Summary

TradeFeed is a **mature, well-engineered multi-tenant marketplace** for South African wholesalers and retailers, built on a modern stack (Next.js 16, React 19, Prisma 6 / Postgres on Neon, Clerk auth, PayFast payments, OpenAI, WhatsApp Business API, Upstash, Sentry). The product has grown well beyond its stated MVP — it now includes payments, analytics, AI listing generation, marketplace discovery, promotions, reviews, wholesale B2B, referrals, and custom domains.

The codebase is **above-average in quality**: clear module boundaries, a centralized auth gatekeeper, a thoughtfully indexed schema, strong CSP/security headers, excellent SEO, and genuinely mobile-first UI. It is **not** a typical "WhatsApp clone." The main risks are concentrated in a few high-leverage places: **payment/webhook trust boundaries, secret hygiene, the absence of a caching layer on read-heavy public pages, and near-zero automated test coverage.**

The single most urgent items are: (1) verify production secrets were never committed and rotate them, (2) add HMAC signature verification to the WhatsApp webhook, and (3) harden the PayFast subscription/order webhook against amount tampering.

---

## 1. Current Architecture

**Stack & topology**

- **Framework:** Next.js 16 App Router (React 19, React Server Components, server actions). Deployed on Vercel (serverless). Edge-adjacent request handling via `proxy.ts` (Next 16's renamed middleware).
- **Auth:** Clerk. A single centralized module (`lib/auth/index.ts`) exposes `getCurrentUser`, `requireAuth`, and `requireShopAccess` — the multi-tenant gatekeeper. Platform admin is env-based (`ADMIN_USER_IDS`).
- **Data:** Prisma 6 → PostgreSQL (Neon, eu-central-1), pooled connection. ~40 models. Money stored as integer cents (ZAR). PostgreSQL `tsvector` full-text search with a GIN index and pg_trgm fuzzy fallback.
- **Integrations:** PayFast (payments/subscriptions), WhatsApp Cloud API (orders, auto-reply, product import), OpenAI GPT-4o-mini (vision listing generation + AI sales replies), UploadThing (images/CDN), Resend (email), Upstash (rate limiting), Sentry (errors), Vercel Analytics/Speed Insights.
- **i18n:** next-intl with 5 SA languages (en, zu, xh, af, st).
- **Background jobs:** Vercel Cron routes under `/api/cron/*` (daily ranking computation, data retention, seller follow-up sequences), protected by a `CRON_SECRET` bearer token.

**Layering (clean and consistent)**

```
app/(routes + server actions)  →  lib/db/* (data access)  →  Prisma  →  Postgres
app/api/*                      →  lib/* (domain logic: payfast, whatsapp, intelligence, email)
lib/auth                       →  enforced at every mutation entry point
lib/validation/* (Zod)         →  input schemas
```

**Multi-tenancy model.** Every tenant-scoped row carries `shopId`. Access is mediated by the `ShopUser` join table (OWNER / MANAGER / STAFF) through `requireShopAccess(slug)`. Isolation is enforced in the data-access layer rather than at the database (no Postgres row-level security). This is a reasonable choice but means tenant isolation is only as strong as the discipline of always calling the gatekeeper — see Technical Debt.

**Notable design strengths**

- Denormalized read-optimization fields on hot paths: `Product.minPriceCents/maxPriceCents`, `Product.qualityScore`, `Shop.healthScore`, computed by a daily cron rather than per-request.
- Snapshot fields on `OrderItem`, `ComboItem`, `DropItem` so historical records survive product deletion.
- Custom-domain support handled with an in-proxy DB lookup + 5-minute in-memory cache.
- Strong separation between single-shop `catalog.ts` and cross-shop `marketplace.ts`.

---

## 2. Security Issues

Overall the security posture is **strong for an early-stage product** (nonce-based CSP, HSTS, rate limiting, signed PayFast ITN, svix-verified Clerk webhook, cron secret). The issues below are concentrated at trust boundaries.

### Critical

**S1 — Live production secrets present in a working-directory env file.**
`.env.production.local` contains **live** credentials: Clerk `sk_live_…`, the Neon `DATABASE_URL` (with password), OpenAI key, Resend key, UploadThing live token, Sentry auth token, `CRON_SECRET`, `CLERK_WEBHOOK_SECRET`, and a Vercel OIDC token. The file *is* covered by `.gitignore` (`.env*.local`), so it is most likely not in git — **but this must be confirmed against full git history**, because any single past commit exposes every key. Recommendation: run a history scan (e.g. `git log --all -- .env.production.local`, or trufflehog/gitleaks) and, if there is any doubt, **rotate all of these keys**. Treat the database URL and Clerk secret key as the highest priority.

**S2 — WhatsApp webhook has no signature verification.**
`app/api/webhooks/whatsapp/route.ts` (POST) parses and acts on the body — sending WhatsApp messages, triggering OpenAI calls, and importing products — without validating Meta's `X-Hub-Signature-256` HMAC. Anyone who knows the URL can forge "incoming messages" to trigger auto-replies/AI replies (direct OpenAI cost abuse and outbound-message abuse on the shop's number) and fake product imports. The GET verification handshake is implemented, but the POST path is unauthenticated. **Fix:** verify the HMAC-SHA256 of the raw body against the Meta app secret using `crypto.timingSafeEqual`.

### High

**S3 — PayFast subscription & order webhooks don't validate the paid amount.**
`validatePayFastITN` checks the signature but the **amount check is optional and not used** for the subscription path (`handleSubscriptionPayment` simply upgrades `m_payment_id` to the `"pro"` plan) or, effectively, for orders (`markOrderPaid` is called without comparing `amount_gross` to the order total). The signature does protect against forgery *provided* `PAYFAST_PASSPHRASE` is set — but `getConfig()` defaults the passphrase to `""`, in which case the signature degrades to an unsalted MD5 of public parameters that an attacker can compute. Combined, a missing passphrase + no amount check could allow free Pro upgrades or under-paid orders being marked paid. **Fix:** (a) require `PAYFAST_PASSPHRASE` in production (fail loudly like the merchant-id check already does), (b) validate `amount_gross` against the expected price for subscriptions and the order total for orders (the promotion/boost handlers already do this — apply the same to subscriptions/orders), and (c) add PayFast's server confirmation postback and/or source-IP allowlist (the code comment claims IP validation but it is not implemented).

**S4 — PII written to application logs.**
The PayFast and WhatsApp handlers `console.log` buyer phone numbers, message bodies, and payment identifiers. Under POPIA these are personal data. Logs flow to Vercel/Sentry and persist. **Fix:** redact or hash phone numbers and drop message bodies from logs.

### Medium

**S5 — Middleware "fails open" on unexpected errors.** The `proxy.ts` catch block intentionally re-throws Clerk redirect errors (good) but otherwise continues. A bug in the rate-limit or custom-domain DB call won't bypass `auth.protect()` (that throws and is re-thrown), but it does disable rate limiting and security-header logic for that request. Acceptable, but worth a Sentry alert so silent degradation is visible.

**S6 — AI image URL is attacker-controllable.** `/api/ai/generate-product` accepts any `imageUrl` and forwards it to OpenAI. It is access-gated (shop membership + credits + daily cap) so abuse is limited to authenticated sellers, but there is no allowlist that the URL belongs to the UploadThing domain. **Fix:** validate the host.

**S7 — `ADMIN_USER_IDS` env-based admin.** Fine for MVP, but there is no audit of admin-list changes and no second factor on platform-admin actions beyond Clerk login. The `AdminAuditLog` model exists and is used — good — but consider moving admin role into the DB as the platform grows.

### Low / good practice already in place

- CSP with per-request nonce, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, restrictive `Permissions-Policy` — all present in `proxy.ts`.
- Clerk webhook uses svix verification; cron routes check `CRON_SECRET`; rate limiting on catalog/API routes via Upstash.

---

## 3. Performance Bottlenecks

**P1 — No caching layer on read-heavy public pages (highest impact).**
There is **no use of `unstable_cache`, route `revalidate`, or React `cache()`** anywhere in `lib/`. Every marketplace, catalog, and product page render hits Postgres directly, and the same query often runs twice per request (see P2). For a read-dominated marketplace this is the biggest scalability limiter and the largest Neon cost driver. **Fix:** wrap catalog/marketplace reads in `unstable_cache` with tag-based invalidation, or set `export const revalidate` on public routes. Even 30–60s caching on marketplace and category pages would cut DB load dramatically.

**P2 — Duplicate queries per product page.** `catalog/[slug]/products/[productId]/page.tsx` calls `getCatalogShop` + `getCatalogProduct` in `generateMetadata` **and again** in the page component — and these aren't wrapped in React `cache()`, so they execute twice. The page then fires ~5 more parallel queries plus `trackEvent`. A single product view is **~10+ DB round-trips**. Wrapping the shared loaders in `cache()` removes the duplicates for free.

**P3 — Marketplace enrichment recomputes seller tiers on every request.** `getMarketplaceProducts` runs the main product query + a count, then three sequential enrichment passes (`enrichWithReviewStats`, `enrichWithSellerTiers`, `enrichWithSoldCounts`). The tier pass alone issues **four parallel `groupBy` queries** (shops, product counts, order counts, review aggregates) and recomputes tier points in JS — the *exact* computation the daily ranking cron already performs. Net: a single marketplace page is ~7+ aggregate queries over Orders/Reviews/Products. **Fix:** denormalize `sellerTier`/tier-points onto `Shop` (as `healthScore` already is) and read it directly; run the three enrichment passes in parallel rather than sequentially.

**P4 — `trending`/`popular`/`top_rated` sorts are only partially correct and are post-query sorts.** For `trending`, the code computes a ranked ID list across the dataset but the main query fetches the *newest* page and only re-sorts within it — so genuinely trending products outside the newest page never surface. `top_rated` sorts only within the already-paginated page. These are correctness-as-performance issues; doing the ranking in SQL (or filtering the main query by the ranked IDs) would fix both.

**P5 — In-memory rate limiter used for the AI daily cap.** `lib/rate-limit.ts` is a per-instance `Map`. On Vercel serverless each instance has its own memory, so the "50 generations/day per shop" safety cap in `/api/ai/generate-product` is enforced **per instance, not globally** — real usage can exceed the cap and run up OpenAI spend. The Upstash limiter already used in middleware should back this cap too.

**P6 — Min/max price recomputed in JS despite denormalized columns.** The marketplace maps over fetched variants to compute `minPriceCents`/`maxPriceCents` even though `Product` already stores them. Minor, but it forces fetching all variant prices per card.

---

## 4. Database Optimization Opportunities

The schema is **well-indexed already** — composite indexes on the hot paths (`Product[shopId,isActive]`, `[isActive,qualityScore]`, `AnalyticsEvent[shopId,type,createdAt]`, order indexes, etc.). Opportunities:

**D1 — Denormalize seller tier (pairs with P3).** Add `Shop.tierPoints` / `Shop.tierKey`, written by the existing ranking cron. Removes ~4 aggregate queries from every marketplace render.

**D2 — `AnalyticsEvent` is the table that will hurt at scale.** Every page/product/marketplace view writes a row, and trending sorts run `groupBy` over a 7-day window of it on each request. Ensure the data-retention cron is aggressive, and consider rolling daily counts into a small `ProductDailyStat` summary table that trending/ranking read from, instead of scanning raw events. A BRIN index on `createdAt` suits append-only event data.

**D3 — Partial-unique constraints on nullable columns.** `WishlistItem` has `@@unique([productId, visitorId])` and `@@unique([productId, userId])` where one side is always null. In Postgres, multiple NULLs are distinct, so these don't enforce what they appear to. Use partial unique indexes (`WHERE visitorId IS NOT NULL`) via a raw migration.

**D4 — `Review` relation lacks `onDelete` and a couple of FKs are unindexed for the access pattern.** Minor; audit FK `onDelete` behavior (`Review.shop` has no rule) and confirm `OrderItem.variantId` doesn't need an index for fulfillment queries.

**D5 — Batched writes in the ranking cron use `$transaction([...100 updates])`.** Works, but 100 individual `UPDATE`s per transaction is chatty. A single `UPDATE ... FROM (VALUES ...)` or `executeRaw` bulk update would cut round-trips substantially as the catalog grows.

**D6 — Connection management.** Confirm the Neon **pooled** URL is used in serverless and consider Prisma Accelerate or PgBouncer transaction mode to avoid connection exhaustion under burst traffic.

---

## 5. Mobile Responsiveness

**This is a genuine strength.** The product is mobile-first by design (the target users are smartphone-first SA traders).

- Tailwind responsive utilities used throughout; product page uses a single-column→`lg:` two-column layout, a **sticky mobile buy bar**, a global bottom nav, and a floating WhatsApp button.
- PWA: manifest, theme-color, apple-mobile-web-app meta, and a registered service worker (`/sw.js`) with an offline catalog cache (`lib/offline/catalog-cache.ts`).
- Accessibility: skip-to-content link, `aria-hidden` on decorative SVGs, semantic headings.

**Minor issues to verify**

- **M1 —** No explicit `viewport`/`themeColor` export (Next 16 prefers the `export const viewport` API over `<meta>` in `<head>`); current `<meta name="theme-color">` works but mixing conventions is a small debt.
- **M2 —** Several pages embed large inline SVGs and emoji-heavy markup; confirm the product grid uses `next/image` with correct `sizes` for mobile bandwidth (SA data costs matter). Image optimization through UploadThing + `next/image` should be audited for `sizes`/`priority` on LCP images.
- **M3 —** The `animate-pulse` low-stock badge and multiple gradient cards are fine, but test tap-target sizes (≥44px) on the densest cards.

---

## 6. SEO Weaknesses

**Also a strength** — this is one of the most SEO-complete codebases of its size I've reviewed.

Present and good: per-page `generateMetadata` with canonicals, product `JSON-LD` (Product/Offer/AggregateRating), Organization + WebSite schema, OpenGraph with **real product photos** (proxied so Googlebot-Image can crawl UploadThing), dynamic OG image route, `sitemap.ts`, `robots.ts`, Google Merchant Center feed + verification, GA4, location landing pages (`/marketplace/[province]/[city]/[category]`, `/city/[city]`), and a canonical redirect for `?category=` duplicates in the proxy.

**Weaknesses / opportunities**

- **SE1 — Keyword stuffing & duplication in root metadata.** The homepage `keywords` array is ~40 terms (including a literal duplicate "wholesale South Africa"). Modern Google ignores the keywords meta and over-stuffed copy can read as spammy. Trim it; invest the effort in unique on-page H1/body copy per landing page instead.
- **SE2 — Thin/templated location pages risk "doorway page" treatment.** The province/city/category matrix is great for coverage but Google penalizes near-duplicate templated pages. Ensure each has genuinely unique content (real local seller counts, local copy) and only index combinations that have inventory; `noindex` empty ones.
- **SE3 — No caching means crawl budget hits the DB directly.** Googlebot crawling thousands of catalog/marketplace URLs uncached amplifies P1. ISR/`revalidate` on these routes both speeds users and protects the DB during crawls.
- **SE4 — Confirm canonical consistency** between `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_URL` (both referenced), and custom-domain rewrites so a product isn't canonicalized to two hosts.

---

## 7. Features That Would Increase User Adoption

Ranked by likely impact for the SA wholesale/retail audience:

1. **Frictionless WhatsApp-first onboarding & login.** The `MagicLink` model and `/whatsapp-login` flow exist — make WhatsApp OTP the *primary* path (Clerk email/password is a hurdle for this audience). Get-to-first-product in under 2 minutes is the stated principle; measure and optimize it with the existing `OnboardingEvent` funnel.
2. **AI bulk catalog import from WhatsApp groups.** The single biggest "wow" for a Jeppe trader: forward existing product photos and auto-create listings. The plumbing exists (`whatsapp/product-import`, vision AI). Promote it heavily and make it self-serve.
3. **Buyer accounts + saved carts + reorder.** B2B buyers reorder constantly. Wishlist exists; add one-tap reorder from order history and back-in-stock alerts (the `notifyPhone` field is already there).
4. **Seller analytics that drive action, not vanity.** "These 3 products get views but no orders — drop the price" beats raw counts. The `intelligence/*` engine already computes signals; surface prescriptive nudges.
5. **Storefront trust & differentiation:** verified badges, reviews, custom domains, themes already exist — lean into ratings prominence and a "verified wholesale supplier" directory to win SEO + trust.
6. **Lightweight in-platform payments expansion.** COD + PayFast exist; adding popular SA rails (Capitec Pay, SnapScan) lowers buyer friction.
7. **Referral loop activation.** The referral reward system is built but is only triggered on paid upgrade — consider rewarding activation milestones to drive virality earlier.

---

## 8. Technical Debt

- **TD1 — Near-zero automated test coverage.** `package.json` defines `tsx --test tests/**` and Playwright e2e, but **no `tests/` directory exists** in the repo. For a system handling money (PayFast amount logic, fee capture, subscription state) and multi-tenant isolation, this is the most important debt to repay. Start with unit tests for `payfast.ts` signature/amount logic, the marketplace ranking/interleave functions, and an integration test asserting cross-tenant access is denied.
- **TD2 — Tenant isolation relies on developer discipline, not the DB.** Every query must remember `shopId`. One missing filter leaks data across tenants. Consider Postgres RLS or a Prisma client extension that injects `shopId`, plus the isolation test above.
- **TD3 — Product-vision growth beyond `VISION.md`.** The vision doc still says "No payments, no analytics, no marketplace," yet all exist. Docs/decisions are drifting from reality — update `manager/VISION.md` and `DECISIONS.md` so onboarding engineers aren't misled.
- **TD4 — Hand-rolled MD5 / PayFast plumbing.** Acceptable (PayFast mandates MD5), but the signature/amount logic is security-critical and untested (see TD1). Centralize and test it.
- **TD5 — Two rate-limiter implementations** (`lib/rate-limit.ts` in-memory vs `lib/rate-limit-upstash.ts`). Consolidate on Upstash so behavior is consistent and correct in serverless (ties to P5).
- **TD6 — Logging is `console.log`-based and leaks PII** (ties to S4). Move to structured logging with redaction.
- **TD7 — Dependency currency / bleeding edge.** Next 16 + React 19 + Tailwind 4 are very new; pin and track them, and keep `@prisma/client` and Clerk SDKs aligned. The `overrides: { effect: "3.18.4" }` pin suggests a transitive conflict worth documenting.

---

## Action Plan — Ranked by Business Impact

> Ranking weighs *risk × likelihood × blast radius* against *effort*. "Impact" is business impact (fraud, outage, data-breach, growth), not code aesthetics.

### Tier 0 — Do this week (existential risk: money, data, abuse)

| # | Action | Why it ranks here | Effort |
|---|--------|-------------------|--------|
| 1 | **Confirm secrets were never committed (scan full git history); rotate DB URL, Clerk secret, OpenAI, Resend, UploadThing, Sentry, CRON tokens if any doubt.** (S1) | A single historical commit exposes the entire platform + customer data. Cheapest possible insurance. | Low |
| 2 | **Add HMAC `X-Hub-Signature-256` verification to the WhatsApp webhook.** (S2) | Open door to OpenAI cost abuse, outbound-message abuse, and fake imports. | Low |
| 3 | **Harden PayFast: require `PAYFAST_PASSPHRASE` in prod; validate paid amount for subscriptions and orders; add postback/IP check.** (S3) | Directly protects revenue against free upgrades / under-paid orders. | Med |

### Tier 1 — This month (scale, cost, and the test gap)

| # | Action | Why | Effort |
|---|--------|-----|--------|
| 4 | **Introduce caching on public reads** (`unstable_cache`/`revalidate` on marketplace, category, catalog, product) and wrap shared loaders in React `cache()` to kill duplicate queries. (P1, P2) | Largest lever on DB load, page speed, SEO crawl cost, and Neon bill. | Med |
| 5 | **Write the critical test suite**: PayFast amount/signature, ranking/interleave, and a cross-tenant isolation integration test. (TD1, TD2) | Money + multi-tenant correctness currently unguarded. | Med |
| 6 | **Back the AI daily cap and all rate limits with Upstash**; remove the in-memory limiter from serverless paths. (P5, TD5) | Real OpenAI cost control; consistent limiting. | Low |
| 7 | **Redact PII from logs.** (S4, TD6, POPIA) | Compliance + breach-surface reduction. | Low |

### Tier 2 — Next quarter (efficiency & correctness)

| # | Action | Why | Effort |
|---|--------|-----|--------|
| 8 | **Denormalize seller tier onto `Shop`; parallelize marketplace enrichment.** (P3, D1) | Removes ~4 aggregate queries per marketplace render. | Med |
| 9 | **Fix trending/popular/top_rated to rank across the dataset (in SQL).** (P4) | Correctness of core discovery surface + perf. | Med |
| 10 | **Roll analytics into a daily summary table; tighten retention; BRIN index.** (D2) | Prevents the event table becoming the scaling wall. | Med |
| 11 | **Fix `WishlistItem` partial-unique constraints; audit FK `onDelete`.** (D3, D4) | Data-integrity bugs waiting to surface. | Low |

### Tier 3 — Growth (do in parallel; product-led)

| # | Action | Why | Effort |
|---|--------|-----|--------|
| 12 | **Make WhatsApp OTP the primary login; instrument & optimize the onboarding funnel.** (Feature 1) | Removes the biggest activation hurdle for the audience. | Med |
| 13 | **Productize AI bulk import from WhatsApp; add buyer reorder + back-in-stock.** (Features 2–3) | Highest "wow" + retention for B2B reorder behavior. | Med |
| 14 | **Trim keyword stuffing; ensure location pages are unique/`noindex`-when-empty.** (SE1, SE2) | Protects SEO from doorway/spam penalties as the page matrix grows. | Low |
| 15 | **Update `VISION.md`/`DECISIONS.md` to reflect the real product.** (TD3) | Keeps the team aligned; cheap. | Low |

---

### Closing note

TradeFeed is in materially better shape than most products at this stage — the engineering instincts (centralized auth, denormalized read paths, security headers, SEO depth, mobile-first UX) are sound. The work above is mostly about **hardening the money/trust boundaries and adding the caching + test safety nets** that let it scale without nasty surprises. Tier 0 is genuinely urgent; the rest is high-leverage but not on fire.
