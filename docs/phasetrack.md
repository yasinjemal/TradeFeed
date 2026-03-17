# TradeFeed Product Roadmap — Phase Track

**Date**: 2026-03-17  
**Version**: 2.0  
**Rule**: Features are developed ONE AT A TIME. No parallel feature development.

---

## Active Feature

> **Feature 1: WhatsApp Product Import** — ✅ Complete  
> **Feature 2: AI Product Builder** — ✅ Complete
> 
> **Next Up: Feature 3: Payment Links via WhatsApp**

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
| **Status** | ⏳ Planned |
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
| **Status** | ⏳ Planned |
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
| **Status** | ⏳ Planned |
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
| **Status** | ⏳ Planned |
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

- [ ] Quality score computed correctly from factors
- [ ] Promoted listings still interleaved with organic results
- [ ] New products get initial boost (cold-start handling)
- [ ] Score decay works for stale products
- [ ] Seller health score reflects actual performance
- [ ] Badges display correctly on product cards
- [ ] No gaming possible (re-list same product for freshness boost)

---

## Feature 7: Location-Based Discovery Pages

| Field | Detail |
|-------|--------|
| **Feature Name** | Location-Based Discovery Pages |
| **Status** | ⏳ Planned |
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

### Testing Checklist

- [ ] All 50+ city pages render correctly
- [ ] City + category combinations work
- [ ] Structured data (WebPage, ItemList, BreadcrumbList) present
- [ ] Sitemap includes all city pages
- [ ] Internal linking from marketplace/categories
- [ ] Correct meta titles and descriptions per city
- [ ] OpenStreetMap embed shows shop locations
- [ ] Page loads < 2s (ISR cached)
- [ ] Mobile responsive

---

## Feature 8: Seller Referral Program

| Field | Detail |
|-------|--------|
| **Feature Name** | Seller Referral Program |
| **Status** | ⏳ Planned |
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

- [ ] Referral link generated with unique code
- [ ] WhatsApp share opens with pre-filled message
- [ ] New seller signup attributes to referrer
- [ ] Referral qualifies when referee lists 3+ products
- [ ] Both parties receive Pro upgrade
- [ ] Self-referral prevention
- [ ] Referral stats display correctly
- [ ] Referral codes are URL-safe and unique

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
| 2 | AI Product Builder | ⏳ Planned | P0 |
| 3 | Payment Links via WhatsApp | ⏳ Planned | P1 |
| 4 | Seller Analytics V2 | ⏳ Planned | P1 |
| 5 | Automated Order Reply Bot | ⏳ Planned | P1 |
| 6 | Marketplace Ranking Algorithm | ⏳ Planned | P2 |
| 7 | Location-Based Discovery Pages | ⏳ Planned | P0 |
| 8 | Seller Referral Program | ⏳ Planned | P1 |
| 9 | Cash-on-Delivery Support | ⏳ Planned | P1 |
| 10 | Local Language AI Assistant | ⏳ Planned | P1 |

**Status Legend**: ⏳ Planned | 🚧 In Progress | 🧪 Testing | ✅ Completed
