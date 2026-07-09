# TradeFeed — Product Design Audit

_Date: 2026-07-09 · Auditor: Claude (founding designer pass) · Scope: full app surface_

## Executive summary

TradeFeed is **not one product visually — it is two and a half**. A well-crafted redesign
("TF" design system: warm stone surfaces, deep emerald `#047857`, amber accent, Clash
Display/General Sans, a disciplined motion system) already exists behind
`NEXT_PUBLIC_FF_UI_REDESIGN` and covers 6 key surfaces. Around it sits the legacy UI
(cold slate + `blue-600`, violet AI accents, gold "luxury VIP" effects) covering ~75 of
~81 routes. The single highest-impact design move is **not inventing a new direction —
it is finishing and unifying the one that already exists.**

## 1. Design-language inventory

| Language | Palette | Type | Where it lives |
|---|---|---|---|
| **TF (redesign)** | Warm stone `#faf8f4`, emerald `#047857`, amber `#f59e0b` | Clash Display (hero), General Sans (headings), Inter (body) | `components/tf/*` — landing, marketplace shell, pricing, dashboard home, storefront, product page, cart |
| **Legacy landing/dashboard shell** | White/slate, `blue-600` CTAs, violet AI badges | Inter only | `app/page.tsx` (v1 branch), `app/dashboard/[slug]/layout.tsx`, admin, auth pages |
| **Dashboard sub-pages** | Stone neutrals + `emerald-500` gradients + amber nudges | Inter | products, orders, analytics, billing, settings… |
| **"Luxury VIP" utilities** | Gold shimmer, crown float, breathe rings | — | `globals.css` (~120 lines), sparingly consumed |

**Verdict:** the TF language is the strongest of the four — locally relevant (warm, trust-first,
WhatsApp-adjacent emerald), typographically distinctive, and motion-disciplined
(one easing, three durations, reduced-motion safe). Everything else should converge on it.

## 2. Coverage map (TF flag ON)

- ✅ TF: `/` `/marketplace` `/pricing` `/dashboard/[slug]` (home only) `/catalog/[slug]` `/catalog/[slug]/products/[id]`
- ❌ Legacy: **dashboard shell** (header/nav/mobile tabs around the TF home), all dashboard
  sub-pages (products, orders, revenue, analytics, billing, settings, team, combos, drops…),
  onboarding (`/create-shop`, `/get-started`), auth (`/sign-in`, `/sign-up`), buyer flows
  (`/pay/[orderNumber]`, `/track`, `/orders`, `/me`), SEO/city pages, admin, marketplace
  province/city/category pages.

## 3. Friction points, ranked by impact

### P1 — Brand fracture inside the dashboard (highest impact)
With the flag on, a seller lands on the warm-stone TF dashboard home **wrapped in a cold
slate/blue shell** ([layout.tsx](app/dashboard/[slug]/layout.tsx)). Header, nav, mobile
bottom tabs, FABs are slate/white/blue-tinged while every sub-page below is stone/emerald.
Sellers live here daily; this is where "billion-dollar company" impressions are actually formed.
**Fix: retrofit the shell to the TF language. Low-risk (styling only), affects every seller session.**

### P2 — Onboarding is off-system
`/create-shop` and `/get-started` are the conversion moment (memory: onboarding conversion
is a live watch item) yet render legacy UI. First impression ≠ landing promise.

### P3 — Pricing truth is duplicated 4×
Plans/features are hardcoded independently in `app/page.tsx` (legacy pricing section + FAQ
copy), `components/tf/landing/tf-landing.tsx` (`PLANS`), and `app/pricing/page.tsx`. They
**already disagree** (e.g. custom-domain and AI-generation allowances differ between
branches). One source (`lib/billing/plans.ts`) should feed all of them.

### P4 — i18n regression in the TF branch
Legacy landing is fully translated via `next-intl` (`tLanding(...)`); `TfLanding` hardcodes
English strings. Shipping the flag as-is silently drops af/zu/xh/st support on the highest-traffic page.

### P5 — CTA color tells three different stories
Blue-600 (legacy landing), emerald-500 gradient (dashboard sub-pages), tf-primary `#047857`
(TF). The buyer-facing brand promise ("WhatsApp-first") argues for exactly one green family.

### P6 — Icon system is inline-SVG soup
Legacy pages paste raw 500-char SVG paths inline (see the admin gear repeated verbatim in
two files); TF uses `lucide-react` consistently. Emoji-as-icon (🔥 🔍 💡 ⚡) in dashboards
undermines the premium read.

### P7 — Dead weight in globals.css
~120 lines of gold/VIP animation utilities from an abandoned "luxury" direction; plus a
legacy focus-ring block that fights the TF token system.

## 4. What is already excellent (keep, don't touch)

- The TF motion system ("Counter-weight" + "Alive"): one easing, transform/opacity only,
  reduced-motion gated, 1.6s auto-show failsafe for slow phones. This is genuinely
  world-class mobile-first discipline.
- WhatsApp-first IA: catalog link → structured wa.me order is the product's moat and the
  flows respect it.
- Server-side data with `unstable_cache` on the landing page; JSON-LD FAQ schema; province
  SEO pages.

## 5. Recommendation

1. Ship P1 now (shell unification — pure styling, no flag needed since sub-pages are
   already stone/emerald).
2. Then P2 onboarding, P3 pricing single-source, P4 i18n parity — these are the real
   blockers to flipping `UI_REDESIGN` on permanently and deleting the legacy branch.
3. Only after that, extend TF to buyer flows (pay/track/orders) and admin.
