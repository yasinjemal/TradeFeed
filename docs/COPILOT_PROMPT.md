# TradeFeed — Copilot Session Prompt

> Copy everything below this line and paste it at the start of a new Copilot chat session.

---

## 🧠 PROJECT CONTEXT

You are working on **TradeFeed** — a WhatsApp-first multi-tenant SaaS platform for South African wholesalers. Sellers create storefronts, buyers browse and order via WhatsApp. Live at **tradefeed.co.za**.

**Workspace:** `E:\apps\whatsapp-clone-market-place`
**Repo:** `github.com/yasinjemal/TradeFeed` (branch: `main`)
**OS:** Windows (PowerShell)

## 🏗️ TECH STACK (do NOT deviate)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript (strict) | 5.x |
| ORM | Prisma | 6.19.2 |
| Database | PostgreSQL | Neon (serverless) |
| Auth | Clerk (`@clerk/nextjs`) | 6.38.2 |
| Styling | Tailwind CSS | 4.x |
| Uploads | UploadThing | utfs.io / *.ufs.sh |
| Payments | PayFast | ZAR only |
| Analytics | GA4 | G-TL499XE6KR |
| Toasts | sonner | — |
| PWA | Custom SW | public/sw.js |

## 📐 ARCHITECTURE RULES (enforce strictly)

1. **App Router only** — no `pages/` directory. All routes in `app/`.
2. **Server Components by default** — only add `"use client"` when you need interactivity.
3. **Server Actions in `app/actions/`** — never call Prisma directly from components.
4. **Data access in `lib/db/`** — one file per domain (shops.ts, products.ts, variants.ts, orders.ts, etc.).
5. **Validation in `lib/validation/`** — Zod schemas. Price input in Rands → transform to cents.
6. **Multi-tenant auth** — every mutation calls `requireShopAccess(slug)` from `lib/auth.ts` before touching data.
7. **Dependency injection** — server actions accept a `deps` parameter for testability (see `app/actions/product.ts` pattern).
8. **Images** — always use `next/image` with `Image` import. Remote patterns: img.clerk.com, images.unsplash.com, utfs.io, *.ufs.sh.
9. **Currency** — all prices stored as integer cents (ZAR). Display via `formatZAR()` from `@/types`.
10. **Middleware** — file is `middleware.ts` (Next.js 16 warns to rename to proxy.ts — ignore the warning, current name works). Has CSP headers, rate limiting, Clerk auth.
11. **Error boundaries** — `global-error.tsx` + per-route `error.tsx` files exist.
12. **SEO** — JSON-LD generators in `lib/seo/json-ld.ts`. Canonical URLs on all public pages. OG images via `/api/og`.

## 🎨 DESIGN SYSTEM

- **Colors:** Stone (neutrals) + Emerald (primary/success) + Red (danger) + Amber (warning)
- **Radius:** `rounded-xl` for cards, `rounded-2xl` for sections, `rounded-full` for badges/pills
- **Mobile-first:** Design for phone screens (SA wholesaler market), enhance for desktop
- **Typography:** Tight tracking on headings (`tracking-tight`), stone-500 for secondary text
- **Hover states:** Subtle shadow + slight translate (`hover:-translate-y-0.5 hover:shadow-md`)

## 📂 KEY FILE MAP

```
app/
  actions/          → Server actions (product.ts, orders.ts, bulk-import.ts)
  api/              → API routes (health, og, webhooks, cron, uploadthing)
  catalog/[slug]/   → Public storefront (buyer-facing)
  dashboard/[slug]/ → Seller dashboard (auth-gated)
  marketplace/      → Public discovery page
  admin/            → Platform admin

components/
  catalog/          → Buyer-facing (cart-panel, shop-profile, etc.)
  dashboard/        → Seller nav (dashboard-nav, shop-switcher, mobile-menu)
  product/          → Product management (variant-grid, bulk-editor, image-upload)
  marketplace/      → Discovery (marketplace-shell, filters)
  bulk-import/      → CSV import
  orders/           → Order management dashboard
  reviews/          → Product reviews
  ui/               → Shared primitives (badge, copy-button)

lib/
  db/               → Data access layer (one file per domain)
  validation/       → Zod schemas
  seo/              → JSON-LD generators
  cart/             → Cart context (localStorage-persisted)
  csv/              → CSV parser for bulk import
  config/           → Category variant presets

prisma/
  schema.prisma     → 18+ models, 40+ indexes
```

## ✅ WHAT'S ALREADY BUILT (don't rebuild these)

- Cart persistence (localStorage per shop slug)
- Breadcrumb + Product JSON-LD with AggregateRating
- Per-shop OG image generation
- Order status transitions (PENDING → CONFIRMED → SHIPPED → DELIVERED)
- Low stock alerts + notifications page
- Full-text search (ILIKE)
- Bulk CSV import with validation + preview
- Multi-shop switcher (ShopSwitcher component)
- Variant bulk editor (inline price/stock/SKU table)
- ISR (marketplace 5min, catalog 60s)
- Enhanced service worker (stale-while-revalidate + image cache)
- Health endpoint (/api/health)
- POPIA data retention cron (/api/cron/data-retention)
- Canonical URLs on all public pages
- Buyer note textarea in cart
- GA4 with POPIA cookie consent
- PWA with offline fallback
- WhatsApp catalog share + order notifications
- Quick reorder + trust badges
- Referral program (schema + dashboard page)
- PayFast payment integration

## 📋 REMAINING P3 ROADMAP (see docs/P3_ROADMAP.md)

**Not started (need external setup):**
- 1.1 Upstash Redis rate limiter (needs Upstash credentials)
- 1.3 Edge Runtime for middleware (depends on 1.1)
- 7.1 Sentry error tracking (needs Sentry DSN)
- 4.1 WhatsApp Business API (needs Meta verification)
- 7.5 Staging environment (Vercel + Neon branch)

**Not started (implementable):**
- 1.4 Image placeholder blur (blurDataURL)
- 2.1 CSP nonce for inline scripts
- 2.3 SRI for external scripts
- 4.2 Buyer accounts + order history
- 4.6 Multi-language (i18n — Zulu, Afrikaans, Xhosa)
- 6.1 Promotion analytics deep-dive
- 6.2 Referral rewards automation
- 6.3 Featured listings (paid boost)
- 7.4 Automated E2E tests (Playwright)

## 🔧 HOW I WANT YOU TO WORK

1. **Research before coding** — always read the relevant files first. Don't assume structure.
2. **Use the todo list** — break work into tasks, mark them as you go. I want visibility.
3. **Build after every change set** — run `npx next build` to catch TypeScript errors immediately.
4. **Commit with conventional commits** — `feat:`, `fix:`, `docs:`, `refactor:`. Descriptive body.
5. **Push to main** after successful build.
6. **Update docs/P3_ROADMAP.md** status icons when completing items.
7. **Don't create documentation files** unless I ask — put effort into code, not READMEs.
8. **Match existing patterns** — look at how similar features are built before writing new ones.
9. **South African context** — ZAR currency, POPIA compliance, load shedding resilience, mobile-first for SA networks.

## 💬 MY REQUEST

[Describe what you want here — be specific about the feature, bug fix, or enhancement]
