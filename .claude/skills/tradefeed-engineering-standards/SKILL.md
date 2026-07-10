---
name: tradefeed-engineering-standards
description: TradeFeed's coding conventions — folder structure, server actions, forms, validation, testing, performance budgets, and feature flags. Use this whenever writing or reviewing ANY code in this repo: new components, server actions, API routes, tests, database queries, or refactors — even small ones. It prevents reinventing existing patterns.
---

# TradeFeed Engineering Standards

## Stack (exact)

Next.js 16 App Router · React 19 · TypeScript 5.9 strict · Tailwind CSS v4 (CSS-first, no config file) · Prisma 6 + Neon Postgres · Clerk (auth) · UploadThing (images) · PayFast (payments) · next-intl (i18n) · sonner (toasts) · lucide-react (icons) · Sentry · Upstash (rate limiting) · OpenAI (AI features).

## Folder map

- `app/` — App Router. Route groups: `dashboard/[slug]` (seller, auth), `catalog/[slug]` (public storefront), `admin/`, `(public)/`, `marketplace/`, `pay/`, `track/`.
- `app/actions/` — ~35 server action files, one domain each.
- `components/<domain>/` — feature components; `components/ui/` — primitives; `components/tf/` — the TF design system (see tradefeed-design-system skill).
- `lib/` — `db/` (query layer), `validation/` (Zod schemas), `auth/permissions.ts` (RBAC), `config/` (feature-flags, themes), `cart/`, `seo/`, `ai/`, `billing/`, `whatsapp/`.
- `tests/` — unit tests; `e2e/` — Playwright specs; `prisma/` — schema + seed.

## Server actions — THE pattern (copy an existing file in `app/actions/`)

```
"use server" → requireShopAccess(slug, "permission:name") → Zod .safeParse
→ Prisma mutation → revalidatePath(...) → return { success } | { success: false, error }
```

- RBAC choke point: `requireShopAccess` from `lib/auth/permissions.ts` (roles OWNER/MANAGER/STAFF). Admin: `requireAdmin`.
- Validation is **Zod on the server** (`lib/validation/*`). Client-side validation is a UX nicety, never the safety mechanism.
- Return typed result objects; components surface errors via sonner or inline text. Never throw for expected failures.

## Components

- **Server components by default.** `"use client"` only for interactivity; keep client islands small and push data-fetching to the page.
- Forms: controlled `useState` + `useTransition` calling server actions — this codebase does **not** use react-hook-form (the shadcn form primitive exists but is unused; follow the house style).
- Data fetching: query helpers in `lib/db/*`, `unstable_cache` for hot public data, `revalidate` exports for ISR (marketplace 300s, catalog 60s), `React.cache` to dedupe between `generateMetadata` and page body.
- Feature flags: `FEATURE_FLAGS` from `lib/config/feature-flags.ts` — build-time `NEXT_PUBLIC_FF_*` envs. Branch on the constant, never on `process.env` directly.

## Testing & verification

- `npm test` — **node:test via tsx** (`tests/**/*.test.ts`). NOT vitest/jest: `import { test } from "node:test"` + `node:assert`. Pure-logic modules (pricing, message builders, search params) get unit tests.
- `npm run test:e2e` — Playwright (`e2e/*.spec.ts`).
- `npm run lint` (eslint 9) and `npm run build` must pass before any change is done.
- AI prompt evals: `npm run ai:eval` (promptfoo).
- DB: `npm run db:push` (includes health check), `db:migrate`, `db:seed`.

## Performance budgets (SA mobile is the target device)

- No new dependencies without strong justification — especially charts (analytics uses hand-rolled CSS/SVG bars on purpose) and animation libs (TF motion is CSS-only).
- next/image with explicit `sizes`; AVIF/WebP via next.config remotePatterns (utfs.io, *.ufs.sh, clerk, unsplash). Client-compresses uploads to 1200px JPEG before UploadThing.
- Animate transforms/opacity only. Respect `prefers-reduced-motion`.
- Reserve space for async content (no CLS); skeletons must match final layout.

## Hygiene

- URLs are state: filters/search/pagination live in searchParams (see `lib/marketplace/search-params.ts`), not client state.
- No hardcoded domains — use env-driven base URLs (a known past bug: `lib/cart/whatsapp-message.ts`).
- SEO on every public page: `generateMetadata`, canonical, JSON-LD via `lib/seo/json-ld.ts`, index-gating via `lib/seo/should-index.ts`.
- i18n: legacy pages use next-intl `t()`; new user-facing strings should too (TF components are temporarily EN-only — don't make it worse where cheap).
- Don't trust PLAN.md/tracker docs over code — grep first (documented drift history).
