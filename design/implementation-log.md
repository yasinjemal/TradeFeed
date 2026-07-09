# TradeFeed — Redesign Implementation Log

## 2026-07-09 — Session 1: audit, creative direction, dashboard convergence

### Documents produced
- `design-audit.md` — full-surface audit; headline finding: TF design system already exists
  behind `NEXT_PUBLIC_FF_UI_REDESIGN` covering 6 surfaces; everything else must converge on it.
- `ux-research.md` — reference-product principles (Linear/Stripe/Shopify/WhatsApp/Airbnb/Notion)
  + mobile-first African commerce non-negotiables.
- `brand-guidelines.md`, `component-library.md`, `design-decisions.md`, `redesign-roadmap.md`.

### Higgsfield creative round (10 images, 20 credits; balance was 200)
Exploration: landing ×2, dashboard, mobile marketplace, product page, onboarding,
component sheet, illustration style. Refinement: merged landing, mobile dashboard.
All renders archived in `design/concepts/`. Verdicts recorded in `design-decisions.md`
(D1–D8, D2a, D3a). Credit cost note: 2 credits/image at 1k on the Starter plan.

### Code changed (styling only, no functional changes — lint clean)
**Dashboard convergence to warm stone/emerald (audit P1):**
- [app/dashboard/[slug]/layout.tsx](../app/dashboard/[slug]/layout.tsx) — canvas + sticky
  header to warm `#faf8f4`, slate→stone throughout, mobile add-product FAB de-gradiented to
  solid `emerald-700` (= `tf-primary`) with motion-safe scaling.
- `components/dashboard/*` (14 files) — slate→stone across nav, drawer, bottom tabs,
  shop switcher, and all content components (team-page, seller-health-card, trending-products,
  quick-reply-templates, referral-invite, catalog-qr-share, custom-domain-banner,
  first-sale-celebration, order-notification-sound).
- `app/dashboard/[slug]/**` route pages (11 files) — slate→stone.

Verified: `grep` confirms zero `slate-` classes remain under `app/dashboard` or
`components/dashboard`; `npx eslint` on all changed files passes. All occurrences were
Tailwind utility classes (verified via negative-lookahead grep before replacing).

⚠️ Note: several of these files carried pre-existing uncommitted modifications before this
session; the working tree now mixes both. Review the diff as one unit before committing.

## 2026-07-09 — Session 2: pricing single-source (Milestone 2, blocker 1)

- Created [lib/billing/plans.ts](../lib/billing/plans.ts) — canonical `PLANS` (slug, prices,
  blurbs, marketing features, DB features, limits), `PLAN_COMPARISON` table rows, and
  `annualSavings`/`annualMonthlyEquivalent` helpers. Header documents the enforcement files
  that must stay in agreement (lib/db/ai.ts, lib/db/subscriptions.ts, app/actions/domains.ts).
- Wired consumers: `app/pricing/page.tsx` (local PLANS deleted), `components/tf/landing/tf-landing.tsx`
  (local PLANS deleted), `app/page.tsx` (comparison table now renders `PLAN_COMPARISON`;
  card copy aligned to canonical wording), `scripts/seed-plans.ts` (rewritten to seed from
  the module — DB rows can no longer drift).
- Resolved disagreements against enforcement code: custom domain is Pro+ (verified in
  `app/actions/domains.ts:44`), so /pricing FAQ now says so decisively; unified wording to
  "AI listings a month".
- ⚠️ Found a real product bug while verifying copy: all surfaces promise monthly AI credits
  but `Shop.aiGenerationsUsed` is a lifetime counter with no reset (lib/db/ai.ts). Flagged
  as a separate background task (backend fix, out of design scope).
- Verified: `tsc --noEmit` exit 0, eslint clean on all five touched files.

## 2026-07-09 — Session 3: onboarding rebuild (Milestone 2, blocker 3)

- New [components/tf/onboarding/tf-create-shop.tsx](../components/tf/onboarding/tf-create-shop.tsx) —
  the approved one-question-per-screen flow (D7, concept `7601abf9`): three steps
  (shop name → WhatsApp number → location + optional description), progress dots,
  live `tradefeed.co.za/catalog/…` URL preview in emerald, "Free · no card needed ·
  under 3 minutes" reassurance at the commitment point, quiet social-proof footer.
- Implementation notes: single `<form>` with all steps mounted (hidden steps keep FormData
  complete); submits to the **same `createShopAction`** as the legacy form — zero backend
  change; server field errors jump the user to the owning step; Enter advances instead of
  submitting mid-flow; auto-focus per step; TfButton throughout (44px targets, focus rings);
  `tf-slide-in-right` step entrances (reduced-motion safe by the existing motion system).
- [app/create-shop/page.tsx](../app/create-shop/page.tsx) gates it behind
  `FEATURE_FLAGS.UI_REDESIGN` exactly like the other TF surfaces; legacy dark flow untouched
  while the flag is off.
- Verified: `tsc --noEmit` exit 0, eslint clean. NOT live-driven — the route is Clerk-gated
  and flag-gated; drive it after enabling `NEXT_PUBLIC_FF_UI_REDESIGN=true` in a signed-in
  session before flipping the flag in prod.
- Remaining known gap: TF onboarding strings are English-only, same as TfLanding — covered
  by the Milestone 2 i18n-parity task.

## 2026-07-09 — Session 4: marketplace products on the homepage (user request)

- New "On the marketplace right now" section in
  [tf-landing.tsx](../components/tf/landing/tf-landing.tsx), placed between Real Sellers and
  Pricing: 2-col mobile / 4-col desktop grid of up to 8 real products via the existing
  `TfProductCard` (verified tick, price, New badge, hover WhatsApp CTA), with a "Browse all"
  header link (desktop) and a "Browse the marketplace" button (all sizes) → `/marketplace`.
  Section hides itself when no products exist.
- [app/page.tsx](../app/page.tsx): `getHomepageProducts` — `getMarketplaceProducts`
  (quality sort, 8 items, the same query the marketplace uses) wrapped in `unstable_cache`
  (5 min) and mapped to plain card props before caching so Dates never round-trip.
- `components/tf/product-card.tsx` marked `"use client"` so the server-rendered landing can
  compose it (it owns hover/click handlers).
- Verified: tsc + eslint clean; the new query executed live against the dev DB through the
  user's running dev server (homepage 200 — the fetch happens before the flag branch).
  The visual section ships only where `UI_REDESIGN` is on (prod).

### Not done yet (next session, in roadmap order)
1. Emoji→illustration/lucide swap inside dashboard nudge cards.
2. `TfStat` + `TfTable` per concepts `b9a4466d`/`03acdfdf`.
3. Milestone 2 flag-flip blockers: pricing single-source, TfLanding i18n, onboarding rebuild.
