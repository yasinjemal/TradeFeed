# TradeFeed — Redesign Roadmap

_Goal: one design language (TF) across every surface, then delete the legacy branch.
Ordered by (user impact × frequency) ÷ risk. See design-audit.md for the findings behind each item._

## Milestone 1 — Dashboard convergence ✅ (this session)
- [x] Shell: header, desktop nav, mobile drawer, bottom tabs, FABs → warm stone/emerald
      (`app/dashboard/[slug]/layout.tsx`, `components/dashboard/*`)
- [x] All dashboard components + route pages purged of slate
- [ ] Follow-up: replace emoji nudges (🔥🔍💡) in dashboard pages with TF illustration/lucide
- [ ] Follow-up: `TfStat` + `TfTable` components per approved concept `b9a4466d`/`03acdfdf`

## Milestone 2 — Flip-the-flag blockers
The `UI_REDESIGN` flag cannot ship permanently until:
1. **Pricing single-source** — extract one `PLANS` definition (suggest `lib/billing/plans.ts`),
   consume from legacy landing, `TfLanding`, `/pricing`, and the FAQ copy. They currently disagree.
2. **TfLanding i18n parity** — port hardcoded strings to `next-intl` keys (af/zu/xh/st).
3. **Onboarding on-system** — rebuild `/create-shop` + `/get-started` per approved concept
   `7601abf9`: one question per screen, progress dots, live URL preview, reassurance line.

## Milestone 3 — Buyer-trust surfaces
- `/pay/[orderNumber]`, `/track`, `/orders`, `/me` → TF (these carry money-anxiety; warmth
  and the quiet TrustBar matter most here).
- `/sign-in`, `/sign-up` Clerk appearance themed to TF tokens.
- Marketplace province/city/category pages adopt `TfMarketplaceShell`.

## Milestone 4 — Flip `UI_REDESIGN` on, delete legacy
- Remove the v1 landing branch from `app/page.tsx`, delete dead landing components.
- Remove gold/VIP utilities and the legacy focus-ring block from `globals.css`.
- Then un-namespace: tf is no longer a variant, it IS the product.

## Milestone 5 — Brand assets (Higgsfield production round)
- Produce the empty-state illustration set in the approved style (`e8e64a8a`) — one per
  empty state (products, orders, reviews, customers, analytics).
- Landing deep-emerald band with SA-textile pattern motif (`cb61637b` direction).
- Social/OG launch assets + a 20s product showcase video once the flag ships.
- Budget note: image generations cost 2 credits each on the current Starter plan (200 total).

## Explicitly deferred
- Admin redesign (internal tool; keep functional slate/red identity for now).
- Dark mode for the dashboard (tokens exist; do after Milestone 4 so it's one system, not three).
