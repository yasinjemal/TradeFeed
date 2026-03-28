# TradeFeed — R100M+ Growth Roadmap

> Strategic execution plan to scale TradeFeed from a South African WhatsApp commerce tool
> into Africa's WhatsApp commerce infrastructure.
>
> **Mission:** Turn WhatsApp sellers into real online stores in 60 seconds.
>
> **Target:** 50,000 sellers → 10,000 paid → R36M ARR → R100M+ valuation
>
> Last updated: **2026-03-08**

---

## Status Key

| Icon | Meaning |
|------|---------|
| ⬜ | Not started |
| 🔵 | In progress |
| ✅ | Complete |
| 🚫 | Blocked / Waiting on external dependency |

---

## Foundation Already Built ✅

These features are production-ready and form the base for growth:

| Feature | Status | Details |
|---------|--------|---------|
| AI Product Listing (GPT-4o Vision) | ✅ | Photo → title, description, category, tags, SEO. Credit system + Pro AI plan (R299/mo) |
| Shareable Catalog Link | ✅ | `/catalog/{slug}`, OG images, WhatsApp share button, copy link |
| Seller Referral System | ✅ | Tiered rewards (1→free month, 5→ambassador, 10→lifetime), leaderboard |
| Subscription Billing (PayFast) | ✅ | Free / Pro R199 / Pro AI R299 + manual payment fallback |
| Promoted Listings | ✅ | Boost R49/wk, Featured R149/wk, Spotlight R399/wk with analytics |
| 3-Field Onboarding | ✅ | Shop name + WhatsApp + description → live catalog in <2 min |
| WhatsApp Checkout | ✅ | Cart → structured message → `wa.me` link → order created in DB |
| Order Tracking | ✅ | Buyer-facing `/track/{orderNumber}` with status timeline |
| CSV Bulk Import | ✅ | Drag-and-drop CSV with preview, validation, progress tracking |
| SEO Infrastructure | ✅ | JSON-LD (Product, ItemList, FAQ, BreadcrumbList), sitemaps, canonical URLs, slug-based product URLs |
| i18n Framework | ✅ | 5 SA languages (EN, ZU, XH, AF, ST) via next-intl |
| Quick Reply Templates | ✅ | 15+ pre-written WhatsApp responses for common buyer questions |
| Review System | ✅ | Buyer reviews with ratings, seller reputation scores |

---

## Phase 1: Acquisition Engine (Weeks 1–6)

> **Goal:** Remove every friction point. Get to 10,000 sellers.
> **Theme:** Make it embarrassingly easy to start selling.

### 1.1 ⬜ WhatsApp Business Catalog Import

**The #1 killer feature for acquisition.**

| Item | Status | Notes |
|------|--------|-------|
| Apply for Meta Business verification | ⬜ | Start immediately — takes 2-4 weeks for approval |
| Build Meta Catalog API connector | ⬜ | `lib/whatsapp/catalog-import.ts` — read seller's WA Business catalog |
| "Import my WhatsApp products" UI | ⬜ | One-click flow in onboarding + dashboard |
| Auto-create product listings from WA catalog | ⬜ | Map WA catalog fields → TradeFeed product model |
| Sync scheduling (daily pull) | ⬜ | Keep TradeFeed in sync with WA catalog updates |

**Why this matters:** Sellers already have products in WhatsApp. Asking them to re-enter everything is the #1 drop-off point. One-click import = instant catalog.

**Blocked by:** Meta Business API verification (start the application NOW).

### 1.2 ⬜ `@username` Vanity URLs

| Item | Status | Notes |
|------|--------|-------|
| Add catch-all route `app/@[username]/` | ⬜ | Redirect to `/catalog/{slug}` |
| Update share components to use `@` format | ⬜ | `tradefeed.co.za/@shopname` in share buttons |
| Add `@username` to seller dashboard | ⬜ | Display prominently for copying/sharing |

**Why this matters:** `tradefeed.co.za/@luxe_fashion` is infinitely more shareable on WhatsApp status, Instagram bio, and business cards than `/catalog/luxe-fashion`.

### 1.3 ⬜ AI Price Suggestions

| Item | Status | Notes |
|------|--------|-------|
| Extend AI prompt to include price range | ⬜ | Update `lib/intelligence/product-ai.ts` system prompt |
| Category-based price benchmarking | ⬜ | Aggregate existing product prices by category for context |
| Display as suggestion (editable, not forced) | ⬜ | Show "Suggested: R150–R250" with one-click accept |

**Why this matters:** Non-technical sellers (the target market) struggle most with pricing. AI suggestions remove analysis paralysis.

### 1.4 ⬜ QR Code for Offline Sharing

| Item | Status | Notes |
|------|--------|-------|
| Add QR generation to share catalog button | ⬜ | Extend `components/shop/share-catalog-button.tsx` |
| Downloadable QR image (PNG) | ⬜ | For printing on business cards, market stalls |
| QR links to `@username` vanity URL | ⬜ | Depends on 1.2 |

**Why this matters:** SA informal sellers operate at taxi ranks, markets, and stokvels. Physical QR codes bridge offline→online.

### 1.5 ⬜ Guided First Product Creation

| Item | Status | Notes |
|------|--------|-------|
| Post-onboarding tutorial overlay | ⬜ | 3-step: "Take a photo → AI fills details → Publish" |
| Empty state with prominent AI button | ⬜ | Dashboard shows "Add your first product" hero |
| WhatsApp notification after first product | ⬜ | "Your store is live! Share this link: ..." |

**Why this matters:** Seller activation (creating first product) is the critical moment. Every seller who adds 1 product is 5× more likely to stay.

---

## Phase 2: Retention & Revenue (Weeks 7–14)

> **Goal:** Make sellers successful so they never leave. Activate monetization.
> **Theme:** AI does the selling for you.

### 2.1 ⬜ AI Sales Agent (WhatsApp Auto-Replies)

| Item | Status | Notes |
|------|--------|-------|
| WhatsApp webhook for inbound messages | ⬜ | Extend `lib/whatsapp/` to parse buyer messages |
| Intent detection (stock check, price, availability) | ⬜ | GPT-4o-mini classifies incoming messages |
| Auto-reply with product info + links | ⬜ | Pull from product DB, format as WhatsApp message |
| Seller override/approval mode | ⬜ | Seller can review AI replies before sending (opt-in) |
| Analytics: auto-reply conversion rate | ⬜ | Track which auto-replies lead to orders |

**Why this matters:** Sellers miss sales when they can't reply fast enough. An AI agent that responds in <5 seconds converts browsers into buyers 24/7.

**Depends on:** Meta Business API verification (shared with 1.1).

### 2.2 ⬜ In-App Buyer Payments

| Item | Status | Notes |
|------|--------|-------|
| Research: Ozow vs PayFast vs Yoco for buyer payments | ⬜ | Compare fees, integration effort, settlement time |
| Payment link generation per order | ⬜ | Seller sends payment link via WhatsApp |
| Payment confirmation webhook | ⬜ | Update order status automatically on payment |
| Commission model: R5-R10 flat per transaction | ⬜ | Simpler than % commission for regulatory compliance |
| Payout dashboard for sellers | ⬜ | Show earnings, pending payments, settlement dates |

**Why this matters:** TradeFeed currently has zero involvement in the money flow. Adding payments enables: (1) commission revenue, (2) buyer trust (escrow), (3) fraud protection, (4) order verification.

**Consideration:** Start with payment *links* (not full checkout) to avoid PASA compliance complexity.

### 2.3 ⬜ Buyer-Side Viral Loop

| Item | Status | Notes |
|------|--------|-------|
| "Share this product" button on product cards | ⬜ | WhatsApp + Copy + Native Share API |
| "Shared with you" landing experience | ⬜ | Personalized page: "Your friend shared this with you" |
| Referral discount for first purchase | ⬜ | Optional: seller-configurable discount code |
| Track shares → visits → orders funnel | ⬜ | Analytics in seller dashboard |

**Why this matters:** The seller referral loop is built. The buyer referral loop is missing. Every shared product link should bring new buyers AND new sellers.

### 2.4 ⬜ Seller Analytics Dashboard V2

| Item | Status | Notes |
|------|--------|-------|
| Revenue trends (daily/weekly/monthly) | ⬜ | Chart from order data |
| Top products by views + orders | ⬜ | Leaderboard in dashboard |
| Buyer demographics (province, repeat rate) | ⬜ | From order + analytics data |
| "Your store health" score | ⬜ | Composite metric: products, photos, response time, reviews |
| Actionable tips: "Add 3 more products to increase views by 40%" | ⬜ | AI-generated growth suggestions |

**Why this matters:** Sellers who see their numbers go up stay engaged. Data-driven sellers upgrade to paid plans.

---

## Phase 3: Scale Across Africa (Weeks 15–24)

> **Goal:** Expand beyond South Africa. Build the pan-African commerce layer.
> **Theme:** One platform, many countries, one WhatsApp.

### 3.1 ⬜ Multi-Currency Support

| Item | Status | Notes |
|------|--------|-------|
| Add `currency` enum to schema (ZAR, NGN, KES, ZMW, USD) | ⬜ | On `Shop` model |
| Currency display helpers | ⬜ | Format prices per shop currency |
| Update cart, checkout, feeds for multi-currency | ⬜ | Currently hardcoded ZAR everywhere |
| Currency in Google Merchant + JSON-LD feeds | ⬜ | Per-product currency in structured data |

### 3.2 ⬜ Multi-Country Phone Validation

| Item | Status | Notes |
|------|--------|-------|
| Replace +27 hardcoded prefix | ⬜ | Country code selector in onboarding |
| Validate phone formats per country | ⬜ | ZA (+27), NG (+234), KE (+254), ZM (+260), ZW (+263) |
| Update WhatsApp link generation | ⬜ | `wa.me/{internationalNumber}` |

### 3.3 ⬜ African Language Expansion

| Item | Status | Notes |
|------|--------|-------|
| Add Swahili (sw) translations | ⬜ | Kenya, Tanzania market |
| Add Yoruba (yo) translations | ⬜ | Nigeria (SW) market |
| Add Igbo (ig) translations | ⬜ | Nigeria (SE) market |
| Add Hausa (ha) translations | ⬜ | Nigeria (N) + Niger market |

### 3.4 ⬜ Delivery Partner APIs

| Item | Status | Notes |
|------|--------|-------|
| CourierGuy API integration (SA) | ⬜ | Quote + book + track shipments |
| Pargo/Paxi locker integration (SA) | ⬜ | Pickup point network for township delivery |
| GIG Logistics API (Nigeria) | ⬜ | West Africa delivery network |
| Shipping rate calculator | ⬜ | Show estimated delivery cost at checkout |
| Auto-tracking number import | ⬜ | Webhook from courier → update order status |

### 3.5 ⬜ Supplier Network (B2B Marketplace)

| Item | Status | Notes |
|------|--------|-------|
| "Find Suppliers" marketplace section | ⬜ | Wholesalers list products for resellers |
| Wholesale pricing tier (already in schema) | ⬜ | `minWholesaleQty` field exists — surface it |
| Supplier verification badge | ⬜ | Trusted supplier program |
| Bulk order flow | ⬜ | Reseller orders 100+ units at wholesale price |

**Why this matters:** Alibaba started as a B2B supplier directory. TradeFeed connecting SA wholesalers with African resellers is a massive moat.

---

## Key Metrics & Milestones

### Seller Growth Targets

| Milestone | Sellers | Paid Sellers | MRR | Target Date |
|-----------|---------|-------------|-----|-------------|
| Launch baseline | ~100 | ~5 | ~R1.5K | Now |
| Phase 1 complete | 2,000 | 100 | R30K | Week 6 |
| Phase 2 complete | 10,000 | 1,000 | R300K | Week 14 |
| Phase 3 complete | 50,000 | 10,000 | R3M | Week 24 |
| R100M valuation | 50,000+ | 10,000+ | R3M+ | Month 8–12 |

### North Star Metrics

| Metric | What It Measures | Target |
|--------|-----------------|--------|
| **Time to first product** | Onboarding friction | < 3 minutes |
| **Seller activation rate** | % who add ≥1 product within 24h | > 60% |
| **Weekly active sellers** | Retention / engagement | > 40% of total |
| **Products per seller** | Catalog depth | > 10 avg |
| **Buyer-to-seller ratio** | Marketplace health | > 20:1 |
| **Referral coefficient** | Viral growth | > 1.5 (each seller brings 1.5 more) |

### Revenue Model

| Stream | Price | Volume Target | Monthly Revenue |
|--------|-------|---------------|-----------------|
| Pro Subscription | R199/mo | 5,000 sellers | R995,000 |
| Pro AI Subscription | R299/mo | 5,000 sellers | R1,495,000 |
| Promoted Listings | R49–R399/wk | 2,000 active | R400,000 |
| Payment Fees | R5–R10/txn | 50,000 txns | R375,000 |
| **Total MRR** | | | **~R3.3M** |
| **Annual Run Rate** | | | **~R39.6M** |

---

## Expansion Sequence

```
Month 1–6:  🇿🇦 South Africa (home market, nail it)
Month 4–8:  🇿🇲 Zambia + 🇿🇼 Zimbabwe (shared ZAR zone, similar culture)
Month 6–12: 🇳🇬 Nigeria (40M+ WA Business users, huge TAM)
Month 9–15: 🇰🇪 Kenya (East Africa gateway, M-Pesa integration)
Month 12+:  🇬🇭 Ghana, 🇹🇿 Tanzania, 🇺🇬 Uganda
```

---

## External Dependencies & Blockers

| Dependency | Needed For | Lead Time | Action |
|------------|-----------|-----------|--------|
| Meta Business API verification | WA Catalog Import + AI Agent | 2–4 weeks | **Apply immediately** |
| Ozow / PayFast merchant account | Buyer payments | 1–2 weeks | Research + apply in Phase 2 |
| CourierGuy API access | Delivery integration | 1 week | Apply in Phase 3 |
| Pargo API partnership | Locker network | 2–3 weeks | Apply in Phase 3 |
| PASA compliance (if taking payments) | Payment commission | 4–8 weeks | Legal review in Phase 2 |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-08 | Start with payment links, not full checkout | Avoids PASA compliance, faster to ship, seller gets money directly |
| 2026-03-08 | Expand to Zambia/Zimbabwe before Nigeria | Shared currency zone, lower complexity, prove multi-country model |
| 2026-03-08 | AI agent as Phase 2 (not Phase 1) | Requires same Meta verification as catalog import — do both together |
| 2026-03-08 | Flat fee (R5-R10) not % commission | Simpler for sellers to understand, no regulatory grey area |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [manager/VISION.md](../manager/VISION.md) | Product vision, problem statement, target market |
| [docs/PHASE_TRACKER.md](PHASE_TRACKER.md) | Historical build phases (1–9, all complete) |
| [docs/MARKETPLACE_PLAN.md](MARKETPLACE_PLAN.md) | Marketplace feature plan (M1–M10) |
| [docs/P3_ROADMAP.md](P3_ROADMAP.md) | Technical nice-to-haves (performance, security, SEO) |
| [manager/PROGRESS.md](../manager/PROGRESS.md) | Current operational progress tracker |
| [PLAN.md](../PLAN.md) | Launch stability hardening plan |
