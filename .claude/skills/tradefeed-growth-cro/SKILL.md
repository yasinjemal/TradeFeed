---
name: tradefeed-growth-cro
description: TradeFeed's growth and conversion playbook — onboarding funnel, trust signals, upgrade nudges, promoted listings, viral loops, and instrumentation. Use this whenever touching onboarding, pricing/upgrade surfaces, empty states with CTAs, badges, banners, subscription flows, marketplace ranking, analytics events, or ANY change that could move seller signups, buyer orders, or plan upgrades.
---

# TradeFeed Growth & CRO

## The two funnels (protect them in every change)

1. **Buyer funnel** (revenue for sellers → retention for us): Google/WhatsApp link → marketplace or catalog → product → cart → WhatsApp message sent → paid (PayFast/COD) → tracked. Friction anywhere here costs sellers orders — this funnel needs zero auth, minimal data entry, and fast pages on cheap Android phones.
2. **Seller funnel** (revenue for us): landing → `/get-started` → first product live → first order → upgrade to paid plan.

## Onboarding (conversion-instrumented — don't break the events)

- `/get-started` (`components/shop/get-started-flow.tsx`): 3 steps — WhatsApp number + shop name → first product photo/name/price → celebration. Product-first by design: a seller with a live product has a reason to return.
- Every step writes `onboardingEvent` rows (`app/actions/onboarding.ts`). Onboarding conversion is actively monitored — any change to this flow must keep or extend the events, never drop them.
- City is required at signup (feeds local SEO pages).
- Post-signup activation aids: trial banner, `first-sale-celebration.tsx`, "Needs your attention" list on the dashboard, seller health score (`lib/intelligence`).

## Upgrade & monetization levers (where MRR comes from)

- **Product-limit meter**: free plan caps at 20 products; upgrade nudge fires at 80% (`components/billing/product-usage-meter.tsx`, `UpgradeGate`).
- **AI credits**: 10/mo free, 25 Starter, unlimited Pro+ (`lib/db/ai.ts`) — running out is an upgrade moment, always show the path.
- **Pro-gated features** sellers can see but not use: theme picker, custom domain (both in settings) — visible gating converts better than hidden features.
- **Promoted listings / boosts**: one-time PayFast payments; results interleaved into marketplace (`interleavePromotedProducts`) with **impression + click tracking that feeds billing** — never render promoted items without firing both trackers.
- Pricing surfaces all read `lib/billing/plans.ts` (single source of truth). Pro is the anchored "popular" plan.

## Trust signals (the currency of a C2C marketplace)

- Verified Seller badge (admin-reviewed business verification) — ranking boost + badge on cards/storefront.
- Reviews & ratings with automated post-delivery review requests (`REVIEW_REQUESTS` flag).
- Seller trust stats strip, order tracking numbers, masked buyer phones (POPIA), secure PayFast checkout messaging, "No platform fees" positioning in the marketplace announcement strip.
- Empty states are sales moments: the empty catalog shows "Coming Soon" + WhatsApp CTA, not a dead end.

## Viral loops

- Every storefront footer: "Powered by TradeFeed — create your own shop" CTA (buyer→seller loop).
- WhatsApp order messages contain product deep links and a `Track:` link — every order message markets the platform.
- Non-owner sellers viewing another shop get recruitment CTAs.
- SEO money pages (`/sell-online-south-africa`, `/sell-on-whatsapp`, `/whatsapp-catalog`, province/city pages) are acquisition surfaces — keep them indexed and fast.

## Instrumentation

- `trackEvent` (PAGE_VIEW, PRODUCT_VIEW, …) powers seller analytics — buyer surfaces must keep firing these.
- GA4 + Vercel Analytics app-wide; Sentry for errors; onboardingEvent for funnel steps.
- Rule for any redesign: feature parity includes **event parity**. A prettier page that stops firing `trackMarketplaceViewAction`/`trackPromotedImpressionsAction` silently corrupts promoted-listing billing and seller analytics.

## CRO review checklist for any buyer-path change

Primary action obvious within one viewport on 375px? · WhatsApp CTA green and thumb-reachable? · Price + trust signal visible before the fold? · Zero new required form fields? · Loading skeleton prevents perceived slowness? · Does the change add any step between "want it" and "WhatsApp opens"? If yes, justify it.
