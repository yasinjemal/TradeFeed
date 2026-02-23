# TradeFeed — Phase Tracker

> Single source of truth for project progress.
> Updated after every completed feature.
> Last updated: **2026-02-23**

---

## Phase Overview

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | Foundation | ✅ Complete | Schema, project structure, database, config |
| 2 | Core Commerce | 🔄 In Progress | Shop, products, catalog, WhatsApp checkout |
| 3 | Auth & Security | ⬜ Not Started | Clerk auth, role-based access, rate limiting |
| 4 | Monetisation | ⬜ Not Started | PayFast billing, subscription tiers |
| 5 | Scale & Intelligence | ⬜ Not Started | Analytics, WhatsApp Business API, admin |

---

## Phase 1 — Foundation ✅

> Project scaffolding, database schema, tooling, and configuration.

| # | Task | Status | Commit | Notes |
|---|------|--------|--------|-------|
| 1.1 | Manager docs (VISION, DECISIONS, AI_RULES) | ✅ Done | `ca615bf` | Project charter locked |
| 1.2 | Next.js 16 + TypeScript strict scaffolding | ✅ Done | `ca615bf` | App Router, Turbopack, `noUncheckedIndexedAccess` |
| 1.3 | Prisma schema (7 models) | ✅ Done | `ca615bf` | Shop, User, ShopUser, Category, Product, ProductImage, ProductVariant |
| 1.4 | Tailwind v4 + shadcn/ui setup | ✅ Done | `ca615bf` | PostCSS ESM fix applied |
| 1.5 | Neon PostgreSQL connection | ✅ Done | `8259e30` | `eu-central-1`, connection pooling |
| 1.6 | Initial migration (`init-foundation`) | ✅ Done | `8259e30` | All 7 tables created |
| 1.7 | Dev seed user | ✅ Done | `8259e30` | `yasin@tradefeed.dev`, ID: `cmlzn0ymo0000uyvgep882qyv` |

**Phase 1 complete — 2026-02-23**

---

## Phase 2 — Core Commerce 🔄

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
| 2B.4 | Product + Variant server actions | ✅ Done | `f30ab1d` | 5 actions: CRUD product + add/delete variant |
| 2B.5 | Dashboard layout + navigation | ✅ Done | `f30ab1d` | Overview, Products, View Catalog nav links |
| 2B.6 | Product list page | ✅ Done | `f30ab1d` | Grid cards with price range, stock, active badge |
| 2B.7 | Create product form + page | ✅ Done | `f30ab1d` | `useActionState` → redirect to product detail |
| 2B.8 | Product detail page | ✅ Done | `f30ab1d` | Stats, variant table, add form, danger zone |
| 2B.9 | Variant list + delete button | ✅ Done | `f30ab1d` | Hover-reveal delete, confirm dialog |
| 2B.10 | Delete product button | ✅ Done | `f30ab1d` | Cascades variants + images |

**Product CRUD complete — 2026-02-23**

### 2C — Public Catalog Page ⬜

> Shareable storefront for buyers — the link sellers drop in WhatsApp groups.

| # | Task | Status | Commit | Notes |
|---|------|--------|--------|-------|
| 2C.1 | Public catalog route (`/catalog/[slug]`) | ⬜ | — | SSR for SEO + fast load on mobile data |
| 2C.2 | Catalog data access (public, read-only) | ⬜ | — | Only active products, no auth required |
| 2C.3 | Product grid UI (mobile-first) | ⬜ | — | Image, name, price range, variant count |
| 2C.4 | Product detail modal or page | ⬜ | — | Variant selector (size, color), stock check |
| 2C.5 | Shop header / branding | ⬜ | — | Shop name, description, WhatsApp badge |

### 2D — WhatsApp Structured Checkout ⬜

> Buyer selects items → generates pre-filled WhatsApp message → opens `wa.me` link.

| # | Task | Status | Commit | Notes |
|---|------|--------|--------|-------|
| 2D.1 | Cart state management (client-side) | ⬜ | — | `useContext` or Zustand, persisted to localStorage |
| 2D.2 | Add-to-cart UI on catalog | ⬜ | — | Size/color picker → add button |
| 2D.3 | Cart summary component | ⬜ | — | Item list, quantities, total in ZAR |
| 2D.4 | WhatsApp message builder | ⬜ | — | Structured text: items, sizes, total |
| 2D.5 | `wa.me` checkout button | ⬜ | — | `https://wa.me/{number}?text={encoded}` |
| 2D.6 | Cart empty state + clear | ⬜ | — | Guide buyer to browse catalog |

---

## Phase 3 — Auth & Security ⬜

> Replace dev auth with real Clerk authentication, role-based access.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Clerk integration + webhook user sync | ⬜ | Replace `getDevUserId()` |
| 3.2 | Protected routes middleware | ⬜ | Dashboard pages require auth |
| 3.3 | Role-based access (OWNER/MANAGER/STAFF) | ⬜ | ShopUser roles enforced on mutations |
| 3.4 | Session management + sign out | ⬜ | Clerk session handling |
| 3.5 | Rate limiting on public routes | ⬜ | Catalog + checkout abuse prevention |

---

## Phase 4 — Monetisation ⬜

> Subscription billing with PayFast for SA-native payments.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | PayFast integration | ⬜ | SA payment gateway, ZAR billing |
| 4.2 | Subscription tiers (Free / Pro) | ⬜ | Product count limits, feature gating |
| 4.3 | Billing dashboard | ⬜ | Current plan, invoice history |
| 4.4 | POPIA compliance audit | ⬜ | Privacy policy, data deletion, consent |

---

## Phase 5 — Scale & Intelligence ⬜

> Analytics, WhatsApp Business API, admin tooling.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Catalog view analytics | ⬜ | Page views, product clicks, conversion |
| 5.2 | WhatsApp Business API integration | ⬜ | Order confirmation, delivery updates |
| 5.3 | Admin dashboard (cross-tenant) | ⬜ | Platform metrics, seller management |
| 5.4 | Image optimization pipeline | ⬜ | Uploadthing/Cloudinary CDN |

---

## Git Log

| Commit | Message | Date |
|--------|---------|------|
| `f30ab1d` | feat: product CRUD — validation, data access, server actions, dashboard UI | 2026-02-23 |
| `21bccd2` | feat: shop creation — Zod validation, data access, server action, UI form | 2026-02-23 |
| `8259e30` | fix: postcss ESM export, add Neon DB, run init migration | 2026-02-23 |
| `ca615bf` | feat: Phase 1 foundation — schema, project structure, config | 2026-02-23 |

---

## Key Technical Notes

- **Dev server**: port 3005 (3000/3001 occupied)
- **Prisma**: Locked to v6.x (v7 breaks `url` in datasource)
- **Prisma types**: Inferred via `NonNullable<Awaited<ReturnType<...>>>` (v6 doesn't export model types)
- **Transaction typing**: `Omit<typeof db, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">`
- **Zod v4**: Issues use `PropertyKey[]` for path (not `(string | number)[]`)
- **PostCSS**: Must use ESM `export default` in `.mjs` config
- **shadcn components**: button, input, label, card, form, textarea, badge
