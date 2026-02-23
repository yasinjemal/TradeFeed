# TradeFeed — Technical & Business Decisions

> Every decision here is locked unless explicitly revisited.
> Changing a decision requires a written reason and impact analysis.

---

## D-001: Framework — Next.js 14+ (App Router)

**Decision:** Use Next.js with App Router for the full-stack application.

**Why:**
- Server Components reduce client bundle (critical for mobile-first SA users on data budgets)
- API routes co-located with app
- Built-in SSR for public catalog pages (SEO + performance)
- Vercel deployment simplifies ops for a 2-person team
- TypeScript-first

**Alternatives rejected:**
- Remix — smaller ecosystem, less deployment flexibility
- Plain React + Express — more ops burden, no SSR benefit for catalog

---

## D-002: ORM — Prisma

**Decision:** Prisma ORM with PostgreSQL.

**Why:**
- Type-safe database access (aligns with strict TypeScript)
- Schema-as-code with migration support
- Excellent multi-tenant row-level filtering
- Mature, well-documented

**Risk:** Prisma can be slow on cold starts (serverless). Acceptable for MVP.

---

## D-003: Database — PostgreSQL (Single DB, Row-Level Isolation)

**Decision:** One PostgreSQL database. Tenant isolation via `shopId` foreign key on every tenant-scoped table.

**Why:**
- Schema-per-tenant is over-engineered for MVP
- DB-per-tenant is expensive and complex
- Row-level with strict `shopId` filtering is proven at scale (up to ~10K tenants)
- Every query MUST include `WHERE shopId = <current_shop_id>`

**Rule:** No query on a tenant-scoped table may omit `shopId`. This is enforced at the data access layer, not the UI.

---

## D-004: Authentication — Clerk

**Decision:** Use Clerk for authentication and user management.

**Why:**
- Handles signup, login, session management, JWT
- Webhook support for syncing users to our DB
- Multi-tenant org support built-in
- Reduces auth surface area we need to secure
- SA phone number support

**Phase:** Implemented in Phase 3. Phase 2 uses seed data / dev bypass.

---

## D-005: Validation — Zod

**Decision:** All input validation uses Zod schemas. Centralized in `/lib/validation/`.

**Why:**
- Runtime type checking (TypeScript types are compile-time only)
- Composable, reusable schemas
- Integrates with React Hook Form and server actions
- Single source of truth for validation rules

**Rule:** No raw `req.body` access. All inputs pass through Zod `.parse()` or `.safeParse()`.

---

## D-006: Currency — ZAR Only

**Decision:** All monetary values stored and displayed in South African Rand (ZAR).

**Why:**
- Target market is South Africa only (Phase 1-3)
- Multi-currency adds complexity with zero current value
- Prices stored as integers (cents) to avoid floating point issues

**Format:** `priceInCents: Int` in DB. Display as `R 299.99` in UI.

---

## D-007: Multi-Tenant Architecture

**Decision:** Shared database, shared schema, row-level isolation via `shopId`.

**Model:**
```
User → belongs to → Shop (via ShopUser join table)
Shop → has many → Products
Product → has many → Variants
Variant → has → Stock
```

**Rules:**
- Every tenant-scoped model has a `shopId` field
- Data access functions accept `shopId` as required parameter
- No admin "super query" that returns cross-tenant data (until Phase 5)
- `ShopUser` join table enforces user-to-shop membership with role

---

## D-008: WhatsApp Integration — URL Scheme (No API)

**Decision:** MVP uses `https://wa.me/<number>?text=<encoded_message>` for checkout.

**Why:**
- Zero cost
- No WhatsApp Business API approval needed
- No message template approval
- Works immediately
- Sufficient for structured order sending

**Future:** WhatsApp Business API in Phase 5 for delivery updates, order confirmation.

---

## D-009: Image Storage — Uploadthing (or Cloudinary)

**Decision:** Use Uploadthing for product image uploads. Cloudinary as fallback.

**Why:**
- Next.js native integration
- Handles resize, CDN, optimization
- Free tier sufficient for MVP
- Avoids storing blobs in PostgreSQL

**Rule:** Never store images in the database. Store URL references only.

---

## D-010: Deployment — Vercel + Supabase (or Neon)

**Decision:** Deploy app on Vercel. Database on Supabase or Neon PostgreSQL.

**Why:**
- Vercel: zero-config Next.js deployment, edge functions, preview deploys
- Supabase/Neon: managed Postgres, free tier, connection pooling
- Both have generous free tiers for MVP validation

---

## D-011: POPIA Compliance Awareness

**Decision:** All features must consider POPIA (Protection of Personal Information Act) from Day 1.

**Requirements:**
- WhatsApp numbers are personal information — stored encrypted at rest
- Users must consent to data collection during signup
- Sellers must have ability to delete their shop and all associated data
- No cross-tenant data exposure under any circumstance
- Privacy policy required before public launch

**Phase:** Full compliance audit in Phase 4. Awareness enforced from Phase 1.

---

## D-012: Mobile-First UI — Tailwind CSS + shadcn/ui

**Decision:** Use Tailwind CSS with shadcn/ui components.

**Why:**
- Utility-first CSS is fast to iterate
- shadcn/ui gives accessible, customizable components (not a dependency — copied into project)
- Mobile-first responsive design by default
- Consistent design system without a designer

---

## D-013: No `any` — TypeScript Strict Mode

**Decision:** `tsconfig.json` uses `strict: true`. Zero `any` types allowed.

**Why:**
- `any` defeats the purpose of TypeScript
- Strict mode catches bugs at compile time
- Multi-tenant apps need maximum type safety (a `shopId` typo = data leak)

**Rule:** If a type is unknown, use `unknown` and narrow. Never `any`.

---

## D-014: Project Structure

```
/app                    → Next.js App Router pages & layouts
/app/api                → API routes
/components             → Reusable UI components
/lib                    → Business logic, utilities
/lib/db                 → Prisma client, data access functions
/lib/validation         → Zod schemas
/lib/auth               → Auth helpers, tenant context
/types                  → Shared TypeScript types
/prisma                 → Schema, migrations, seed
/manager                → Project docs (vision, decisions, rules)
/docs                   → Technical documentation
/public                 → Static assets
```

**Rule:** Business logic NEVER lives in UI components. Components call functions from `/lib`.
