# TradeFeed Revenue Roadmap

> **Goal:** R90K+/mo revenue at 500 sellers. Build order: highest revenue-per-engineering-hour first.
>
> **Started:** 2026-03-15 | **Owner:** Engineering

---

## Status Key

| Icon | Meaning |
|------|---------|
| ⬜ | Not started |
| 🔵 | In progress |
| ✅ | Complete |
| 🔴 | Blocked (see notes) |

---

## Feature 1: Complete Buyer Payment Flow

> **Revenue:** R75,000/mo at 500 sellers × 20 orders × R7.50 avg fee
> **Effort:** ~1 week | **Status:** ✅ Complete

### What Exists
- [x] PayFast integration (subscription + promotion payments working)
- [x] ITN webhook routes `order_*` payments (`app/api/webhooks/payfast/route.ts`)
- [x] Order model with `paymentStatus` field (PENDING/PAID/FAILED)
- [x] Order creation from WhatsApp checkout
- [x] Payment request generation UI (partial)

### Implemented
- [x] Buyer payment page (`/pay/{orderNumber}`) — shows order summary + PayFast checkout
- [x] ITN webhook handler for `order_*` prefix → marks order PAID + creates TransactionFee
- [x] `TransactionFee` model — R7.50 flat fee per completed order
- [x] Seller WhatsApp notification on payment confirmed
- [x] Payment link copy + "Send to buyer" WhatsApp button in orders dashboard
- [x] Enhanced paid status display in order list

---

## Feature 2: Seller Activation Funnel + Pro Trial

> **Revenue:** R14,925/mo (15% free-to-Pro conversion at 500 sellers)
> **Effort:** ~3-4 days | **Status:** ✅ Complete

### Implemented
- [x] `ProductUsageMeter` component — shows X/10 with progress bar (green/amber/red)
- [x] Usage meter on dashboard overview (for Free plan users)
- [x] Usage meter on products list page (compact mode)
- [x] Soft gate at 80% capacity — amber warning + upgrade CTA on new product page
- [x] Hard gate at 100% — red blocker with "Upgrade to Pro" + "Back to Products" actions
- [x] `ProFeatureGate` component — blur overlay with lock icon + upgrade CTA
- [x] Analytics dashboard blurred for Free users
- [x] Revenue dashboard blurred for Free users
- [x] Customer CRM blurred for Free users
- [x] 14-day Pro trial for new signups (`trialEndsAt` on Subscription model)
- [x] `TrialBanner` component — countdown with urgency (green → amber → red)
- [x] Trial banner on dashboard overview
- [x] Trial respects product limits (unlimited during trial)
- [x] Trial respects Pro gates (analytics/revenue/CRM unlocked during trial)
- [x] `UpgradeGate` component (soft + hard modes)
- [x] `isTrialActive()` utility for trial state checks

---

## Feature 3: WhatsApp Follow-up Sequences

> **Revenue:** Indirect (retention × LTV multiplier)
> **Effort:** ~3-5 days | **Status:** ✅ Complete

### Implemented
- [x] `SellerMessage` model — audit trail for all outbound WhatsApp messages (dedup, retry, POPIA)
- [x] `SellerSequenceState` model — tracks sequence progress per seller (Day 0/3/7/14/monthly)
- [x] Sequence engine (`lib/whatsapp/seller-sequences.ts`) — idempotent, one message per run per seller
- [x] Day 0: Welcome + catalog link + dashboard link (sent at shop creation)
- [x] Day 3: "Add your first product" with AI listing link (if 0 products)
- [x] Day 7: "Share your catalog" with link (if has products but no orders)
- [x] Day 14: "Your shop needs attention" with activity stats (if inactive 14+ days)
- [x] Monthly: Activity summary (views, WhatsApp clicks, orders, revenue) + contextual tip
- [x] Cron API route (`/api/cron/seller-sequences`) — daily at 09:00 SAST via Vercel Cron
- [x] Welcome message sent immediately on shop creation (`createShopAction`)
- [x] Opt-out toggle in notification settings page (`WhatsAppSequenceToggle`)
- [x] Opt-out API route (`/api/seller-sequences/opt-out`) — respects `requireShopAccess`
- [x] "Reply STOP" in every message (POPIA compliance)

---

## Feature 4: In-App Checkout

> **Revenue:** R75,000+/mo (captures full GMV data for investors)
> **Effort:** ~3-4 weeks | **Status:** ✅ Complete (Phase 1)

### Implemented
- [x] PayFast direct integration (already proven — subscriptions, promotions, orders)
- [x] Auto-send payment link to buyer via WhatsApp on order creation (`sendBuyerPaymentLink`)
- [x] Buyer payment confirmation WhatsApp on successful payment (webhook)
- [x] "X sold" counter on marketplace product cards, catalog product cards, product detail page
- [x] Sold count aggregation via `enrichWithSoldCounts()` batch query (no N+1)
- [x] Revenue dashboard with **paid** vs **total** revenue distinction (green accent cards)
- [x] Platform GMV tracking on admin dashboard (Total GMV, Paid Revenue, Platform Fees, Total Orders)

### Remaining (Phase 2)
- [ ] In-app payment form (Ozow/Yoco for card-on-page instead of redirect)
- [ ] Receipt generation (PDF/WhatsApp)
- [ ] Cart reservation (lock stock during checkout, release on timeout)

---

## Feature 5: B2B Wholesale Mode

> **Revenue:** R50,000+/mo (10-50x order values vs consumer)
> **Effort:** ~2 weeks | **Status:** ✅ Complete

### Tasks
- [x] Product flag: `wholesaleOnly` boolean (schema + create/edit forms + amber toggle)
- [x] Buyer registration flow (business name, VAT, registration number, province, phone)
- [x] Admin verification for wholesale buyers (approve/reject with reason, status tabs)
- [x] Pricing visibility: wholesale-only products hidden from marketplace, banner on direct URL
- [x] Minimum order quantity enforcement in cart (existing, enhanced with wholesale/retail toggle)
- [x] RFQ (Request For Quote) flow → WhatsApp message to seller with structured quote request
- [x] Bulk discount tiers (min qty + discount %, tier editor, auto-applied in cart, badges on product page)

---

## Feature 6: Storefront Themes (Pro Perk)

> **Revenue:** Pro conversion lift (visible differentiation)
> **Effort:** ~3-4 days | **Status:** ✅ Complete

### Tasks
- [x] Theme model (themePreset, themePrimary, themeAccent, themeFont on Shop)
- [x] 5 preset themes: Classic, Modern, Bold, Minimal, Vibrant
- [x] Theme picker in shop settings (Pro only, Free shows locked preview with upgrade CTA)
- [x] Catalog page renders with selected theme CSS variables (font, primary color, accent)
- [x] Live preview in theme picker before applying
- [x] Add-to-cart buttons, size/color selectors themed via CSS vars
- [x] Google Fonts loaded dynamically for custom theme fonts

---

## Feature 7: AI Sales Assistant

> **Revenue:** R24,950/mo (50 sellers × R499/mo premium)
> **Effort:** ~3-4 weeks | **Status:** ✅ Complete

### Tasks
- [x] Meta Business API inbound webhook setup
- [x] Product knowledge base per seller (catalog context builder)
- [x] GPT-4o-mini response generation (product info, pricing, stock, catalog link)
- [x] Conversation context management (multi-turn with WhatsAppConversation/Message models)
- [x] Seller dashboard: view AI conversations + message threads
- [x] AI reply gated per plan (pro-ai/business only, template fallback for others)
- [x] Dashboard nav: "AI Chats" under Marketing group

---

## Feature 8: Logistics Integration

> **Revenue:** R225,000/mo (R15 markup × 30 shipments × 500 sellers)
> **Effort:** ~4-6 weeks | **Status:** ⬜ Not Started

### Tasks
- [ ] Carrier selection (Pargo, PostNet, The Courier Guy)
- [ ] API integration for rate quotes
- [ ] Shipping label generation (PDF)
- [ ] Tracking number injection into order timeline
- [ ] Buyer tracking page with carrier updates
- [ ] Estimated delivery cost at checkout
- [ ] Seller shipping settings (default carrier, pickup address)

---

## Revenue Projection

| Month | Features Live | Sellers | Est. Monthly Revenue |
|-------|--------------|---------|---------------------|
| 1 | Payment flow + Activation funnel | 100 | R15,000 |
| 2 | + WhatsApp sequences + Themes | 250 | R40,000 |
| 3 | + In-app checkout + B2B mode | 500 | R120,000 |
| 6 | + AI assistant + Logistics | 1,500 | R400,000 |
| 12 | Full platform maturity | 5,000 | R1,500,000 |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-15 | Roadmap created. Feature 1 (Buyer Payment Flow) started. |
