# TradeFeed — Phase Tracker

> Single source of truth for project progress.
> Updated after every completed feature.
> Last updated: **2026-02-26** (Tier 3)

---

## Phase Overview

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | Foundation | ✅ Complete | Schema, project structure, database, config |
| 2 | Core Commerce | ✅ Complete | Shop, products, catalog, WhatsApp checkout |
| 3 | Auth & Security | ✅ Complete | Clerk auth, webhook sync, role-based access |
| 3.5 | UI Polish & Redesigns | ✅ Complete | Loading states, image gallery, dashboard redesign |
| 3.6 | Trust & Discovery | ✅ Complete | Shop profiles, maps, search, share, settings redesign |
| 3.7 | Dashboard Redesign | ✅ Complete | Rich stats, active nav, share catalog, pro layout |
| 4 | Media & Categories | ✅ Complete | Uploadthing CDN images, category management UI, product edit |
| 5 | Monetisation | ✅ Complete | PayFast billing, subscription tiers, free tier gate |
| 6 | Scale & Intelligence (Partial) | ✅ Complete | Analytics, rate limiting. WhatsApp Business API deferred. |
| 7 | SEO & Discovery | ✅ Complete | Dynamic OG images, JSON-LD, sitemap, robots.txt |
| 8 | Admin & Compliance | ✅ Complete | Platform admin, seller verification, POPIA legal pages, cookie consent |

---

## Phase 1 — Foundation ✅

> Project scaffolding, database schema, tooling, and configuration.

| # | Task | Status | Commit | Notes |
|---|------|--------|--------|-------|
| 1.1 | Manager docs (VISION, DECISIONS, AI_RULES) | ✅ Done | `ca615bf` | Project charter locked, 14 decisions |
| 1.2 | Next.js 16 + TypeScript strict scaffolding | ✅ Done | `ca615bf` | App Router, Turbopack, `noUncheckedIndexedAccess` |
| 1.3 | Prisma schema (7 models) | ✅ Done | `ca615bf` | Shop, User, ShopUser, Category, Product, ProductImage, ProductVariant |
| 1.4 | Tailwind v4 + shadcn/ui setup | ✅ Done | `ca615bf` | PostCSS ESM fix applied |
| 1.5 | Neon PostgreSQL connection | ✅ Done | `8259e30` | `eu-central-1`, connection pooling |
| 1.6 | Initial migration (`init-foundation`) | ✅ Done | `8259e30` | All 7 tables created |
| 1.7 | Dev seed user | ✅ Done | `8259e30` | `yasin@tradefeed.dev` |

**Phase 1 complete — 2026-02-23**

---

## Phase 2 — Core Commerce ✅

> Multi-tenant shop creation, product catalog, public storefront, WhatsApp checkout.

### 2A — Shop Creation ✅

| # | Task | Status | Commit | Notes |
|---|------|--------|--------|-------|
| 2A.1 | Shop Zod validation schema | ✅ Done | `21bccd2` | SA phone normalization (`+27` prefix) |
| 2A.2 | Slug utility (generate + unique) | ✅ Done | `21bccd2` | Collision suffix: `-1`, `-2`, etc. |
| 2A.3 | Shop data access layer | ✅ Done | `21bccd2` | Transaction: Shop + ShopUser OWNER atomically |
| 2A.4 | Shop creation server action | ✅ Done | `21bccd2` | Validates → creates → redirects to dashboard |
| 2A.5 | Create Shop UI form | ✅ Done | `21bccd2` | shadcn Card + Input, `useActionState` |
| 2A.6 | Dashboard overview page | ✅ Done | `21bccd2` | Stats, catalog URL, WhatsApp info |
| 2A.7 | Home page → redirect to create shop | ✅ Done | `21bccd2` | MVP flow: land → create → dashboard |

**Shop Creation complete — 2026-02-23**

### 2B — Product CRUD ✅

| # | Task | Status | Commit | Notes |
|---|------|--------|--------|-------|
| 2B.1 | Product + Variant Zod schemas | ✅ Done | `f30ab1d` | `priceInRands` → cents transform via Zod |
| 2B.2 | Product data access layer | ✅ Done | `f30ab1d` | All queries scoped by `shopId` |
| 2B.3 | Variant data access layer | ✅ Done | `f30ab1d` | Ownership chain: variant → product → shop |
| 2B.4 | Product + Variant server actions | ✅ Done | `f30ab1d` | 6 actions: CRUD product + add/delete/bulk-create variant |
| 2B.5 | Dashboard layout + navigation | ✅ Done | `f30ab1d` | Overview, Products, View Catalog nav links |
| 2B.6 | Product list page | ✅ Done | `f30ab1d` | Grid cards with price range, stock, active badge |
| 2B.7 | Create product form + page | ✅ Done | `f30ab1d` | `useActionState` → redirect to product detail |
| 2B.8 | Product detail page | ✅ Done | `f30ab1d` | Stats, variant table, add form, danger zone |
| 2B.9 | Variant list + delete button | ✅ Done | `f30ab1d` | Hover-reveal delete, confirm dialog |
| 2B.10 | Delete product button | ✅ Done | `f30ab1d` | Cascades variants + images |

**Product CRUD complete — 2026-02-23**

### 2C — Public Catalog Page ✅

| # | Task | Status | Commit | Notes |
|---|------|--------|--------|-------|
| 2C.1 | Public catalog route (`/catalog/[slug]`) | ✅ Done | `292862e` | SSR for SEO + fast load on mobile data |
| 2C.2 | Catalog data access (public, read-only) | ✅ Done | `292862e` | Only active products/variants, no auth |
| 2C.3 | Product grid UI (mobile-first) | ✅ Done | `292862e` | Color dots, size pills, price range, sold-out overlay |
| 2C.4 | Product detail page | ✅ Done | `292862e` | Variant table, sizes, colors, stock, WhatsApp order button |
| 2C.5 | Shop header / branding | ✅ Done | `292862e` | Sticky header, logo fallback, WhatsApp CTA, SEO metadata |
| 2C.6 | Not-found + empty states | ✅ Done | `292862e` | Graceful UX for stale links + empty catalogs |

**Public Catalog complete — 2026-02-23**

### 2D — WhatsApp Structured Checkout ✅

| # | Task | Status | Commit | Notes |
|---|------|--------|--------|-------|
| 2D.1 | Cart state management (React Context + localStorage) | ✅ Done | `2f0bf30` | Per-shop scoped, hydration-safe, quantities capped at stock |
| 2D.2 | Add-to-cart picker (size → color → qty → add) | ✅ Done | `2f0bf30` | Interactive variant picker with green feedback animation |
| 2D.3 | Floating cart button | ✅ Done | `2f0bf30` | Count badge, total price, bounce animation on add |
| 2D.4 | Slide-out cart panel | ✅ Done | `2f0bf30` | Item list, qty steppers, remove, clear, backdrop blur |
| 2D.5 | WhatsApp message builder | ✅ Done | `2f0bf30` | Structured order text with line items, sizes, colors, total in ZAR |
| 2D.6 | `wa.me` checkout button | ✅ Done | `2f0bf30` | Opens WhatsApp with pre-filled order → clears cart |
| 2D.7 | Product detail page integration | ✅ Done | `2f0bf30` | AddToCart replaces old WA-only button, enquiry link secondary |

**WhatsApp Structured Checkout complete — 2026-02-24**

**Phase 2 Core Commerce complete — 2026-02-24** 🎉

---

## Phase 3 — Auth & Security ✅

> Real Clerk authentication replacing dev auth, webhook user sync, role-based shop access.

| # | Task | Status | Commit | Notes |
|---|------|--------|--------|-------|
| 3.1 | Clerk integration + webhook user sync | ✅ Done | `e8b2e55` | `@clerk/nextjs` v6.38.2, Svix signature verification |
| 3.2 | Webhook route (`/api/webhooks/clerk`) | ✅ Done | `e8b2e55` | Handles `user.created`, `user.updated`, `user.deleted` events |
| 3.3 | Auth helpers (`lib/auth.ts`) | ✅ Done | `e8b2e55` | `getUser()`, `requireUser()`, `requireShopAccess()` — all use real Clerk `auth()` |
| 3.4 | Protected routes middleware | ✅ Done | `e8b2e55` | `clerkMiddleware` + `createRouteMatcher`, dashboard pages require auth |
| 3.5 | Role-based access (OWNER/MANAGER/STAFF) | ✅ Done | `e8b2e55` | `requireShopAccess()` checks ShopUser membership, returns `{ user, shopUser }` |
| 3.6 | Sign-in / sign-up pages | ✅ Done | `e8b2e55` | `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]` with Clerk components |
| 3.7 | UserButton in dashboard | ✅ Done | `e8b2e55` | Session management + sign out via Clerk `<UserButton>` |
| 3.8 | All server actions migrated to Clerk | ✅ Done | `e8b2e55` | shop.ts, product.ts, image.ts, shop-settings.ts all import from `lib/auth` |
| 3.9 | Rate limiting on public routes | ⬜ Todo | — | Deferred to pre-launch (Phase 6) |

**Phase 3 complete — 2026-02-24** (rate limiting deferred)

---

## Phase 3.5 — UI Polish ✅

> Loading states, image gallery, refined cards, and modern dashboard UI.

| # | Task | Status | Commit | Notes |
|---|------|--------|--------|-------|
| 3.5.1 | Shimmer loading skeletons | ✅ Done | `28f34f9` | Catalog + dashboard loading states |
| 3.5.2 | Image gallery thumbnails | ✅ Done | `28f34f9` | Product detail thumbnail strip |
| 3.5.3 | Refined card styles | ✅ Done | `28f34f9` | Product cards with better shadows/spacing |
| 3.5.4 | Fixed broken image URLs | ✅ Done | `28f34f9` | Image display fallbacks |
| 3.5.5 | Product dashboard redesign | ✅ Done | `d16e51b` | Modern UI for product management |
| 3.5.6 | Drag & drop image upload | ✅ Done | `d16e51b` | Client-side compression (1200px max, JPEG 0.7), max 8 images, 5MB limit |
| 3.5.7 | Smart variant creator | ✅ Done | `d16e51b` | Bulk size×color matrix creation with preset prices |
| 3.5.8 | Interactive image gallery | ✅ Done | `6f16677` | Click thumbnails, swipe gestures, arrow navigation |

**UI Polish complete — 2026-02-24**

---

## Phase 3.6 — Trust & Discovery ✅

> Shop profiles, location/maps, catalog search, share buttons, settings redesign.

| # | Task | Status | Commit | Notes |
|---|------|--------|--------|-------|
| 3.6.1 | Schema migration — 12 new Shop fields | ✅ Done | `1734222` | address, city, province, lat/lng, aboutText, businessHours, social links, isVerified, bannerUrl |
| 3.6.2 | Shop settings Zod schema | ✅ Done | `1734222` | Province/city validation, social URL validation |
| 3.6.3 | Shop settings server action | ✅ Done | `1734222` | `updateShopSettings()` in `lib/actions/shop-settings.ts` |
| 3.6.4 | Shop settings page | ✅ Done | `1734222` | `/dashboard/[slug]/settings` route |
| 3.6.5 | Shop profile component | ✅ Done | `1734222` | Public-facing shop info display |
| 3.6.6 | Catalog search & filter | ✅ Done | `1734222` | Client-side search, price range, category filter |
| 3.6.7 | Share product buttons | ✅ Done | `1734222` | WhatsApp + copy link sharing |
| 3.6.8 | Trust indicators in catalog layout | ✅ Done | `1734222` | Verified badge, location display |
| 3.6.9 | Settings page — mind-blowing redesign | ✅ Done | `c192f9a` | Dark gradient hero, SVG completeness ring, accordion sections, GPS auto-detect, city→province linking, toggle switches, 3 hour presets, branded social icons, floating sticky save bar, success toast, character counters |

**Trust & Discovery complete — 2026-02-24**

---

## Phase 3.7 — Dashboard Redesign ✅

> Rich data overview, polished navigation, and pro-level dashboard layout.

| # | Task | Status | Commit | Notes |
|---|------|--------|--------|-------|
| 3.7.1 | Dashboard stats data layer | ✅ Done | `aaf37fb` | `getDashboardStats()` — 5 parallel DB queries (products, variants, stock, prices, recent) |
| 3.7.2 | Overview page redesign | ✅ Done | `aaf37fb` | Dark gradient hero, 4 stat cards, profile completeness CTA, share catalog + WhatsApp share, recent products with thumbnails, quick actions grid, getting started tips |
| 3.7.3 | Dashboard layout redesign | ✅ Done | `aaf37fb` | Glassmorphism header, `backdrop-blur-xl`, branded TradeFeed logo, breadcrumb nav |
| 3.7.4 | Active state navigation | ✅ Done | `aaf37fb` | Client `DashboardNav` component with `usePathname()`, icon nav links, emerald active styling |
| 3.7.5 | Copy-to-clipboard component | ✅ Done | `aaf37fb` | Reusable `CopyButton` with checkmark animation + fallback |

**Dashboard Redesign complete — 2026-02-24**

---

## Phase 4 — Media & Categories ✅

> CDN image upload via Uploadthing, category management, product edit form.

### 4A — Uploadthing CDN Images ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4A.1 | Install `uploadthing` + `@uploadthing/react` packages | ✅ Done | 18 packages added |
| 4A.2 | Uploadthing FileRouter (`app/api/uploadthing/core.ts`) | ✅ Done | `productImageUploader` endpoint: image, 4MB max, 8 per batch, Clerk auth middleware |
| 4A.3 | Route handler (`app/api/uploadthing/route.ts`) | ✅ Done | `createRouteHandler()` exporting GET + POST |
| 4A.4 | Typed React hooks (`lib/uploadthing.ts`) | ✅ Done | `useUploadThing`, `UploadButton`, `UploadDropzone` all typed to `OurFileRouter` |
| 4A.5 | Server-side UTApi (`lib/ut-api.ts`) | ✅ Done | `UTApi` instance for server-side file deletion |
| 4A.6 | Clerk middleware updated | ✅ Done | `/api/uploadthing(.*)` added to public routes |
| 4A.7 | Prisma schema — `key` field on `ProductImage` | ✅ Done | Stores Uploadthing file key for CDN deletion |
| 4A.8 | Rewrote image upload action | ✅ Done | `saveProductImagesAction()` receives CDN URLs (no more base64). `deleteProductImageAction()` removes from CDN + DB. |
| 4A.9 | Rewrote image upload component | ✅ Done | `useUploadThing` hook, real progress bar, CDN upload, client-side compression preserved |
| 4A.10 | `.env.example` updated | ✅ Done | `UPLOADTHING_TOKEN` (single token, not secret+appId) |

### 4B — Category Management ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4B.1 | Category Zod validation schema | ✅ Done | `lib/validation/category.ts` — name: 2-100 chars |
| 4B.2 | Category data access layer | ✅ Done | `lib/db/categories.ts` — getCategories, createCategory, updateCategory, deleteCategory with auto-slug |
| 4B.3 | Category server actions | ✅ Done | `app/actions/category.ts` — create, update, delete with auth |
| 4B.4 | Category manager component | ✅ Done | `components/category/category-manager.tsx` — inline add/rename/delete, product count badges |
| 4B.5 | Categories dashboard page | ✅ Done | `/dashboard/[slug]/categories` — stats (total, with products, empty), full CRUD |
| 4B.6 | Dashboard nav updated | ✅ Done | "Categories" link with tag icon added to `DashboardNav` |

### 4C — Product Edit & Category Assignment ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4C.1 | Category dropdown on create product form | ✅ Done | Select category when creating products (optional) |
| 4C.2 | Create product page fetches categories | ✅ Done | Server-side category fetch, passed as props |
| 4C.3 | Edit product form component | ✅ Done | `components/product/edit-product-form.tsx` — inline toggle view/edit, name, description, category, isActive |
| 4C.4 | Product detail page integration | ✅ Done | Edit form in right column, categories fetched server-side |

**Phase 4 complete — 2026-02-25** 🎉

---

## Phase 5 — Monetisation ✅

> Subscription billing with PayFast for SA-native payments.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Subscription schema (Plan + Subscription models) | ✅ Done | Plan tiers, SubscriptionStatus enum, PayFast token storage |
| 5.2 | PayFast integration | ✅ Done | `lib/payfast.ts` — checkout URL builder, ITN validation, MD5 signatures |
| 5.3 | PayFast ITN webhook | ✅ Done | `app/api/webhooks/payfast/route.ts` — handles COMPLETE + CANCELLED |
| 5.4 | Free tier gate (10 products) | ✅ Done | `checkProductLimit()` enforced in `createProductAction` |
| 5.5 | Pro tier unlock (R199/mo) | ✅ Done | Unlimited products via `upgradeSubscription()` |
| 5.6 | Billing dashboard page | ✅ Done | `/dashboard/[slug]/billing` — plan cards, usage meter, upgrade CTA |
| 5.7 | Auto-assign free plan on shop creation | ✅ Done | `createShopAction` → `createFreeSubscription()` |
| 5.8 | Plan seed script | ✅ Done | `scripts/seed-plans.ts` — idempotent Free + Pro upsert, `npm run seed:plans` |
| 5.9 | POPIA compliance audit | ⬜ Todo | Privacy policy, data deletion, consent — deferred |

**Phase 5 complete — 2026-02-26** 🎉

---

## Phase 6 — Scale & Intelligence (Partial) ✅

> Analytics, rate limiting, and performance. WhatsApp Business API + admin deferred.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Analytics schema (AnalyticsEvent model) | ✅ Done | EventType enum: PAGE_VIEW, PRODUCT_VIEW, WHATSAPP_CLICK, WHATSAPP_CHECKOUT |
| 6.2 | Analytics data layer | ✅ Done | `lib/db/analytics.ts` — trackEvent, getAnalyticsOverview, getDailyAnalytics, getTopProducts, getUniqueVisitors |
| 6.3 | Catalog view tracking | ✅ Done | Fire-and-forget `trackEvent()` on catalog + product detail pages |
| 6.4 | WhatsApp click + checkout tracking | ✅ Done | Server actions in `app/actions/analytics.ts`, tracked in cart-panel checkout |
| 6.5 | Analytics dashboard for sellers | ✅ Done | `/dashboard/[slug]/analytics` — stat cards, bar chart (pure CSS/SVG), top products, period toggle |
| 6.6 | Rate limiting on public routes | ✅ Done | `lib/rate-limit.ts` — in-memory sliding window, catalog: 60 req/min, API: 30 req/min |
| 6.7 | WhatsApp Business API integration | ⬜ Todo | Order confirmations, delivery updates — deferred |
| 6.8 | Admin dashboard (cross-tenant) | ⬜ Todo | Platform metrics, seller management — deferred |
| 6.9 | Seller verification flow | ⬜ Todo | `isVerified` admin approval, trust badge — deferred |
| 6.10 | SEO optimization | ✅ Done | Moved to Phase 7 — see below |

**Phase 6 (Tier 2 items) complete — 2026-02-26** 🎉

---

## Phase 7 — SEO & Discovery ✅

> Search engine optimization for organic traffic via Google and WhatsApp link previews.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | Dynamic OG image API | ✅ Done | `app/api/og/route.tsx` — Edge runtime, shop + product OG images |
| 7.2 | OG metadata in catalog layout | ✅ Done | Dynamic OpenGraph + Twitter card images for WhatsApp previews |
| 7.3 | OG metadata in product pages | ✅ Done | Product image, price, shop name in OG cards |
| 7.4 | JSON-LD structured data | ✅ Done | `lib/seo/json-ld.ts` — LocalBusiness + Product + BreadcrumbList |
| 7.5 | Dynamic sitemap | ✅ Done | `app/sitemap.ts` — all active shops + products, auto-updating |
| 7.6 | robots.txt | ✅ Done | `app/robots.ts` — allows crawlers on public, blocks dashboard/admin |

**Phase 7 complete — 2026-02-26** 🎉

---

## Phase 8 — Admin & Compliance ✅

> Platform admin dashboard for seller verification and POPIA compliance.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.1 | Admin auth (env-based) | ✅ Done | `lib/auth/admin.ts` — ADMIN_USER_IDS env var, `isAdmin()`, `requireAdmin()` |
| 8.2 | Admin data layer | ✅ Done | `lib/db/admin.ts` — getAdminStats, getAdminShops (search/filter/paginate), setShopVerified, setShopActive |
| 8.3 | Admin server actions | ✅ Done | `app/actions/admin.ts` — verify, unverify, deactivate, reactivate shops |
| 8.4 | Admin layout | ✅ Done | `app/admin/layout.tsx` — dark theme, admin auth gate, branded header |
| 8.5 | Admin dashboard page | ✅ Done | `app/admin/page.tsx` — platform stats, shop list with search/filter/pagination |
| 8.6 | Admin shop list component | ✅ Done | `components/admin/admin-shop-list.tsx` — verify/unverify/activate/deactivate toggles |
| 8.7 | Privacy policy (POPIA) | ✅ Done | `app/privacy/page.tsx` — 11-section SA POPIA-compliant policy |
| 8.8 | Terms of service | ✅ Done | `app/terms/page.tsx` — 12-section TOS with SA law references |
| 8.9 | Cookie consent banner | ✅ Done | `components/cookie-consent.tsx` — dismissible, localStorage persistence |
| 8.10 | Legal links in catalog footer | ✅ Done | Privacy + Terms links in catalog footer |

**Phase 8 complete — 2026-02-26** 🎉

---

## Complete Git Log

| Commit | Message | Date |
|--------|---------|------|
| `d80e07b` | feat: Tier 3 — SEO, admin dashboard, POPIA compliance | 2026-02-26 |
| `e2dce75` | feat: Tier 2 — analytics dashboard, rate limiting, PayFast subscriptions | 2026-02-26 |
| `42b7883` | feat: Tier 1 quick wins — image migration script | 2026-02-25 |
| `aaf37fb` | feat: redesign dashboard overview & layout with rich stats, active nav, share catalog | 2026-02-24 |
| `c192f9a` | style: mind-blowing settings page redesign | 2026-02-24 |
| `1734222` | feat: trust & discovery — shop profiles, maps, search, share buttons | 2026-02-24 |
| `6f16677` | fix: interactive image gallery — click thumbnails, swipe, arrows | 2026-02-24 |
| `d16e51b` | feat: product dashboard redesign — image upload, smart variants, modern UI | 2026-02-24 |
| `e8b2e55` | feat: Phase 3 — Clerk auth, webhook user sync, route protection, role-based access | 2026-02-24 |
| `28f34f9` | style: UI polish — shimmer loading, image gallery, refined cards, loading skeletons | 2026-02-24 |
| `0b3044a` | chore: update phase tracker — 2D checkout complete, Phase 2 done | 2026-02-24 |
| `2f0bf30` | feat: WhatsApp structured checkout — cart, add-to-cart, panel, message builder | 2026-02-24 |
| `9512485` | chore: update phase tracker — 2C public catalog complete | 2026-02-23 |
| `292862e` | feat: public catalog — storefront layout, product grid, detail page, WhatsApp order | 2026-02-23 |
| `6ef3224` | chore: add phase tracker to docs | 2026-02-23 |
| `f30ab1d` | feat: product CRUD — validation, data access, server actions, dashboard UI | 2026-02-23 |
| `21bccd2` | feat: shop creation — Zod validation, data access, server action, UI form | 2026-02-23 |
| `8259e30` | fix: postcss ESM export, add Neon DB, run init migration | 2026-02-23 |
| `ca615bf` | feat: Phase 1 foundation — schema, project structure, config | 2026-02-23 |

---

## Architecture Summary

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript (strict) | `noUncheckedIndexedAccess: true` |
| ORM | Prisma | v6.x (v7 breaks `url` in datasource) |
| Database | PostgreSQL (Neon) | `eu-central-1`, connection pooling |
| Auth | Clerk | `@clerk/nextjs` v6.38.2 |
| Image CDN | Uploadthing | `uploadthing` + `@uploadthing/react` |
| CSS | Tailwind CSS v4 + shadcn/ui | PostCSS ESM |
| Validation | Zod v4 | Issues use `PropertyKey[]` for path |
| Deployment | Vercel (planned) | — |

### Project Stats

| Category | Count |
|----------|-------|
| Prisma models | 10 (Shop, User, ShopUser, Category, Product, ProductImage, ProductVariant, AnalyticsEvent, Plan, Subscription) |
| Enums | 3 (`UserRole`, `EventType`, `SubscriptionStatus`) |
| App routes (pages) | 18 |
| API routes | 5 (Clerk webhook, Uploadthing, PayFast ITN, OG image, sitemap/robots) |
| Server actions | 24 functions across 8 files |
| Data access functions | 40 across 8 files (`shops`, `products`, `catalog`, `variants`, `categories`, `analytics`, `subscriptions`, `admin`) |
| Zod schemas | 8 |
| Components | 42 files across 9 directories (`ui`, `shop`, `dashboard`, `product`, `catalog`, `category`, `analytics`, `billing`, `admin`) |
| shadcn components | button, input, label, card, form, textarea, badge, copy-button |
| Locked decisions | 14 (in `docs/DECISIONS.md`) |

### Data Layer Map

```
lib/db/
├── prisma.ts          — Prisma client singleton
├── shops.ts           — createShop, getShopBySlug, updateShopSettings, getShopForUser, getShopsForUser, getDashboardStats
├── products.ts        — createProduct, getProducts, getProduct, updateProduct, deleteProduct, countProducts
├── catalog.ts         — getPublicShop, getPublicProducts, getPublicProduct, countActiveProducts
├── variants.ts        — createVariant, updateVariant, deleteVariant, bulkCreateVariants
├── categories.ts      — getCategories, getCategory, createCategory, updateCategory, deleteCategory
├── analytics.ts       — trackEvent, getAnalyticsOverview, getDailyAnalytics, getTopProducts, getUniqueVisitors
├── subscriptions.ts   — getFreePlan, getPlans, getShopSubscription, createFreeSubscription, upgradeSubscription, cancelSubscription, checkProductLimit
└── admin.ts           — getAdminStats, getAdminShops, setShopVerified, setShopActive

app/actions/
├── shop.ts            — createShopAction (+ auto-assign free subscription)
├── shop-settings.ts   — updateShopSettingsAction
├── product.ts         — createProduct (+ product limit check), updateProduct, deleteProduct, addVariant, deleteVariant, bulkCreateVariants
├── image.ts           — saveProductImages (CDN URLs), deleteProductImage (CDN + DB)
├── category.ts        — createCategory, updateCategory, deleteCategory
├── analytics.ts       — trackWhatsAppClickAction, trackWhatsAppCheckoutAction
├── billing.ts         — createCheckoutAction, cancelSubscriptionAction
└── admin.ts           — verifyShopAction, unverifyShopAction, deactivateShopAction, reactivateShopAction

lib/auth/index.ts      — getUser, requireUser, requireShopAccess
lib/auth/admin.ts      — isAdmin, requireAdmin (env-based ADMIN_USER_IDS)
lib/seo/json-ld.ts     — generateShopJsonLd, generateProductJsonLd
lib/uploadthing.ts     — useUploadThing, UploadButton, UploadDropzone (typed to OurFileRouter)
lib/ut-api.ts          — UTApi instance (server-side file deletion)
lib/payfast.ts         — buildPayFastCheckoutUrl, validatePayFastITN, generateSignature
lib/rate-limit.ts      — rateLimit (sliding window), getRateLimitKey
proxy.ts               — clerkMiddleware, rate limiting (catalog 60/min, API 30/min), public routes
```

### Route Map

```
Public:
  /                                    — Landing → redirect to create-shop
  /sign-in/[[...sign-in]]             — Clerk sign-in
  /sign-up/[[...sign-up]]             — Clerk sign-up
  /catalog/[slug]                      — Public shop storefront (+ PAGE_VIEW tracking + JSON-LD)
  /catalog/[slug]/products/[productId] — Public product detail (+ PRODUCT_VIEW tracking + JSON-LD)
  /privacy                             — POPIA privacy policy
  /terms                               — Terms of service
  /sitemap.xml                         — Dynamic sitemap (all shops + products)
  /robots.txt                          — Crawler rules

Protected (require Clerk auth):
  /create-shop                         — Shop creation form (+ auto-assign free plan)
  /dashboard/[slug]                    — Dashboard overview (rich stats)
  /dashboard/[slug]/products           — Product list
  /dashboard/[slug]/products/new       — Create product form (with category dropdown + product limit)
  /dashboard/[slug]/products/[id]      — Product detail + edit form + variants
  /dashboard/[slug]/categories         — Category management (CRUD)
  /dashboard/[slug]/analytics          — Analytics dashboard (views, clicks, top products, period toggle)
  /dashboard/[slug]/billing            — Billing dashboard (plan cards, usage meter, PayFast upgrade)
  /dashboard/[slug]/settings           — Shop settings (profile, location, social)

Admin (require Clerk auth + ADMIN_USER_IDS):
  /admin                               — Platform admin dashboard (stats, shop list, verify/deactivate)

API:
  /api/webhooks/clerk                  — Clerk webhook (user.created/updated/deleted)
  /api/webhooks/payfast                — PayFast ITN webhook (subscription COMPLETE/CANCELLED)
  /api/uploadthing                     — Uploadthing file upload endpoint (GET + POST)
  /api/og                              — Dynamic OG image generation (Edge runtime)
```

### Known Technical Debt

| Issue | Severity | Notes |
|-------|----------|-------|
| ~~**Base64 images in DB**~~ | ✅ Fixed | Swapped to Uploadthing CDN in Phase 4. Migration script created: `npm run migrate:images`. |
| ~~**No category management UI**~~ | ✅ Fixed | Full CRUD at `/dashboard/[slug]/categories`, dropdown on create/edit forms. |
| ~~**No product edit form**~~ | ✅ Fixed | Inline edit form on product detail page. |
| ~~**Base64 → CDN migration script**~~ | ✅ Fixed | `scripts/migrate-images.ts` — one-time script uploads base64 images to Uploadthing CDN. |
| ~~**Catalog category filter**~~ | ✅ Fixed | Category pills on public catalog, client-side filtering in `catalog-search-filter.tsx`. |
| ~~**Product sorting**~~ | ✅ Fixed | Sort dropdown (newest, price low→high, price high→low, A→Z) in `catalog-search-filter.tsx`. |
| ~~**No rate limiting**~~ | ✅ Fixed | In-memory sliding window rate limiter. Catalog: 60 req/min, API: 30 req/min. Upgrade to Upstash for serverless. |
| ~~**Legacy `lib/dev-auth.ts`**~~ | ✅ Fixed | Deleted — no longer exists. |
| **Cart — no server validation** | 🟢 Low | Stock quantities validated client-side only. |
| **Rate limiter — in-memory** | 🟢 Low | Works single-instance. Upgrade to Upstash Redis for multi-instance serverless. |
| ~~**POPIA compliance**~~ | ✅ Fixed | Privacy policy + terms of service pages. Cookie consent banner. Legal links in footer. |

---

## What's Next — Priority Roadmap

### ✅ Tier 1 Quick Wins — COMPLETE

1. ~~**Base64 → CDN migration script**~~ — `scripts/migrate-images.ts` created. Run `npm run migrate:images`.
2. ~~**Catalog category filter**~~ — Category pills on public catalog (already built in Phase 3.6).
3. ~~**Product sorting**~~ — Sort dropdown on public catalog (already built in Phase 3.6).

### ✅ Tier 2 Revenue & Intelligence — COMPLETE

4. ~~**Simple analytics**~~ — Catalog views + WhatsApp click tracking + seller analytics dashboard.
5. ~~**PayFast subscriptions**~~ — Free (10 products) → Pro R199/mo (unlimited). Billing page + ITN webhook.
6. ~~**Rate limiting**~~ — In-memory sliding window on catalog (60/min) + API (30/min) routes.

### ✅ Tier 3 — SEO, Admin & Compliance — COMPLETE

7. ~~**SEO + OG images**~~ — Dynamic OG images (Edge), JSON-LD structured data, sitemap.xml, robots.txt.
8. ~~**Seller verification admin flow**~~ — Platform admin dashboard with verify/unverify/activate/deactivate.
9. ~~**POPIA compliance**~~ — Privacy policy, terms of service, cookie consent banner.

### 🟡 Tier 4 — Advanced Features (Future)

10. **WhatsApp Business API** — Automated order confirmations + delivery updates.
11. **Advanced admin** — Financial reports, revenue tracking, seller analytics.
12. **Multi-shop support** — One user managing multiple shops.
13. **Buyer accounts** — Order history, favourites, saved carts.
