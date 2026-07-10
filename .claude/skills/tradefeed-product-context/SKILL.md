---
name: tradefeed-product-context
description: TradeFeed's business context — mission, users, pricing plans, marketplace rules, WhatsApp-first order model, and monetization. Use this before making ANY product decision in this repo: what to build, copy/wording, pricing displays, plan gating, seller vs buyer trade-offs, marketplace ranking, or when a request mentions sellers, buyers, plans, subscriptions, WhatsApp orders, or "the business".
---

# TradeFeed Product Context

## Mission

Turn South African WhatsApp sellers into professional online businesses. Sellers already run their whole business inside WhatsApp chats; TradeFeed gives them a catalog, orders, payments, and trust signals **without taking them out of WhatsApp**.

## The core model: WhatsApp-first checkout

"Checkout" is order-message generation, not a traditional cart flow:

1. Buyer browses a shop's catalog (`/catalog/[slug]`) or the cross-shop marketplace (`/marketplace`).
2. Cart (client context, slide-out drawer) → `checkoutAction` persists an Order → a formatted order message opens in `wa.me/<seller>` (built by `lib/cart/whatsapp-message.ts`).
3. Seller and buyer finish the deal in WhatsApp. Buyer can self-serve pay via PayFast (`/pay/[orderNumber]`) or COD, and track at `/track/[orderNumber]` (both public, no auth).

Never design a flow that assumes email, buyer accounts (flag-gated, off), or on-platform chat. WhatsApp IS the communication layer.

## Users

- **Sellers** (the paying customer): SA micro/small businesses — township and suburban, mobile-first, often low-end Android, data-cost sensitive. They measure success in WhatsApp orders per day. Roles: OWNER/MANAGER/STAFF (`lib/auth/permissions.ts`).
- **Buyers**: anonymous, arrive from shared WhatsApp links, Google (SEO is a major acquisition channel), or the marketplace. No login required anywhere on the buy path.

## Monetization (source of truth: `lib/billing/plans.ts` — read it, don't trust memory)

Four plans, monthly ZAR, PayFast recurring billing: **Free** (20 products, 10 AI listings/mo), **Starter R99** (unlimited products, 25 AI), **Pro R299** (unlimited AI, custom domain, team of 3 — the "popular" plan), **Pro AI R499** (full AI automation: photo→listing, catalogue import, bg removal, translations). Annual = ~2 months free. Enforcement lives in `lib/db/subscriptions.ts` (product limits), `lib/db/ai.ts` (AI credits), `app/actions/domains.ts` (domain gating) — if a number changes in plans.ts, enforcement must change too (the file header says so).

Secondary revenue: promoted listings / shop boosts (one-time PayFast payments, interleaved into marketplace results with impression+click tracking that feeds billing).

## Marketplace rules

- Quality-gated participation (shops need real products; thin pages get `noindex` via `lib/seo/should-index.ts`).
- **Verified Seller** badge = trust system (`FEATURE_FLAGS.TRUST_SYSTEM`): seller submits legal name/registration/VAT (`app/actions/verification.ts`), admin approves (`app/admin/verifications`). Verified shops rank higher.
- Wholesale AND retail: products can carry dual pricing (`priceCents` wholesale + `retailPriceCents`), bulk discount tiers, min order quantities, and a separate `retailWhatsappNumber`. Wholesale-only products require buyer wholesale registration.
- Fulfillment: PLATFORM_COURIER / SELLER_ARRANGED / COLLECTION, with per-shop dispatch windows and return policy (`components/shop/shop-fulfillment-settings.tsx`).

## Locale & compliance

- Currency **ZAR (R)**, locale `en_ZA`; i18n via next-intl with en/zu/xh/af/st ambitions.
- **POPIA** (SA privacy law): marketing consent checkbox at checkout, cookie consent banner. Buyer phone numbers are masked when displayed publicly.
- Domain: tradefeed.co.za; Pro sellers get custom domains (middleware rewrite in `proxy.ts`).

## Current strategic effort

Shipping the TF redesign (see the tradefeed-design-system skill) for the buyer conversion path, then seller surfaces. PLAN.md at repo root is the feature log — it has drifted from code before, so **verify any "not built" claim by grepping the code first**.
