# TradeFeed Founder Guide

> Operating guide for turning TradeFeed into a category-defining WhatsApp commerce company.
>
> Last updated: 2026-03-14
> Market focus: South Africa first
> Long-term ambition: Build the commerce infrastructure layer for WhatsApp-first sellers in Africa

---

## 1. What We Are Building

TradeFeed should not try to become "another marketplace" first.

The winning position is narrower and stronger:

**TradeFeed is the operating system for WhatsApp sellers.**

That means we help sellers do five jobs better than they can do manually:

1. Create a clean catalog fast
2. Share products easily
3. Capture structured orders
4. Track stock and buyer intent
5. Convert chats into repeat business

If we become the default workflow for one seller segment, revenue follows.
If we try to be everything for everyone, we will get traffic without retention.

---

## 2. What "Million-Dollar Company" Means Here

For this project, a million-dollar company is not a vanity milestone. It is a math problem.

### Revenue targets

| Scenario | Monthly Revenue | Annual Revenue |
|----------|-----------------|----------------|
| Early breakout | R500,000 | R6,000,000 |
| Strong SaaS business | R1,000,000 | R12,000,000 |
| Category leader | R3,000,000+ | R36,000,000+ |

### Plausible ways to get there

| Path | Example |
|------|---------|
| Subscription-led | 2,500 sellers paying R199-R299 per month |
| Mixed monetization | 1,500 paying sellers plus promotions plus payment-link fees |
| Marketplace infrastructure | SaaS + promotion spend + transaction fees + logistics revenue |

The main lesson:

**We do not need millions of users first. We need a focused group of sellers who make real money through the platform and stay.**

---

## 3. Non-Negotiable Principles

These principles should drive product, marketing, support, hiring, and roadmap decisions.

### 3.1 Solve a painful workflow

Do not sell "AI" or "marketplace technology".
Sell outcomes:

- faster listing
- fewer repeated buyer questions
- more completed orders
- more trust
- less admin for sellers

### 3.2 Start with one ideal customer profile

Pick one segment and dominate it before broadening.

Best candidates for TradeFeed:

- clothing wholesalers and resellers
- beauty and hair sellers
- phone and accessory sellers
- township and informal retail sellers with heavy WhatsApp usage

### 3.3 Mobile first means low-friction first

If the product is not excellent on budget Android devices and in WhatsApp-heavy behavior, it is not ready.

### 3.4 Buyers should almost never hit auth friction

Catalogs, products, pricing, FAQ, legal pages, trust pages, and contact pages must be public and indexable.

### 3.5 Trust is a growth feature

Verified seller signals, clear policies, visible support, social proof, and predictable buyer flows are not polish. They are conversion infrastructure.

### 3.6 Distribution is part of the product

Referral loops, share links, vanity URLs, QR codes, and import tools matter because seller acquisition depends on reducing effort and increasing status.

### 3.7 Measure retention before expansion

New feature work should be judged by:

- activation lift
- weekly usage
- paid conversion
- seller revenue growth
- churn reduction

### 3.8 Keep monetization simple

Sellers should understand pricing in one glance.
Complicated plans and hidden rules will slow adoption.

---

## 4. Current Product Position

Based on the repo, TradeFeed already has real substance. This is important because the next step is not "build something from scratch". It is "tighten the wedge and remove friction".

### 4.1 What is already strong

The codebase already shows a credible foundation:

- AI product listing flow
- shareable public catalog pages
- WhatsApp checkout and order creation
- order tracking pages
- seller referrals
- promoted listings
- SEO infrastructure with sitemap and JSON-LD
- public `privacy`, `terms`, and `contact` pages
- seller analytics and marketplace analytics foundations
- product categorization assistance

### 4.2 Important repo-level strengths

These are strategically useful:

- Pricing and FAQ are already present on the homepage, which removes part of the old acquisition friction.
- Legal and contact pages are public and included in sitemap and robots configuration.
- The platform already has multiple monetization rails in code: subscriptions, promotions, and manual upgrade/payment support.
- WhatsApp remains the center of the user journey, which matches the market.

### 4.3 Current strategic risks

These are the highest-value risks visible from the repo and internal docs:

| Risk | Why it matters |
|------|----------------|
| Too broad positioning | "Marketplace for everyone" weakens acquisition and brand clarity |
| Feature spread | Many good features exist, but activation and repeat use may still be fragile |
| Trust gap between promise and backend | Referral UI suggests multi-tier rewards while backend currently enforces only one-month extension |
| Single-country assumptions in validation | Core phone validation still appears South Africa-specific, which blocks later expansion |
| i18n is incomplete | Framework exists, but most pages remain hardcoded English |
| Marketplace quality control | Empty categories, broken thumbnails, and low-quality listings can reduce trust |
| Payments are still partially outside the core flow | Strong for speed, weaker for revenue capture and buyer assurance |

### 4.4 Current progress scoreboard

Snapshot date: 2026-03-15

These percentages are operating estimates, not accounting statements. The goal is to show how close TradeFeed is to being a real business system, not just a feature-complete app.

| Area | Status | Estimated progress | What is true now | What moves it forward |
|------|--------|--------------------|------------------|-----------------------|
| Product foundation | Green | 80% | Core catalog, marketplace, dashboard, checkout, analytics, SEO, admin, and order tracking are built | Improve activation and quality, not just add features |
| Launch readiness | Yellow | 60% | Core app exists, but CI, test depth, stability hardening, and some doc accuracy still need work | Add CI, strengthen tests, fix launch-hardening issues |
| Seller activation | Yellow | 55% | Sellers can create shops and list products, but first-value flow can still be tighter | Guided onboarding, stronger empty states, first-product checklist |
| Buyer trust and conversion | Yellow | 60% | Public legal/contact pages and SEO are in place, but trust consistency and mobile conversion still need work | Standardize navigation, improve CTA visibility, add testimonials and cleaner catalog UX |
| Monetization | Yellow | 65% | Subscriptions and promoted listings exist, but buyer-order payments are still shallow | Add payment links, clearer upgrade triggers, tighter revenue reporting |
| Differentiation | Yellow | 50% | AI listing, WhatsApp flow, and referrals are strong, but some best differentiators are only partially shipped | Finish WhatsApp Business API setup, wire i18n fully, ship stronger seller workflow features |
| Growth engine | Yellow | 40% | There are pieces of referrals, SEO, and shareability, but no fully locked acquisition engine yet | Pick one seller wedge, improve referrals, vanity URLs, QR sharing, segment landing pages |
| Operational maturity | Red | 35% | Strong product work, but company systems are still early | Weekly KPI review, seller interviews, cleaner docs, support and launch process discipline |

### 4.5 Short version

TradeFeed is already beyond MVP.

It is best described as:

- a strong and credible product foundation
- an incomplete launch machine
- an early-stage business engine

If we keep focus, the next big jump will not come from adding random features.
It will come from improving activation, trust, conversion, and monetization in a disciplined way.

---

## 5. What To Fix First

If the goal is revenue and repeatable growth, these are the first priorities.

### Priority 1: Improve seller activation

Target outcome: more new sellers publish their first product within 24 hours.

Ship:

- guided first-product flow
- stronger empty states in dashboard
- one obvious first CTA: add first product with AI
- post-onboarding checklist
- instant share prompt after first publish

### Priority 2: Remove buyer conversion friction

Target outcome: more product page visitors become WhatsApp inquiries or orders.

Ship:

- persistent mobile WhatsApp/cart CTA
- cleaner catalog layout above the fold
- fewer overlapping banners and floating elements
- faster path from product view to seller contact

### Priority 3: Tighten trust and consistency

Target outcome: more buyers trust the platform and more sellers pay.

Ship:

- standard navigation across homepage, marketplace, and catalog
- seller verification criteria that are clear and visible
- public success stories and testimonials
- public help center and response-time expectations
- align referral UI with actual backend rewards

### Priority 4: Improve marketplace quality

Target outcome: marketplace feels worth browsing, not like a collection of uneven catalogs.

Ship:

- hide empty categories
- better image fallback handling
- more filters by price, location, condition, and availability
- stronger category mapping defaults
- quality scoring for new listings

### Priority 5: Capture more of the transaction

Target outcome: increase monetization and seller dependence on TradeFeed.

Ship:

- payment link generation inside seller workflow
- payment status on order timeline
- simple stock decrement or "mark as sold"
- revenue dashboard tied to actual completed orders

---

## 6. Company Principles For "How Everything Must Be"

This is the cultural and product standard.

### Product must be

- faster than manual WhatsApp selling
- clear enough for non-technical sellers
- useful after the first day, not just impressive in onboarding
- opinionated around selling outcomes
- reliable on mobile and weak data conditions

### Brand must be

- local
- practical
- trustworthy
- seller-first
- simple, not over-designed or over-explained

### Growth must be

- referral-driven
- content-light but proof-heavy
- based on seller wins and live catalogs
- supported by partnerships with reseller communities and supplier groups

### Team must be

- disciplined about focus
- metrics-driven
- close to users
- willing to cut features that do not improve retention or revenue

---

## 7. Business Model

TradeFeed should run a layered revenue model.

### 7.1 Core subscription

Current codebase already supports:

- Free
- Pro
- Pro AI

Current documented pricing references:

- Pro: R199 per month
- Pro AI: R299 per month

Recommended pricing logic:

| Plan | Price | Purpose |
|------|-------|---------|
| Free | R0 | Let small sellers prove value fast |
| Pro | R199/mo | Serious sellers who need unlimited products and credibility features |
| Pro AI | R299/mo | Sellers who want AI listing speed, smarter selling help, and premium automation |

### 7.2 Promotion spend

Already present in code:

- Boost: R49/week
- Featured: R149/week
- Spotlight: R399/week

This is strong because it captures intent from sellers who already believe in the marketplace.

### 7.3 Payments revenue

Near-term recommendation:

- start with payment links, not full platform-controlled checkout
- monetize with flat convenience fees or premium payment features
- use payment confirmation as a product retention feature, not just a monetization layer

### 7.4 Future monetization

Only add these after activation and retention improve:

- verified seller subscriptions
- premium shop themes or branding
- logistics margin
- supplier marketplace access fees
- bulk importer / team seats
- embedded financing or working capital

---

## 8. KPI System

If we want a real company, we need a clear scorecard.

### 8.1 North star

**Weekly active sellers who receive buyer intent through TradeFeed**

Why this works:

- it ties activity to actual demand
- it is stronger than vanity signups
- it connects product usage to commercial value

### 8.2 Core funnel metrics

| Stage | KPI | Good target |
|------|-----|-------------|
| Acquisition | Visitor to signup rate | 5%+ |
| Activation | Signup to first product in 24h | 60%+ |
| Activation | Signup to first shared catalog in 24h | 50%+ |
| Activation | Signup to first WhatsApp inquiry in 7 days | 30%+ |
| Retention | Weekly active sellers / total sellers | 40%+ |
| Retention | 8-week seller retention | 35%+ |
| Monetization | Free to paid conversion in 30 days | 8% to 15% |
| Monetization | ARPA | R220+ |
| Quality | Buyer inquiry to order conversion | 15%+ |

### 8.3 Operational metrics

Track these weekly:

- time to first product
- time to first order inquiry
- average products per active seller
- share rate per active seller
- WhatsApp CTA click-through rate
- order completion rate
- seller churn
- promotion attach rate
- support response time

### 8.4 Guardrail metrics

These tell us if growth is unhealthy:

- % of marketplace listings with missing images
- % of product pages with zero CTA clicks
- % of sellers inactive after 7 days
- number of broken catalog links
- legal/support page traffic drop
- refund or dispute rate once payments are deeper in flow

---

## 9. Pricing, Packaging, and Upgrade Logic

The packaging should push sellers naturally from free to paid.

### Free plan should include

- up to 10 products
- public catalog
- WhatsApp checkout
- basic analytics

### Pro plan should justify itself through business value

- unlimited products
- verification priority or trust badges
- advanced catalog customization
- stronger analytics
- payment link support
- better order tools

### Pro AI plan should be outcome-based

- AI listing credits or unlimited AI assistance
- price suggestions
- smart reply templates
- future AI sales assistant features

### Upgrade triggers

Prompt upgrade when a seller:

- hits product limit
- gets repeated buyer inquiries
- wants promotion tools
- wants verification
- wants payment links
- wants faster listing at scale

Do not push upgrade prompts too early.
Show them when the seller has felt value.

---

## 10. 12-Month Roadmap

This roadmap is tighter than the previous version. It prioritizes company-building over feature collecting.

### Phase 1: Activation and trust (Month 1 to Month 3)

Goal: make first value obvious and remove trust blockers.

Ship:

- first-product onboarding improvements
- sticky mobile order CTA
- navigation consistency across public surfaces
- image fallback and empty-state cleanup
- public testimonial and trust pages
- align referral rewards in product and backend
- activation analytics dashboard

Success metrics:

- 60%+ first-product activation in 24 hours
- 30%+ first inquiry in 7 days
- lower bounce on product and catalog pages

### Phase 2: Seller revenue tooling (Month 4 to Month 6)

Goal: help sellers close more business and justify paid plans.

Ship:

- AI price suggestions
- better search and filtering
- payment links in seller workflow
- stock decrement or mark-as-sold
- order/revenue reporting
- QR sharing for offline sellers
- vanity usernames for stronger sharing

Success metrics:

- more repeat seller sessions
- higher paid conversion
- higher inquiry-to-order rate

### Phase 3: Acquisition engine (Month 7 to Month 9)

Goal: reduce seller setup time and accelerate distribution.

Ship:

- WhatsApp catalog import
- buyer share loop
- stronger referral mechanics
- partner onboarding kits for reseller communities
- case-study landing pages per segment

Success metrics:

- lower time to first catalog
- higher referral coefficient
- more signups from seller-shared links

### Phase 4: Deeper monetization and regional readiness (Month 10 to Month 12)

Goal: expand revenue depth before geographic breadth.

Ship:

- seller health scoring
- advanced analytics upsell
- stronger verification program
- multi-country phone and currency groundwork
- delivery partner experiments

Success metrics:

- ARPA increase
- promotion revenue growth
- payment usage growth
- healthier retained seller cohorts

---

## 11. Focused Product Review

This is the blunt version of what matters most right now.

### What is working

- The core concept has real market logic.
- WhatsApp remains central instead of being bolted on.
- Public SEO and legal infrastructure are materially better than many early-stage products.
- The codebase already contains multiple monetization paths.

### What needs discipline

- The strategy still risks spreading across too many categories and future-country ideas too early.
- Some growth ideas are promising but should not outrank activation and retention work.
- The marketplace experience must feel more curated and trustworthy if it is going to support paid promotion.

### What I would not do yet

- broad Africa expansion before South Africa retention is strong
- full payment custody if simple payment links solve 80% of the need
- too many plan variants
- heavy enterprise tooling before small sellers are retained

### What I would do immediately

1. Pick a primary seller wedge for the next 90 days.
2. Track activation and weekly seller usage with discipline.
3. Fix every conversion leak on mobile catalog and product flows.
4. Improve trust signals and marketplace quality.
5. Tie paid upgrades to clear seller outcomes.

---

## 12. Operating Cadence

To build a real company, the team should run this cadence every week.

### Weekly

- review activation, retention, churn, and paid conversion
- talk to at least 5 sellers
- ship one activation improvement
- ship one trust or conversion improvement
- review support tickets for repeated friction

### Monthly

- review cohort retention
- review plan conversion and upgrade triggers
- publish one seller success story
- cut or simplify one underused feature

### Quarterly

- decide whether the current wedge is strong enough to deepen or whether to add one adjacent segment
- revisit pricing based on usage and value capture
- re-rank roadmap based on retention and revenue impact

---

## 13. Final Strategic Position

The best way to build a million-dollar company from this project is:

**Become the default selling workflow for a specific kind of WhatsApp seller, then expand from workflow ownership into payments, promotion, trust, and infrastructure.**

Do not optimize for sounding bigger.
Optimize for being indispensable.

That means:

- narrower positioning
- clearer seller outcomes
- better activation
- stronger retention
- simpler monetization
- trust everywhere

If TradeFeed helps sellers make money consistently, the company will grow.
If TradeFeed only looks impressive, it will stall.
