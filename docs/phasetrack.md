# TradeFeed Product Roadmap — Phase Track

**Date**: 2026-03-17  
**Version**: 2.0  
**Rule**: Features are developed ONE AT A TIME. No parallel feature development.

---

## Active Feature

> **Feature 1: WhatsApp Product Import** — ✅ Complete  
> **Feature 2: AI Product Builder** — ✅ Complete  
> **Feature 3: Payment Links via WhatsApp** — ✅ Complete
> 
> **Feature 4: Seller Analytics Dashboard V2** — ✅ Complete
>
> **Feature 5: Automated Order Reply Bot** — ✅ Complete
>
> **Feature 6: Marketplace Ranking Algorithm** — ✅ Complete
>
> **Feature 7: Location-Based Discovery Pages** — ✅ Complete
>
> **Feature 6.5: Seller Onboarding Optimization** — ✅ Complete
>
> **Feature 8: Seller Referral Program** — ✅ Complete
>
> **Next Up: Feature 9: Cash-on-Delivery Support**

---

## Feature 1: WhatsApp Product Import

| Field | Detail |
|-------|--------|
| **Feature Name** | WhatsApp Product Import |
| **Status** | ✅ Complete |
| **Problem** | Sellers must use a web form to create products — this requires digital literacy, a computer, and time. Most SA WhatsApp sellers photograph products and share them in groups/statuses. There's no way to turn these WhatsApp photos into structured product listings. |
| **User Story** | As a WhatsApp seller, I want to send a product photo with a price to TradeFeed via WhatsApp, so that the AI automatically creates a professional product listing on my store. |

### Technical Implementation Plan

**Flow**:
```
Seller sends WhatsApp message (photo + "Red dress R250 size S-XL")
  → Meta Business API webhook receives message
  → Extract image URL + parse text for price/details
  → GPT-4o Vision analyzes image → generates name, description, category
  → Create product + variant(s) in database
  → Reply to seller: "✅ Product created! View: [link]"
```

**Components**:
1. WhatsApp Business API webhook handler (extend existing `/api/webhooks/meta-business-api`)
2. Image analysis service (GPT-4o Vision API)
3. Price/quantity parser (regex + NLP)
4. Product creation pipeline (reuse existing `createProduct` action)
5. Confirmation message sender (WhatsApp reply)

### Database Changes

| Change | Details |
|--------|---------|
| New field: `Product.source` | Enum: `WEB`, `WHATSAPP`, `CSV`, `API` — track how product was created |
| New field: `Product.aiGenerated` | Boolean — flag AI-created products for quality monitoring |
| New table: `WhatsAppProductImport` | Track import attempts: `shopId`, `messageId`, `imageUrl`, `parsedText`, `status` (PENDING/PROCESSED/FAILED), `productId` (nullable), `errorMessage`, `createdAt` |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhooks/meta-business-api` | POST | Receive WhatsApp messages (extend existing) |
| `/api/ai/analyze-product-image` | POST | GPT-4o Vision analysis (internal) |
| `/app/actions/whatsapp-import.ts` | Server Action | Create product from parsed WhatsApp data |

### UI Changes

| Screen | Change |
|--------|--------|
| Dashboard Overview | Add "Products imported via WhatsApp" stat card |
| Product List | Show "WhatsApp" badge on imported products |
| Settings | WhatsApp import toggle (enable/disable) |
| Onboarding | Add "Send a photo to create your first product" CTA |

### Testing Checklist

- [ ] Image upload via WhatsApp triggers webhook
- [ ] GPT-4o Vision correctly identifies product from photo
- [ ] Price extracted from message text (multiple formats: "R250", "250", "R 250.00")
- [ ] Product created with correct shop association
- [ ] Variants generated from size mentions ("S-XL" → S, M, L, XL)
- [ ] Confirmation WhatsApp reply sent to seller
- [ ] Duplicate detection (same image sent twice)
- [ ] Error handling: unsupported image format
- [ ] Error handling: no price detected
- [ ] Rate limiting: max 10 imports per hour per shop
- [ ] Product visible in catalog after creation
- [ ] AI-generated description in seller's language preference

---

## Feature 2: AI Product Builder

| Field | Detail |
|-------|--------|
| **Feature Name** | AI Product Builder |
| **Status** | ✅ Complete |
| **Problem** | Sellers with limited English or digital skills struggle to write product descriptions and choose categories. Product listings with poor titles and descriptions get less marketplace visibility. |
| **User Story** | As a seller creating a product on the web dashboard, I want AI to auto-generate the title, description, and category from my product photo, so I can create professional listings in seconds. |

### Technical Implementation Plan

- Add "AI Assist" button to product creation form
- Upload image → GPT-4o Vision analysis → auto-fill fields
- Support 5 languages (en, zu, xh, af, st) for generated content
- Allow seller to edit before saving

### Database Changes

| Change | Details |
|--------|---------|
| New field: `Product.aiGenerated` | Already added in Feature 1 |
| Use existing: `SellerPreferences.languagePreference` | Determine output language |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/generate-product-details` | POST | Image → structured product data |

### UI Changes

| Screen | Change |
|--------|--------|
| Product Create Form | "✨ AI Assist" button next to image upload |
| Product Create Form | Auto-fill animation for name, description, category |
| Product Create Form | Language selector for AI output (default from preferences) |

### Testing Checklist

- [ ] AI generates relevant product name from image
- [ ] AI generates 150+ word description
- [ ] AI suggests correct category from global categories
- [ ] AI generates content in selected language
- [ ] Seller can edit all AI-generated fields before saving
- [ ] Works on mobile (responsive form layout)
- [ ] Performance: Response < 5 seconds
- [ ] Rate limit: 50 AI generations per day per shop
- [ ] Fallback: Form works normally if AI fails

---

## Feature 3: Payment Links via WhatsApp

| Field | Detail |
|-------|--------|
| **Feature Name** | Payment Links via WhatsApp |
| **Status** | ✅ Complete |
| **Problem** | Sellers share bank details manually in WhatsApp chats for payment. This is error-prone, unprofessional, and doesn't track payments. Payment completion rate for manual bank transfers is ~30%. |
| **User Story** | As a seller, I want to generate a payment link for an order and send it via WhatsApp, so buyers can pay instantly with their preferred method. |

### Technical Implementation Plan

- Generate PayFast payment URL from order
- Pre-fill buyer details and amount
- Create WhatsApp deep link with payment URL
- Webhook confirms payment → auto-update order status
- No buyer app required (mobile browser checkout)

### Database Changes

| Change | Details |
|--------|---------|
| New field: `Order.paymentLinkUrl` | Store generated payment link |
| New field: `Order.paymentLinkSentAt` | Timestamp when link was sent |
| New field: `Order.paymentLinkExpiresAt` | Link expiry (24h default) |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/app/actions/payment-link.ts` | Server Action | Generate PayFast payment link for order |

### UI Changes

| Screen | Change |
|--------|--------|
| Order Detail (Dashboard) | "💳 Send Payment Link" button |
| Order Detail | Payment link status indicator |
| Order List | "Awaiting Payment" filter |

### Testing Checklist

- [ ] Payment link generated with correct amount and order reference
- [ ] WhatsApp deep link opens with pre-filled message
- [ ] PayFast checkout page loads correctly on mobile
- [ ] ITN webhook processes payment → marks order PAID
- [ ] Payment link expires after 24 hours
- [ ] Duplicate payment prevention (idempotency)
- [ ] Error state: buyer abandons payment page
- [ ] Seller receives notification when payment completes

---

## Feature 4: Seller Analytics Dashboard V2

| Field | Detail |
|-------|--------|
| **Feature Name** | Seller Analytics Dashboard V2 |
| **Status** | ✅ Complete |
| **Problem** | Current analytics show basic page views and product views. Sellers can't see conversion funnels, revenue trends, or how they compare to category averages. Without actionable insights, sellers can't optimize their business. |
| **User Story** | As a seller, I want to see conversion funnels, revenue trends, and benchmarks against similar sellers, so I can make data-driven decisions to grow my sales. |

### Technical Implementation Plan

- Add conversion funnel visualization (View → Cart → Order → Paid)
- Revenue trend chart (daily/weekly/monthly)
- Category benchmarking (anonymized percentile rankings)
- Product performance ranking (sort by views, orders, revenue)
- Cohort analysis: new vs returning visitors

### Database Changes

| Change | Details |
|--------|---------|
| New: `AnalyticsEvent.type` additions | ADD_TO_CART, CHECKOUT_START, PAYMENT_COMPLETE |
| New: `CategoryBenchmark` table | Precomputed daily aggregates per category |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/app/actions/analytics-v2.ts` | Server Action | Aggregation queries for new metrics |
| `/api/cron/benchmark-aggregation` | Cron | Daily category benchmark computation |

### UI Changes

| Screen | Change |
|--------|--------|
| Analytics Page | Conversion funnel chart |
| Analytics Page | Revenue trend line chart |
| Analytics Page | Category benchmark badges |
| Analytics Page | Product performance table |

### Testing Checklist

- [ ] Conversion funnel correctly tracks View → Cart → Order → Paid
- [ ] Revenue calculations match transaction records
- [ ] Benchmarks don't leak individual seller data
- [ ] Charts render correctly on mobile
- [ ] Date range selector works (7d, 30d, 90d, custom)
- [ ] Empty state for new sellers (no data yet)

---

## Feature 5: Automated Order Reply Bot

| Field | Detail |
|-------|--------|
| **Feature Name** | Automated Order Reply Bot |
| **Status** | ✅ Complete |
| **Problem** | Buyers message sellers on WhatsApp about order status, product availability, and pricing. Sellers must manually reply to each message, often while working. Response delays lose sales. |
| **User Story** | As a seller, I want an AI bot that auto-replies to buyer WhatsApp messages about orders, products, and availability, so buyers get instant answers 24/7. |

### Technical Implementation Plan

- Extend existing WhatsApp AI assistant
- Add order status lookup (buyer sends order number → bot replies with status)
- Add product availability check (buyer asks about size/color → bot checks stock)
- Add payment link generation (buyer says "how to pay" → bot sends link)
- Seller can configure auto-reply hours and fallback messages

### Database Changes

| Change | Details |
|--------|---------|
| Extend: `WhatsAppMessage.intent` | Add ORDER_STATUS, STOCK_CHECK, PAYMENT_REQUEST |
| New field: `SellerPreferences.autoReplyEnabled` | Boolean toggle |
| New field: `SellerPreferences.autoReplyHours` | JSON: { start: "08:00", end: "22:00" } |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhooks/meta-business-api` | POST | Extended handler (already exists) |
| `/api/ai/order-status-reply` | POST | Generate contextual reply |

### UI Changes

| Screen | Change |
|--------|--------|
| AI Chats | Enhanced thread view with intent badges |
| Settings | Auto-reply configuration panel |
| Dashboard Overview | "Bot handled X messages today" stat |

### Testing Checklist

- [ ] Bot correctly identifies order number in buyer message
- [ ] Bot retrieves and formats order status
- [ ] Bot checks real-time stock for product inquiries
- [ ] Bot generates payment links for payment requests
- [ ] Bot respects auto-reply hours (silent outside configured hours)
- [ ] Fallback message when bot can't handle query
- [ ] Seller can take over conversation manually
- [ ] Response time < 3 seconds

---

## Feature 6: Marketplace Ranking Algorithm

| Field | Detail |
|-------|--------|
| **Feature Name** | Marketplace Ranking Algorithm |
| **Status** | ✅ Complete |
| **Problem** | Marketplace currently sorts by newest/trending/price. There's no quality-based ranking that rewards good sellers with more visibility. New sellers can game the system by re-listing products. |
| **User Story** | As a marketplace buyer, I want to see the best products first based on quality signals, so I can find trustworthy sellers and good deals quickly. |

### Technical Implementation Plan

- Quality score per product: `f(views, orders, rating, freshness, seller_tier)`
- Seller health score: response time + order completion rate + return rate
- Default sort: quality score (with promoted listings interleaved)
- Decay function: older products lose ranking unless they maintain engagement

### Database Changes

| Change | Details |
|--------|---------|
| New field: `Product.qualityScore` | Float, computed daily by cron |
| New field: `Shop.healthScore` | Float, computed daily by cron |
| New table: `RankingFactor` | Audit trail: productId, factor, value, computedAt |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cron/ranking-computation` | Cron | Daily ranking score computation |
| `/app/actions/marketplace.ts` | Update | Order by qualityScore |

### UI Changes

| Screen | Change |
|--------|--------|
| Marketplace | Default sort by quality (instead of newest) |
| Product Card | "Top Rated" / "Fast Seller" badges |
| Seller Dashboard | Health score indicator |

### Testing Checklist

- [x] Quality score computed correctly from factors
- [x] Promoted listings still interleaved with organic results
- [x] New products get initial boost (cold-start handling)
- [x] Score decay works for stale products
- [x] Seller health score reflects actual performance
- [x] Badges display correctly on product cards
- [x] No gaming possible (re-list same product for freshness boost)

### Implementation Notes

**Commit:** `4d26bad` — 10 files, 578 insertions  
**Schema:** `Product.qualityScore` (Float, default 50), `Shop.healthScore` (Float, default 50), `RankingFactor` audit table  
**Score Engine:** `lib/intelligence/product-quality.ts` — 5 dimensions: engagement (25), conversion (25), rating (20), freshness (15), seller trust (15)  
**Cold-Start:** Products < 7 days get full freshness (15 pts). Stale products > 60 days drop to 20% freshness.  
**Cron:** `/api/cron/ranking-computation` daily at 02:00 UTC — computes all product quality + shop health scores, purges 30-day-old audit rows  
**Default Sort:** Changed marketplace from "newest" to "quality" (qualityScore DESC), shown as "Best Match" in dropdown  
**Badges:** "⭐ Top Rated" (amber, avgRating ≥ 4.5 + 3 reviews), "⚡ Fast Seller" (emerald, 10+ sold)  
**Anti-Gaming:** Score based on real signals only — views, orders, reviews, seller tier. Re-listing resets freshness but doesn't carry forward engagement/conversion metrics.

---

## Feature 7: Location-Based Discovery Pages

| Field | Detail |
|-------|--------|
| **Feature Name** | Location-Based Discovery Pages |
| **Status** | ✅ Complete |
| **Commit** | `f78ee01` |
| **Problem** | Buyers searching "buy X in [city]" on Google land on generic results. TradeFeed has location data but doesn't create dedicated city-level landing pages that capture high-intent local search traffic. |
| **User Story** | As a buyer searching for products in my city, I want to find a dedicated page showing local sellers and products available near me. |

### Technical Implementation Plan

- Create `/city/{city}` top-level pages (50+ cities)
- Create `/city/{city}/{category}` combination pages (500+ pages)
- Static generation at build time (ISR 5-min revalidate)
- Rich content: shop directory, products, map, category links

### Database Changes

| Change | Details |
|--------|---------|
| No schema changes needed | Use existing `Shop.city`, `Shop.province`, `Shop.lat`, `Shop.lng` |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| No new endpoints | Reuse existing marketplace queries with city filter |

### UI Changes

| Screen | Change |
|--------|--------|
| New: `/city/{city}` | City landing page with shops, products, map |
| New: `/city/{city}/{category}` | City + category combination page |
| Marketplace | "Browse by City" section |
| Footer | City links for internal linking |

### Implementation Notes

Most of the location infrastructure was already built (province pages at `/marketplace/[province]`, city pages at `/marketplace/[province]/[city]`, 31 cities across 9 provinces, JSON-LD, sitemap). This feature filled the remaining gaps:

- **City+Category combo pages** (`/marketplace/[province]/[city]/[category]`) — ~1,271 new SEO pages targeting "buy hoodies in Johannesburg" searches
- **Category cross-links on city pages** — "Browse in Johannesburg: Clothing, Shoes..." pills linking to combo pages
- **Popular Cities section** on marketplace footer — 12 top SA cities for internal linking
- **JSON-LD** — `generateCityCategoryPageJsonLd()` with BreadcrumbList + WebPage (Place + ItemList)
- **Sitemap** — All city×category combos included (priority 0.7, weekly changefreq)
- **Sort fix** — Province, city, category pages now default to "quality" (Best Match) sort

Build generates 5,749 static pages total.

### Testing Checklist

- [x] All 50+ city pages render correctly (31 cities, ISR 300s)
- [x] City + category combinations work (~1,271 pages)
- [x] Structured data (WebPage, ItemList, BreadcrumbList, Place) present
- [x] Sitemap includes all city pages + city+category combos
- [x] Internal linking from marketplace + city pages to categories
- [x] Correct meta titles and descriptions per city+category
- [ ] OpenStreetMap embed shows shop locations (deferred — no map component yet)
- [x] Page loads < 2s (ISR cached, static generated)
- [x] Mobile responsive
- [x] TypeScript clean, production build passes

---

## Feature 6.5: Seller Onboarding Optimization

| Field | Detail |
|-------|--------|
| **Feature Name** | Seller Onboarding Optimization |
| **Status** | ✅ Complete |
| **Commit** | `9ea6a87` |
| **Problem** | Most sellers drop off before creating their first product. Current flow requires 3 steps (signup → create shop → add product) and lands on an empty dashboard. Sellers need to feel immediate value. |
| **User Story** | As a new seller, I want to upload my first product immediately so I can see my shop go live in seconds. |

### Current Flow (Before)
```
Signup → /create-shop (2 fields) → Empty dashboard → /products/new → Product
= 3 pages, 4+ form fields, ~3 minutes
```

### New Flow (After)
```
Signup → /get-started (WhatsApp + photo + name + price) → 🎉 Shop is live!
= 1 page, 4 fields, <60 seconds
```

### Technical Implementation Plan

- New `/get-started` page — replaces `/create-shop` for new users
- 3-step inline flow (no page changes): WhatsApp → Product → Celebration
- Auto-generate shop name from Clerk user name
- Auto-create shop + free subscription in background
- Create first product + upload image in one action
- Celebration screen with live catalog link + WhatsApp share CTA
- Track onboarding metrics: `OnboardingEvent` model in DB

### Database Changes

| Change | Details |
|--------|---------|
| `OnboardingEvent` model | Track signup→product funnel: step completions, timestamps, drop-off |

### Key Metrics to Track

| Metric | Target |
|--------|--------|
| Signup → First product (%) | >50% |
| Time to first product | <60 seconds |
| Drop-off at each step | <20% per step |
| Products per seller (avg) | >3 within first week |

### Implementation Notes

**Commits:** `9ea6a87` (main flow), `66d55f7` + `4ee24d1` (CSP fix for Clerk CAPTCHA)  
**New files:**
- `app/get-started/page.tsx` — Server component with auth guard, existing-shop redirect, onboarding event tracking
- `components/shop/get-started-flow.tsx` — 3-step inline client component (WhatsApp → Product → Celebration)
- `app/actions/onboarding.ts` — `createShopOnboardingAction`, `createFirstProductAction`, `trackOnboardingCompleteAction`

**Schema:** `OnboardingEvent` model (userId, step, metadata, createdAt) with indexes on `[userId, step]` and `[createdAt]`  
**Dashboard redirect:** `app/dashboard/page.tsx` now sends new users to `/get-started` instead of `/create-shop`  
**Backward compatible:** `/create-shop` still works for direct navigation  
**CSP fix:** Added `challenges.cloudflare.com` to `script-src`, `frame-src`, `connect-src` for Clerk Turnstile CAPTCHA

### Testing Checklist

- [x] New users see product upload flow (not empty dashboard)
- [x] Product created in <60 seconds
- [x] Shop auto-generated with correct name and WhatsApp
- [x] User sees live store link immediately
- [x] WhatsApp share button works
- [x] Existing users with shops skip to dashboard
- [x] `/create-shop` still works (backward compatible)
- [x] Onboarding events tracked in DB
- [x] Mobile responsive
- [x] TypeScript clean, production build passes

---

## Feature 8: Seller Referral Program

| Field | Detail |
|-------|--------|
| **Feature Name** | Seller Referral Program |
| **Status** | ✅ Complete |
| **Problem** | Seller acquisition depends on marketing spend and SEO. Existing sellers know other WhatsApp sellers in their networks but have no incentive to invite them. Word-of-mouth is untapped. |
| **User Story** | As a seller, I want to invite other sellers via WhatsApp and earn rewards when they sign up and list products, so I'm motivated to grow the TradeFeed community. |

### Technical Implementation Plan

- Unique referral link per seller (e.g., `tradefeed.co.za/r/{code}`)
- WhatsApp share button with pre-filled referral message
- Reward: Both referrer and referee get 1 month Pro free
- Tracking: referral attribution, conversion tracking

### Database Changes

| Change | Details |
|--------|---------|
| New field: `Shop.referralCode` | Unique string |
| New field: `Shop.referredBy` | FK to referring Shop |
| New table: `Referral` | referrerId, refereeId, status (PENDING/QUALIFIED/REWARDED), rewardedAt |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/app/actions/referral.ts` | Server Action | Create/validate referral |
| `/api/cron/referral-rewards` | Cron | Process qualified referrals → grant Pro trial |

### UI Changes

| Screen | Change |
|--------|--------|
| Dashboard Settings | "Invite Sellers" section with referral link |
| Dashboard Settings | WhatsApp share button |
| Dashboard Overview | "X sellers invited, Y signed up" stat |
| Sign Up | Referral code attribution (from URL param) |

### Testing Checklist

- [x] Referral link generated with unique code
- [x] WhatsApp share opens with pre-filled message
- [x] New seller signup attributes to referrer
- [x] Referral qualifies when referee lists 3+ products
- [x] Both parties receive Pro upgrade
- [x] Self-referral prevention
- [x] Referral stats display correctly
- [x] Referral codes are URL-safe and unique

### Implementation Notes

**Infrastructure was 95% pre-built.** This feature closed the remaining gaps:

**Pre-existing (already working):**
- Referral code generation (`TF-{PREFIX}{HEX}`) — lazy-generated on dashboard visit
- Cookie attribution (sign-up `?ref=CODE` → `tf_ref` cookie → shop creation)
- Full dashboard UI: stats, invite card, leaderboard, downstream tracking, rewards list
- WhatsApp share with pre-filled invite message
- Reward processing: extends referrer's `currentPeriodEnd` by 1 month (atomic + idempotent)
- PayFast webhook triggers reward on subscription upgrade
- i18n keys in all 5 languages

**Gaps filled in this commit:**
1. **3+ products qualification** — `applyReferralReward()` now checks `product.count >= 3` before rewarding. Prevents gaming by sign-up-only referrals.
2. **Product-creation trigger** — `createProductAction()` calls `applyReferralReward()` after each product creation, so the reward fires the moment the 3rd product is created (not just on PayFast upgrade).
3. **Referrer notification email** — New `referral-reward.ts` template. Sent to referrer when reward is applied: shows referred shop name, new expiry date, and dashboard link.
4. **Self-referral already prevented** by design — referral code requires an existing shop, but new users don't have a shop yet at signup time.

---

## Feature 9: Cash-on-Delivery Support

| Field | Detail |
|-------|--------|
| **Feature Name** | Cash-on-Delivery Support |
| **Status** | ⏳ Planned |
| **Problem** | 60%+ of SA e-commerce transactions prefer COD. TradeFeed only supports PayFast online payment. Many informal sellers and buyers prefer cash transactions. |
| **User Story** | As a buyer, I want to choose cash on delivery when ordering, so I can inspect the product before paying. |

### Technical Implementation Plan

- Add COD as payment option in checkout flow
- Seller enables/disables COD per shop
- Order flow: PENDING → CONFIRMED → SHIPPED → DELIVERED (cash collected)
- Seller confirms cash collection in dashboard

### Database Changes

| Change | Details |
|--------|---------|
| New enum value: `Order.paymentMethod` | Add `COD` alongside `PAYFAST`, `MANUAL` |
| New field: `Shop.codEnabled` | Boolean (default false) |
| New field: `Order.codConfirmedAt` | Timestamp when seller confirms cash received |

### UI Changes

| Screen | Change |
|--------|--------|
| Checkout | COD payment option (when seller enables it) |
| Order Management | "Confirm Cash Received" button |
| Shop Settings | COD toggle |

### Testing Checklist

- [ ] COD option appears only for sellers who enable it
- [ ] Order created with paymentMethod=COD
- [ ] Seller can confirm cash collection
- [ ] Order timeline shows COD-specific status updates
- [ ] Analytics tracks COD vs online payment conversion

---

## Feature 10: Local Language AI Assistant

| Field | Detail |
|-------|--------|
| **Feature Name** | Local Language AI Assistant |
| **Status** | ⏳ Planned |
| **Problem** | Current AI features operate in English only. 80% of SA's population speaks a non-English home language. Sellers and buyers interacting with AI in their local language would dramatically improve accessibility and trust. |
| **User Story** | As an isiZulu-speaking seller, I want the AI to understand my messages and respond in isiZulu, so I can manage my shop in my home language. |

### Technical Implementation Plan

- Detect incoming message language (GPT-4o multilingual capability)
- System prompts with language-specific persona
- Product descriptions generated in seller's preferred language
- Buyer-facing AI replies in detected language
- Fallback to English for unsupported languages

### Database Changes

| Change | Details |
|--------|---------|
| Extend: `SellerPreferences.languagePreference` | Already exists (en/zu/xh/af/st) |
| New field: `WhatsAppConversation.detectedLanguage` | Auto-detected from messages |

### UI Changes

| Screen | Change |
|--------|--------|
| AI Chats | Language badge per conversation |
| Seller Preferences | "AI Language" selector |

### Testing Checklist

- [ ] AI detects isiZulu input correctly
- [ ] AI responds in isiZulu with natural phrasing
- [ ] Product descriptions generated in isiXhosa
- [ ] Afrikaans seller gets Afrikaans responses
- [ ] Sesotho buyer inquiry handled in Sesotho
- [ ] Mixed language messages handled gracefully
- [ ] English fallback for edge cases
- [ ] No quality degradation vs English-only responses

---

## Status Summary

| # | Feature | Status | Priority |
|---|---------|--------|----------|
| 1 | WhatsApp Product Import | ✅ Complete | P0 |
| 2 | AI Product Builder | ✅ Complete | P0 |
| 3 | Payment Links via WhatsApp | ✅ Complete | P1 |
| 4 | Seller Analytics V2 | ✅ Complete | P1 |
| 5 | Automated Order Reply Bot | ✅ Complete | P1 |
| 6 | Marketplace Ranking Algorithm | ✅ Complete | P2 |
| 6.5 | Seller Onboarding Optimization | ✅ Complete | P0 |
| 7 | Location-Based Discovery Pages | ✅ Complete | P0 |
| 8 | Seller Referral Program | ✅ Complete | P1 |
| 9 | Cash-on-Delivery Support | ⏳ Planned | P1 |
| 10 | Local Language AI Assistant | ⏳ Planned | P1 |

**Status Legend**: ⏳ Planned | 🚧 In Progress | 🧪 Testing | ✅ Completed
