# TradeFeed founder audit and 30-day operating plan

**Decision date:** 23 July 2026
**Operating window:** 24 July-22 August 2026
**Goal:** 1,000 legitimate, newly verified activations: **250 sellers + 750 buyers**

This is an operating plan, not a forecast or a promise. The target is possible only if TradeFeed adds a six-person acquisition/activation team, partner distribution, trustworthy activation measurement, and daily founder-led customer contact. A founder working alone, or a plan based mainly on content and paid ads, will not produce 1,000 legitimate activations from the current baseline in 30 days.

## Current Reality

The production snapshot shows a product with real supply, but not yet a working marketplace growth loop.

| Signal | Current evidence |
|---|---:|
| Registered users | 80 |
| Active shops | 79 |
| Active, non-flagged products | 215 |
| Shops with at least 1 product | 52 of 79 |
| Shops with at least 3 products | 20 of 79 |
| Shops with at least 3 basic-quality listings | 10 of 79 |
| Shops with city and province | 17 of 79 |
| Raw order records | 63 |
| Order status mix | 29 pending, 12 confirmed, 2 shipped, 16 delivered, 4 cancelled |
| Buyer profiles / follows / wishlists | 8 / 5 / 9 |
| Active paid subscriptions | 1 Pro AI; 76 active Free |

The last 30 days are much weaker:

| Signal | Last 30 days |
|---|---:|
| New users / shops | 2 / 2 |
| New products | 6 total, 5 currently active |
| Raw orders | 4 |
| Distinct real buyer identities visible in orders | 1 after excluding a seller-matching phone |
| Product views / marketplace views / marketplace clicks | 2,637 / 81 / 19 |
| Add-to-cart / checkout start / WhatsApp checkout | 12 / 4 / 4 |
| Onboarding events | 2 shop-created, 1 product-created, 2 completed, 0 catalog-shared |

Every existing `AnalyticsEvent.visitorId` is null. The view and click counts therefore cannot be deduplicated or reliably separated from owners, bots, previews, and repeat visits. They are activity counts, not users or traction. The strict activated-user baseline is consequently **not measurable**, and none of the legacy registrations will be counted until re-qualified.

The public product is visually credible, mobile-oriented, and has a genuinely useful core: one photographed item can become a shareable product page and a structured WhatsApp order. The public promise is understandable. However, time to value is undermined by a slow auth hand-off, an anonymous create-shop dead end, thin seller inventory, inconsistent trust claims, and no proven route from catalog creation to a real buyer response.

## Primary Constraint

**TradeFeed does not have a repeatable, measurable activated-marketplace loop.**

This is one constraint with four linked symptoms:

1. Supply is too thin and inconsistent to create dense buyer choice.
2. Sellers are not systematically made to share a catalog with existing customers.
3. Buyer intent and seller-confirmed outcomes cannot currently be joined to a stable non-owner identity.
4. Acquisition has no concentrated offline/partner engine in a single community.

Building more broad marketplace features would increase surface area without fixing this loop.

## Founder Decision

### Beachhead

TradeFeed will focus for 30 days on:

> Owner-operated fashion and footwear resellers in Greater Johannesburg who source from the CBD/Fashion District and already sell through WhatsApp Status and direct messages.

The working positioning is:

> **Photograph new stock once, get a polished live catalogue in seconds, and receive exact size and colour orders on WhatsApp—free.**

The primary promise is less admin and cleaner orders, not “marketplace exposure.”

Why this segment:

- Fashion and footwear already dominate the visible TradeFeed inventory.
- Product variation, frequent stock changes, images, price, size, and colour create a recurring catalog problem.
- The customer already works in WhatsApp, so TradeFeed can fit the current workflow rather than demand a new one.
- Gauteng contains a large share of South Africa’s informal business base. Stats SA reports 1.9 million informal businesses in 2023, with Gauteng accounting for 28.9%; trade was 48.2% of the sector, and 34.3% reported a need for marketing support ([Stats SA](https://www.statssa.gov.za/?p=18255)).
- A 2025 Standard Bank township-economy report found WhatsApp use far ahead of business websites in its sample. This is directional evidence, not a TradeFeed conversion benchmark ([Standard Bank report](https://www.standardbank.co.za/static_file/South%20Africa/PDF/Township%20Informal%20Economy%20Insights%20Report%202025/Standard%20Bank%20Township%20Informal%20Economy%20Report%20October%202025%20Final.pdf)).
- The City of Johannesburg describes the Fashion District as a dense trading cluster. Its published counts are old and must be checked on the ground before being used publicly ([City of Johannesburg](https://joburg.org.za/departments_/Pages/MOEs/jda/Fashion-District.aspx)).

### The side to acquire first

Acquire qualified sellers first, but never acquire supply without attached demand. Every seller activation includes a catalog share and a real non-owner visitor. Each activated seller is then responsible for introducing at least 20 existing customers; TradeFeed and the seller jointly create the first three confirmed buyer interactions.

### Marketplace liquidity threshold

A fashion subcategory/geography cell is “buyer-ready” only when it has:

- at least 25 current, in-stock, basic-quality listings;
- at least 5 independently operated, responsive sellers;
- price, image, category, size/colour where relevant, location, and collection/delivery details;
- at least 80% of valid enquiries acknowledged within two business hours; and
- at least 10 seller-confirmed buyer enquiries per week.

This is an operating threshold to test, not a claim that the existing marketplace already meets it. Empty or sub-threshold category pages should not be promoted in campaigns.

## Activation definitions

### Seller activation — the counted event

A seller is activated only when all of the following occur:

1. a real owner has completed registration;
2. a working business WhatsApp number has been manually or technically verified;
3. business name, Greater Johannesburg city/area, province, fulfillment method, and profile image are complete;
4. at least 3 active, in-stock products each have an image, positive price, category, and useful description; relevant size/colour variants are valid;
5. the seller shares the catalog through a tracked TradeFeed share action; and
6. at least 1 distinct, non-owner, non-bot visitor views 2 or more products in that catalog within 7 days.

**Seller value activation:** the first valid WhatsApp enquiry or order is seller-confirmed within 14 days.

### Buyer activation — the counted event

A buyer is activated only when one distinct, non-owner, non-bot visitor:

1. browses at least 2 active products;
2. starts a valid WhatsApp enquiry or creates an order for a specific product/variant; and
3. is confirmed by the seller as a genuine buyer interaction within 72 hours.

A button click alone does not count. A buyer is counted once in the 30-day window, even if they contact multiple sellers. Test orders, seller self-orders, duplicates, bots, staff, and invalid phone numbers are excluded.

### Retention

- **Seller D7 retained:** returns on a separate day and updates stock, adds a product, shares again, or responds to an order/enquiry.
- **Seller W4 retained:** has meaningful seller activity in week 4.
- **Buyer D7 retained:** returns on a separate day or produces a second seller-confirmed enquiry/order.
- **Paying customer:** a seller with a successfully collected non-Free subscription payment; never inferred from a plan-selection click.

## Product audit

### What TradeFeed solves

TradeFeed turns stock photos and structured product details into a mobile catalog that a small seller can share and transact from through WhatsApp. For the chosen seller, the painful recurring job is answering the same availability, price, size, colour, delivery, and order-format questions in DMs.

The strongest current value is not the broad marketplace. It is:

> A cleaner, always-current catalog and an exact order message without asking the seller to abandon WhatsApp.

### Time to value

The intended time to first listing is under five minutes, but the original mobile signup pushed the actual Clerk form roughly 1,100 px below a full marketing panel, and anonymous visitors could complete the create-shop form only to fail at submission. A three-product strict activation can reasonably be completed in 10-15 assisted minutes if photos and prices are ready. The first buyer value should occur the same day through an existing-customer share.

### Friction and quality findings

**High-impact findings**

- Mobile signup and sign-in placed marketing before the form.
- `/create-shop` was publicly accessible although its action requires authentication.
- Catalog sharing is present but was not recorded once in the last 30 days.
- The marketplace is broad while inventory is thin; a buyer can encounter shallow categories and stale sellers.
- Marketplace keyword search returned relevant results and a usable no-results state in the live test, but the result count and category totals were inconsistent with the homepage because they apply different eligibility/grouping rules.
- Product detail can take roughly 4 seconds to become ready in the observed production journey.
- Variant selection can be required while a WhatsApp path remains available without a valid option.
- Payment and “secure payment” messaging is inconsistent with seller-specific PayFast/manual/WhatsApp flows.
- The mobile homepage header overflowed a 390 px viewport, and the floating support control obscured marketplace/catalog content.
- A full screen-reader/assistive-technology audit was not completed. Keyboard navigation, focus order/visibility, accessible names, form errors, contrast, reduced-motion behavior, and 200% zoom must be tested before calling the experience accessible.

**Trust findings**

- The homepage used a fictional “verified” seller card with 127 fulfilled orders without initially labeling it as an illustration; the platform has 63 raw order rows.
- Public copy said a phone number stays private, while direct `wa.me` links necessarily expose the business number.
- Some SEO and marketing copy implied “thousands” of products or nationwide coverage not supported by the current database.
- All 11 approved reviews in the inspected snapshot were unverified, so review approval must never be presented as verified purchase status.
- Product and catalog pages need explicit seller-level payment, returns, delivery, collection, response-time, and verification facts rather than platform-wide assurances.

### What to simplify

The core seller path for this sprint is:

`sign up → create shop → add 3 products → verify preview → share → first buyer response`

Buyer accounts, follows, wishlists, promotions, advanced analytics, AI depth, custom domains, team controls, and multiple plan variants must not compete with that path during the sprint.

## Marketplace audit

Current supply is insufficiently dense: only 20 shops have three products, only 10 have three basic-quality listings, and only 17 have city and province. The marketplace can show 200+ products while still failing a specific buyer because inventory is spread across categories, sellers, and locations.

For the first 30 days:

- campaign links go to curated Joburg fashion collections or seller catalogs, not an undifferentiated marketplace home;
- a human verifies price, stock, image, variants, location, and fulfillment before a listing enters the campaign collection;
- buyer requests are manually routed to up to three responsive sellers;
- sellers who fail two response checks are removed from the promoted collection until reverified;
- no category or seller is described as verified without documented criteria and evidence.

## Target-customer audit

### Current alternatives

- WhatsApp Business catalogs: embedded in the communication tool and free, but discovery and a structured cross-seller marketplace are limited ([Meta introduction](https://about.fb.com/news/2019/11/introducing-catalogs-for-small-businesses/)).
- Instagram/Facebook posts and Stories: familiar and visual, but stock and order details fragment quickly.
- Status posts plus manual DMs: zero setup, but repeated questions and missed/ambiguous orders.
- Store builders such as [Clinch](https://clinchsa.co.za/), [Shopstar](https://www.shopstar.co.za/pricing-and-features), and [Portmoni](https://portmoni.com/online-store-builder-pricing-south-africa/): more complete stores, but more setup and workflow change.
- Large marketplaces such as [Takealot](https://www.takealot.com/sell) and [Bob Shop](https://www.bobshop.co.za/content/153/Sell_on_Bob_Shop.html): potential demand, but fees, onboarding, catalog rules, and marketplace operations differ from direct WhatsApp selling.

The strongest objection will be: “I already sell on WhatsApp/Instagram; why add another place to update?” The answer must be demonstrated, not asserted: create three live listings from the seller’s current stock, send one accurate order to their WhatsApp, and show that the same link can be reused in Status and DMs.

### Pricing and business model decision

TradeFeed currently presents Free, Starter (R99/month), Pro (R299/month), and Pro AI (R499/month) plans, while the inspected subscription base is 76 active Free and 1 active Pro AI. That is not enough evidence to optimize packaging or claim willingness to pay.

During this sprint:

- keep the free three-product activation path free and cardless;
- do not add another plan, payment rail, commission, or listing fee;
- interview at least 15 value-activated sellers about the last product for which they paid and the operational result they would pay TradeFeed to repeat;
- test willingness to pay only after first buyer value, using one concrete upgrade outcome;
- report upgrade views, checkout starts, successful collections, churn, and collected revenue separately.

The revenue hypothesis is a seller subscription for workflow/merchandising advantages after value is proven. Marketplace transaction revenue is not a valid near-term assumption while many orders complete directly in WhatsApp.

## Acquisition audit and channel decision

### Selected engine

**Primary engine:** wholesaler-distributed, field-assisted reseller onboarding at stock-collection points.

**Supporting channel 1:** permissioned WhatsApp/community distribution through wholesalers, market organizers, fashion groups, and existing seller lists.

**Supporting channel 2:** activated-seller referrals, paid only after the referred seller reaches value activation.

Organic content supports proof and follow-up. SEO is useful compounding work but too slow to carry this 30-day target. Paid Meta is a capped validation test only after assisted and self-serve conversion are measured.

Channel roles are deliberately unequal:

- **Founder-led sales and field/events:** fastest learning and highest activation control; primary during the sprint.
- **WhatsApp:** seller workflow and permissioned distribution channel, not a scraped cold-blast channel.
- **Email:** useful for formal wholesaler, association, venue, and service-provider follow-up; too weak for the reseller-volume assumption.
- **TikTok, Instagram Reels, Facebook, and WhatsApp Status:** demonstration/proof and buyer drops; activation is credited only through tracked links.
- **LinkedIn:** partner and founder credibility, not seller-volume acquisition.
- **YouTube:** a home for setup demos and searchable proof, but too slow for the base target.
- **Communities and associations:** partner access; use administrator permission and measurable pilots.
- **SEO/content:** compounding seller-intent capture; no material month-one forecast.
- **Paid advertising:** a R4,000 controlled validation reserve, gated by activation conversion.

### Channel estimates

These are planning ranges to replace with actual cohort data by day 7.

| Channel | 30-day activation potential | First signal | Estimated spend | Operational load | Decision |
|---|---:|---:|---:|---|---|
| Field-assisted seller setup | 165-385 sellers | 24-48h | R31k-R54k | Very high | Primary |
| 10-20 wholesaler/stock-point partners | 80-250 sellers | 3-7d | R5k-R25k | High | Primary distribution |
| 8-12 setup workshops | 60-150 sellers | 3-7d | R8k-R25k | High | Use inside primary |
| Permissioned WhatsApp lead list | 50-150 sellers | 24-72h | R4k-R12k | High | Support |
| Community admins/social groups | 20-80 sellers | 3-10d | R0-R15k | Medium | Support |
| Activated-seller referrals | 15-75 sellers | 5-21d | R3k-R10k | Medium | Support |
| Meta validation test | 20-65 sellers | 2-7d | R5k test | Medium | Conditional only |
| SEO/content search | 5-30 sellers | 14-30+d | Founder time | Medium | Do not rely on target |
| Associations | 0-100 sellers | 2-6 weeks | Variable | High | Pipeline, not baseline |

Do not scrape numbers or blast unsolicited WhatsApp marketing. Use warm customer relationships, explicit opt-ins, partner-permissioned lists, QR codes, public group posts permitted by administrators, and documented consent. Direct marketing must follow POPIA and the Information Regulator’s guidance ([guidance note](https://inforegulator.org.za/wp-content/uploads/2020/07/GUIDANCE-NOTE-ON-DIRECT-MARKETING-IN-TERMS-OF-THE-PROTECTION-OF-PERSONAL-INFORMATION-ACT-4-OF-2013-POPIA.pdf)).

## The mathematical 1,000-activation funnel

### Goal composition

| Activated role | Target | Why |
|---|---:|---|
| Strict sellers | 250 | Enough concentrated supply to seed dense collections and distribute to existing customers |
| Confirmed buyers | 750 | Three genuine buyer activations per activated seller |
| **Total** | **1,000** | Roles deduplicated; no seller self-orders |

The seller-only interpretation is rejected for this sprint. At the conservative conversion assumptions below, 1,000 activated sellers would require about 2,000 completed registrations, 2,667 attempts and, through direct outreach alone, roughly 44,445 personalized deliveries and 6,667 two-way conversations. It is not credible in the current operating setup.

### Seller funnel assumptions

- personalized seller contact → two-way conversation: **15%**
- conversation → registration attempt: **40%**
- registration attempt → completed registration/shop: **75%**
- completed registration → strict seller activation by D7: **50%**
- partner-member impression → qualified seller visit: **5%**
- partner seller visit → registration attempt: **20%**
- referral invitation → qualified seller visit: **10%**
- referral visit → registration attempt: **30%**
- dormant seller outreach → conversation/restart: **50%**
- dormant restart → strict activation: **about 47% of contacts / 67% of restarts**

These are conservative planning estimates, not observed TradeFeed rates.

| Seller source | Source volume | Qualified conversations/visits | Attempts | Completed registrations | Strict sellers |
|---|---:|---:|---:|---:|---:|
| Personalized operator outreach | 6,667 deliveries | 1,000 conversations; 600 visits | 400 | 300 | 150 |
| 20 community/stock-point partners | 17,333 targeted impressions; 200 partner pitches | 50 partner replies; 867 visits | 173 | 130 | 65 |
| Activation-based seller referral | 1,867 invitations | 187 visits | 56 | 42 | 21 |
| Recover dormant registered sellers | 59 contacts | 30 conversations/restarts | Existing accounts | Existing accounts | 14 |
| **Total** |  | **1,080 conversations; 1,684 seller visits** | **629** | **472** | **250** |

Use 630 attempts as the operating target to preserve rounding. Completed registrations are lower than the sum of new activations and funnel attrition because 14 target activations come from existing dormant accounts.

### Buyer funnel assumptions

Buyer acquisition starts with sellers’ and partners’ existing, legitimate audiences. A **qualified buyer visit → seller-confirmed buyer activation rate of 5%** is the operating assumption. Current TradeFeed events cannot validate it because every legacy visitor ID is null.

| Buyer source | Gross targeted reach | Qualified visits | Confirmed activation rate | Confirmed buyers |
|---|---:|---:|---:|---:|
| Seller-owned WhatsApp Status/groups | 150,000 | 12,000 at 8% | 5% | 600 |
| Partner curated product drops | 25,000 | 2,000 at 8% | 5% | 100 |
| TradeFeed content syndicated through seller/partner accounts | 50,000 | 1,000 at 2% | 5% | 50 |
| **Total** | **225,000** | **15,000** | **5%** | **750** |

The seller-owned reach requires about 270 participating seller nodes—250 new strict sellers plus 20 requalified existing sellers—making 12 placements during the month. At an average 46 gross views per placement, that supplies about 150,000 impressions. Actual reach, unique visits, and activation must be measured in the first 72 hours. Screenshots of Status views are supporting evidence; tracked, deduplicated behavior and seller confirmation determine activation.

### Combined top-of-funnel requirements

| Requested planning quantity | Selected-plan requirement |
|---|---:|
| Activated users | 1,000 |
| Completed seller registrations | 472 |
| Seller registration attempts | 630 |
| Qualified website/catalog visitors | 16,684: 1,684 seller + 15,000 buyer |
| Required two-way outreach/partner conversations | 1,080 |
| One-to-one seller deliveries | 6,667 new seller contacts + 1,867 referral invitations + 59 dormant contacts |
| Gross targeted content/community reach | About 242,333: 225,000 buyer-facing + 17,333 partner seller-recruitment |

Daily calendar averages are 222 new personalized seller contacts, 36 two-way outreach/partner conversations, 56 qualified seller visits, 21 attempts, 16 completed registrations, 8.3 strict sellers, 7,500 buyer-facing impressions, 500 qualified buyer visits, 25 confirmed buyers, and 33.3 total activations. These averages hide a required ramp; the weekly table below is the control plan.

A person who activates as both buyer and seller is counted once in the 1,000-user total, while still appearing in both role-conversion reports. Paid media receives no activation credit until visitor, role, source, non-owner state, global deduplication, and seller confirmation can be joined.

## 30-day targets

### Weekly outcome targets

| Period | New strict sellers | New confirmed buyers | Period total | Cumulative |
|---|---:|---:|---:|---:|
| Days 1-7 | 35 | 75 | 110 | 110 |
| Days 8-14 | 55 | 150 | 205 | 315 |
| Days 15-21 | 70 | 225 | 295 | 610 |
| Days 22-30 | 90 | 300 | 390 | 1,000 |

### Daily operating targets after the first setup days

- 222 new personalized seller contacts across four outbound operators.
- 36 qualified two-way seller/partner conversations.
- 56 qualified seller visits.
- 21 registration attempts.
- 16 completed registrations.
- 8-9 strict seller activations.
- 7,500 buyer-facing seller/partner impressions.
- 500 qualified buyer visits.
- 25 seller-confirmed buyer activations.
- 3 seller interviews and 2 buyer interviews until 30 of each are complete.
- 7 partner pitches per calendar day until 200 have been completed and 20 live partners are secured.
- 1 short proof-based video per day and 3 seller proof posts per week.
- 100% same-day follow-up on incomplete registration and incomplete three-product setup.

## First seven-day execution sprint

No more than three priorities run concurrently:

1. make activation safe and measurable;
2. prove field-assisted seller activation in the beachhead;
3. prove that each activated seller can generate three confirmed buyers.

### Day 1 — instrumentation, safety, and the partner list

**Codex/engineering**

- Deploy stable first-party visitor identity, owner/bot exclusion, source context, and activation-event integrity.
- Close public order-tracking PII exposure and checkout tenant/price/stock validation.
- Deploy mobile auth/create-shop and truthful trust-copy fixes.
- Create a daily activation export with source, cohort, seller checklist, buyer identity, and confirmation state.

**Human founder**

- Approve the operating budget and recruit four outbound operators plus two onboarding/activation concierges.
- Build the first 300 qualified seller records and a list of 30 named Joburg fashion/footwear wholesalers, stock points, market organizers, and community administrators, with decision-maker contact and permission basis.
- Book the first two on-site setup blocks.
- Deliver 215 permission-compliant, personalized seller messages and 12 partner pitches.

**Gate:** no public acquisition push until test events show a distinct buyer, owner exclusion, catalog share, and seller confirmation without leaking personal data.

### Day 2 — concierge activation

- Deliver 215 new seller messages, follow up day-1 replies, and send 12 partner pitches.
- Conduct moderated seller setups, in person or screen-shared.
- Time each stage: pitch accepted, attempt, registration complete, shop complete, product 1, product 3, share, non-owner view.
- Record abandonment reason verbatim.
- Publish the 30-second photo-to-live-catalog demonstration.
- Have every activated seller distribute the tracked catalog to a legitimate, permissioned audience.
- Confirm every buyer interaction manually.

**Target:** 5 strict seller activations and the first fully tracked seller-share-to-confirmed-buyer path.

### Day 3 — first demand drop

- Build and publish the first Johannesburg Streetwear collection from verified current stock.
- Deliver 215 new seller messages and 12 partner pitches.
- Require tracked sharing from every activated seller; collect gross reach only as a diagnostic.
- Ask 10 incomplete sellers why they stopped; do not infer.
- Publish one real before/after catalog demonstration with seller permission.

**Target:** 5 new strict sellers and 10 confirmed buyers.

**Early trigger:** if the first 1,000 qualified buyer visits produce fewer than 30 confirmed buyer activations, stop scaling reach and repair stock relevance, price/size clarity, seller trust, or the enquiry path.

### Day 4 — repair the largest loss

- Compare conversation → attempt → completed shop → three listings → share → qualified buyer → confirmation.
- Fix only the largest observed loss.
- Run one 3-hour setup desk at a stock point.
- Have reps create listings only from current stock; the owner controls the account and passwords.
- Run quality verification and a test order before the seller leaves.
- Route five real buyer requests manually to responsive sellers.
- Deliver 215 new seller messages and 12 partner pitches.

**Target:** 5 new strict sellers and 10 confirmed buyers.

### Day 5 — field/group clinic

- Run a 60-minute field/group onboarding clinic and activate 8-10 sellers in one batch.
- Call every prior seller without a share, non-owner visitor, or response.
- Deliver 215 new seller messages and 12 partner pitches.
- Publish a consented case study using real time saved, products listed, catalog visits, and confirmed enquiries—never invented revenue.
- Ask every value-activated seller for two relevant seller introductions.
- Close two more partner dates.

### Day 6 — recovery, proof, and second demand drop

- Follow up every stalled signup with stage-specific help.
- Run the second partner/community setup block and curated product drop.
- Deliver 215 new seller messages and 10 partner pitches.
- Send sellers a stock-refresh prompt and have them update one item.
- Interview 5 confirmed buyers: relevance, trust concern, missing fact, and whether they would return.
- Remove stale or unresponsive listings from the campaign collection.

### Day 7 — cohort review and scale decision

**Minimum cumulative outcomes**

- 1,500 personalized new-seller contacts.
- 225 direct two-way conversations.
- 80 partner pitches and 8 live partner pilots targeted.
- 200 referral invitations.
- 230 qualified seller visits.
- 85 registration attempts and 64 completed registrations.
- 35 strict seller activations.
- 22,500 buyer-facing impressions, reported separately from users.
- 1,500 qualified buyer visits.
- 75 distinct seller-confirmed buyer activations.
- 80% of activated sellers with three quality listings and a valid location.
- 80% of valid enquiries acknowledged within two business hours.
- 10 seller interviews and 5 buyer interviews.
- 2 productive partner sessions and 4 additional dates booked as a minimum.

Continue the same engine only if at least 15% of personalized seller deliveries produce a two-way conversation, at least 40% of conversations produce an attempt, at least 75% of attempts complete a shop, at least 50% of completed registrations reach strict activation by D7, and qualified buyer visits convert to confirmed activation at 5% or better. Hold broader supply acquisition if the first strict sellers receive a median of fewer than 2 confirmed buyer activations by D7; scale toward the month target only as that median reaches 3.

## Founder-led outreach process

### Qualification

A seller prospect qualifies when they:

- independently operate a fashion/footwear resale business;
- have at least 3 currently available products;
- use WhatsApp with customers at least weekly;
- can provide legitimate prices, stock, product photos, and fulfillment details;
- are in Greater Johannesburg for this sprint; and
- control or have authority over the business account.

Log source, segment, current workflow, stock cadence, customer list size band, objection, next action, and consent basis. Never copy credentials or create an account the seller cannot control.

### Partner opener

> Hi [Name] — I’m building TradeFeed for Joburg fashion resellers who already sell on WhatsApp. We turn three current stock photos into a clean live catalogue and exact size/colour order messages while the seller keeps using WhatsApp. I’d like to run a free three-hour setup desk for your reseller customers at [location]. We do the setup, verify every listing, and share only real results. Could I show you the five-minute demo on [day/time]?

### Seller face-to-face opener

> You already sell on WhatsApp, so I’m not asking you to change that. Give me one current product photo, price, size and colour. In five minutes I’ll show you the live link and the exact order message your customer sends. If it is not clearer than your current process, we stop.

### Permissioned WhatsApp follow-up

> Hi [Name], it’s [Founder] from [partner/location], following up with your permission. TradeFeed gives your current stock one reusable catalogue link and sends exact product/size/colour orders into your WhatsApp. Setup is free. Please bring three current product photos and prices. I can help at [specific slot]. Reply YES for the slot or STOP and I will not message again.

### Seller-to-customer share

> Hi [Customer name] — I’ve put my current [shoes/clothing] stock into one catalogue so prices, sizes and colours are easier to check: [tracked catalog link]. Please open any two items you like and send the product enquiry from the page so I know exactly which option you mean. This is my business link; no payment is required to browse.

Use only with an existing customer relationship or valid opt-in. Personalize the stock/category and do not repeatedly message non-responders.

### Referral ask

> Who are two other Joburg fashion sellers who currently answer product, size or price questions in WhatsApp all day? Please introduce us in one message. If they publish three valid products, share their catalogue, and receive a genuine buyer response, your account receives [approved value reward]. We do not reward empty registrations.

### Incomplete-activation interview

> I’m not calling to sell you again. You started setting up TradeFeed but did not reach a shared three-product catalogue. What stopped you at that exact point? What did you expect to happen next? What would make the setup worth finishing this week?

### Buyer confirmation prompt

> TradeFeed check: was the enquiry from [catalog/product reference] a genuine customer request you would respond to? Reply 1 = genuine, 2 = seller/test, 3 = spam/invalid. Do not send the customer’s private details.

## Content calendar

Every item has one measurable job and one CTA. Use real sellers only with permission; label demonstrations.

| Day | Content | CTA / measured event |
|---|---|---|
| 1 | 30-second “photo to exact WhatsApp order” screen recording | Book a setup slot |
| 2 | Three listing mistakes that create repetitive DMs | Bring 3 photos to setup |
| 3 | Real seller setup time-lapse and final catalog | Partner setup date |
| 4 | Size/colour order comparison: free-text vs structured | Start assisted setup |
| 5 | Seller proof: listings, visits, genuine enquiries, no invented sales | Referral introduction |
| 6 | How to share a catalog in Status without spamming | Share tracked catalog |
| 7 | Week-one transparent results and lessons | Join next setup block |
| 8 | Stock-drop template for sneaker sellers | Publish 3 current items |
| 9 | Trust checklist: location, fulfillment, returns, response | Complete profile |
| 10 | Buyer view: how to check seller details and variants | Browse curated collection |
| 11 | Behind the scenes at a partner stock point | Book partner setup |
| 12 | One-question seller objection video | Reply with objection |
| 13 | Real catalog teardown with consent | Request teardown |
| 14 | Two-week cohort results | Join next cohort |
| 15 | Before/after product photo and description | Try one listing |
| 16 | How sellers update sold-out stock | Update inventory |
| 17 | Buyer FAQ: payment, collection, and seller responsibility | Browse current stock |
| 18 | Partner profile | Attend setup day |
| 19 | Seller response-time proof | Enquire on specific item |
| 20 | Common WhatsApp order ambiguity | Use structured order |
| 21 | Three-week results and constraint | Partner/referral CTA |
| 22 | New-stock Friday collection | Browse collection |
| 23 | Seller retention story | Refresh one product |
| 24 | Buyer request matched to sellers | Submit a request |
| 25 | Honest “what TradeFeed does not do” trust post | Qualified setup |
| 26 | Product-quality checklist | Fix three listings |
| 27 | Referral success story | Introduce two sellers |
| 28 | Live setup Q&A | Attend setup |
| 29 | Month-end stock collection | Browse/share |
| 30 | Results: activated roles, retention, orders, failures | Next cohort waitlist |

Primary formats: WhatsApp Status, Instagram/Facebook Reels, partner group posts with admin permission, and short TikTok demonstrations. Repurpose the same evidence rather than producing channel-specific filler. LinkedIn and YouTube are secondary founder/partner proof channels, not volume assumptions.

## Partnership target profile

Build a named list of at least 200 outreach candidates, prioritize the best 30, and close 20 live partner pilots from:

1. CBD/Fashion District wholesalers with repeat reseller foot traffic;
2. sneaker, streetwear, dress, and accessories stock rooms;
3. market organizers and seller collectives;
4. courier/collection points serving informal fashion sellers;
5. bookkeeping, packaging, photography, and small-business service providers with permissioned seller relationships;
6. community admins whose rules permit a setup event or educational demonstration.

The existing MEN’S CORNERS TradeFeed catalog is a useful anchor for an actual customer/partner conversation, not evidence that the entire cluster has converted: [catalog](https://tradefeed.co.za/catalog/man-corner).

A productive partner produces at least 20 qualified seller conversations, 8 completed registrations, 5 strict seller activations, and 15 confirmed buyers within seven days of its first setup block. Stop spending setup time on a partner that cannot reach half of that after two properly promoted sessions.

## Referral mechanism

Use the existing referral code/link path, but change the operating reward:

- reward only after the referred seller is strict-activated **and** has one seller-confirmed buyer interaction;
- cap rewards per referrer during the test;
- use account credit, listing support, photography, or a small approved cash/data reward;
- reject duplicate businesses, shared owners, fake orders, and self-referrals;
- report referral invitation, registration, strict activation, value activation, and reward separately.

The current production signal is zero referred shops. Referral is therefore an experiment, not an established engine.

## Retention system

### Seller

- immediately after product 3: preview, share, and run a test order;
- day 1: confirm first non-owner visitor and answer any listing issue;
- day 2: human follow-up if there is no share or buyer view;
- day 4: prompt one stock/price update;
- day 7: weekly stock-drop reminder and seller outcome review;
- weekly thereafter: low-stock/sold-out cleanup, new-stock prompt, response-time report, and one relevant buyer-request match;
- day 14 inactive: interview first, then send a specific repair action—not a generic “come back” blast.

### Buyer

- make the seller, product, option, price, location, fulfillment, and responsibility explicit before WhatsApp opens;
- preserve recently viewed and wishlist functionality only where it reduces repeat search;
- send restock or new-stock messages only after explicit opt-in;
- invite a second visit for relevant new stock, not a generic marketplace notification;
- ask confirmed buyers one short trust/relevance question within 48 hours.

TradeFeed should expect weekly seller usage in a fast-moving fashion niche. A buyer may be episodic, so seller-confirmed intent and a later return are more meaningful than forcing account creation.

## Technology audit

### Execution completed in the working tree

The following changes are implemented locally and verified, but **not deployed**:

- a stable random first-party visitor cookie, sanitized request context, bot filtering, owner exclusion for buyer views, and identity propagation into catalog, marketplace, WhatsApp, cart, checkout, wishlist, and restock behavior;
- activation page-view queries now exclude all legacy null-identity events;
- public order tracking no longer fetches or returns buyer identity, phone, note, or delivery-address PII;
- new order references use 80 bits of cryptographic entropy, and public tracking/payment routes are limited to 20 requests per minute per IP;
- checkout now validates active shop ID and slug, active product/variant tenant membership, server prices, retail/wholesale mode, MOQ/bulk tiers, fulfillment rates, COD eligibility, and wholesale-buyer eligibility;
- duplicate rows and stock requirements are aggregated, and conditional stock decrements plus order creation run in a serializable transaction;
- mobile sign-up/sign-in show the form first, anonymous create-shop redirects through sign-up, and the competing floating support control is removed from conversion/transaction surfaces;
- unsupported product-count, geographic-coverage, privacy, verification, delivery, and payment claims were removed or qualified;
- the duplicated marketplace title brand was corrected.

Verification:

- 318 automated tests passed, including 9 new analytics-identity tests and 5 new order-security policy tests;
- TypeScript completed with no errors;
- full ESLint completed with no errors;
- `git diff --check` found no whitespace errors;
- mobile browser checks at 390 × 844 found no horizontal overflow, sign-up inputs were visible in the first viewport, anonymous create-shop returned to sign-up, the marketplace support overlay was absent, and the marketplace title was no longer duplicated.

A production build was intentionally not run against the available production environment because the marketplace render path contains a write-side expiry action. The database integration suite was also skipped because its isolated `DATABASE_URL` was not set. Deployment must use a reviewed environment and post-deploy smoke/analytics/security checks.

### 1. Must fix immediately

1. **Public tracking privacy:** legacy order numbers used low entropy, and an unauthenticated order-number lookup returned buyer name, note, exact street address, city, province, and postcode. Remove personal/delivery detail from public tracking, generate cryptographically strong new order references, rate-limit the public capability routes, and later migrate to revocable bearer tracking tokens.
2. **Checkout authority and tenant isolation:** public input could supply variant IDs, shipping cost/method, and other values without sufficient authoritative shop/product binding. Validate active shop → active product → active variant on the server; derive prices, order type, shipping, and totals from server records; aggregate duplicate lines; reject invalid quantity/cross-shop data; and make stock check/decrement transactional.
3. **Activation identity:** persist a random first-party visitor ID; exclude owners and obvious bots; attach sanitized source/user-agent context; never derive an identity from IP.
4. **Dead-end onboarding:** redirect unauthenticated create-shop visitors through sign-up and return them to create-shop.
5. **Trust claims:** remove or qualify unsupported scale, privacy, coverage, verification, delivery, and payment statements.
6. **Mobile conversion:** show the auth form first, prevent header overflow, and remove a floating support control from transactional/catalog/marketplace surfaces where it blocks content or competes with the seller CTA.

Items 1-6 are now addressed in the local working tree to the extent possible without a database migration or deployment. They remain “must fix immediately” operationally until the release is reviewed, deployed, and verified in production.

### 2. Must complete during the 30-day sprint

- Store campaign source and partner/referrer cohort on registration and activation.
- Make shop-created, three-quality-products, catalog-shared, first non-owner two-product session, valid enquiry/order, seller confirmation, and retention queryable without spreadsheets.
- Link an order/enquiry to the anonymous visitor ID or signed-in buyer so buyer activation can be deduplicated.
- Give sellers a one-tap genuine/test/spam confirmation that does not disclose buyer PII.
- Make variant selection mandatory before all enquiry/order paths.
- Show seller-specific payment, delivery, collection, return, and verification facts.
- Create an activation operations queue: incomplete setup, no share, no buyer view, unconfirmed enquiry, slow response, and stale stock.
- Reduce marketplace/catalog payload and client work; production observations included roughly 366 KB homepage HTML, 454 KB marketplace HTML, multi-second total response/load paths, and an approximately 4-second product-detail ready state.
- Correct duplicated metadata branding and keep sitemap/category counts aligned with active indexable inventory.
- Create lifecycle messages that comply with WhatsApp template/session rules and buyer consent.
- Add security regression tests for public tracking, cross-tenant checkout, authoritative pricing, invalid quantity, duplicate lines, and stock contention.
- Add and backfill a unique 128-bit public tracking token, move public URLs to it, and invalidate enumerable legacy references.
- Add a unique checkout idempotency key so an ambiguous network retry cannot commit a duplicate order.
- Persist `OrderItem.orderType`; add database constraints for non-negative stock/prices/totals and positive quantities.
- Run a real Postgres concurrency test with two simultaneous checkouts.
- Verify production Upstash credentials and change distributed rate-limit failures from fail-open for sensitive public-order routes.
- Measure the cache/performance impact of request-aware catalog/product analytics; move view emission off the render path if the new dynamic behavior materially worsens buyer latency.

### 3. Can wait

- deeper buyer-account feed features;
- advanced seller analytics and recommendations;
- custom domains;
- team/staff depth;
- advanced promotions;
- AI listing refinements beyond the reliable first listing;
- pricing-plan redesign until activation and retention are proven.

### 4. Must not be built yet

- a native mobile app;
- an in-platform chat replacement for WhatsApp;
- TradeFeed-operated logistics;
- new payment rails;
- more geography/category expansion;
- a multi-seller cart;
- social-feed mechanics;
- predictive/AI features not directly improving three-product activation;
- large marketplace redesigns without measured buyer failure evidence.

## Analytics requirements

### Required event facts

Every behavioral event needs:

- stable anonymous `visitorId` or authenticated user ID;
- owner/staff/test/bot exclusion state;
- shop and product where applicable;
- source, campaign, partner/referral code, landing path, and sanitized referrer;
- server timestamp;
- event version;
- seller-confirmation state for buyer value events.

### Required funnel

`qualified prospect → registration attempt → registration complete → shop complete → quality product 1 → quality product 3 → catalog share → first non-owner two-product session → valid enquiry/order → seller-confirmed interaction → D7 retained → paid`

Report daily by source and cohort:

- qualified seller conversations and visitors;
- attempts and completed registrations;
- median minutes to product 1, product 3, share, first buyer view, and first confirmed interaction;
- strict seller activation count/rate;
- seller value activation count/rate;
- distinct qualified catalog visitors and two-product explorers;
- valid enquiries/orders and seller-confirmed buyer activations;
- owner/test/bot/duplicate rejection counts;
- D1/D7 seller and buyer retention;
- order confirmation, cancellation, delivery, response-time, and payment-complete counts;
- referral and partner yield;
- paid subscribers and collected revenue;
- spend and cost per strict seller / confirmed buyer.

No source row with a null identity, unknown owner state, or missing confirmation is allowed into the activated-user total.

## Budget allocation

The chosen plan requires an operating budget and a six-person temporary team, not just ad spend. Day rates below are planning ceilings; the human founder must ensure lawful contracts, tax, hours, safety, and fair compensation.

| Use | 30-day ceiling |
|---|---:|
| Four outbound operators: R450/day × 22 days | R39,600 |
| Two onboarding/activation concierges: R600/day × 22 days | R26,400 |
| Local travel, mobile data, setup operations | R6,000 |
| Partner performance pilots, QR cards, small venue costs | R6,000 |
| Interview/airtime incentives | R3,000 |
| Referral execution and seller collateral | R2,000 |
| Proof-content capture/editing | R2,000 |
| Conditional paid validation test | R4,000 |
| Contingency reserve | R10,000 |
| **Maximum** | **R99,000** |

The base operating commitment before paid test and reserve is R85,000. Spend no reward on registration alone. Release the R4,000 paid test only after:

- visitor/source measurement is verified;
- the landing-to-attempt rate is at least 20% for qualified traffic;
- attempt-to-completed-registration is at least 70%;
- the observed self-serve registration-to-strict-activation rate is at least 25%; and
- the seller-to-buyer warm-share loop is producing genuine confirmations.

Start Meta with R400/day for five days and one Joburg fashion-reseller offer. Continue the remaining budget only if cost per strict seller activation is within the field-assisted cohort’s fully loaded cost and lead quality is not worse.

## Experiment rules and contingencies

| Gate | Continue/scale | Modify or stop |
|---|---|---|
| Identity instrumentation | At least 95% of activation events have identity, source, and owner/bot state | If not live by day 2, make no activation claim |
| Personalized outreach after 200 deliveries | At least 15% two-way conversation | Below 10%: stop the list/copy and re-segment |
| Conversation → attempt after 50 conversations | At least 40% | Below 20%: repair offer/objection |
| Attempt → completed shop after 30 attempts | At least 75% | Below 60%: stop adding traffic and fix/assist onboarding |
| Registration → strict seller activation at D7 | At least 50% | Below 35% after 30 registrations: hold supply acquisition |
| Qualified buyer visit → confirmed activation | At least 5% after 1,000 visits | Below 3%: fix stock, trust, relevance, or enquiry |
| Partner close rate | At least 10% of pitches | Below 5% after 100 pitches: change the partner offer/channel |
| Partner traffic | At least 50 qualified visits/drop | Two drops below 20 visits: stop that partner |
| Referral invitation → strict seller | At least 1% | Below 0.5% after 300: change reward/prompt |
| New seller D7 buyer value | Median at least 2 confirmed buyers, moving to 3 | Below 1: stop seller scaling and concentrate demand |
| Manual request fill | At least 70% receive 3 credible options | Below 50%: niche supply is not liquid |
| Seller response | At least 80% valid enquiries acknowledged within two business hours | Restrict campaign inventory to responsive sellers |
| D7 seller retention | At least 35% minimum; target 50% | Below 35%: do not scale paid acquisition |
| Operational quality | Founder help under 20 minutes/seller; fraud/test/duplicate below 10% | Repair operations before adding volume |
| Trust and safety | No open material incident | Pause acquisition |

### Modify

- good registration but poor product-3 completion: keep the niche/channel, redesign assisted listing and product-quality steps;
- good seller activation but fewer than 2 median confirmed buyers: stop scaling supply, change stock relevance/share script, and run buyer interviews/matching;
- good buyer interest but slow seller response: restrict campaign inventory to responsive sellers and institute response checks;
- partner volume but poor qualification: change partner and prospect criteria, not the product roadmap;
- high assisted but low self-serve conversion: keep field motion while using observed sessions to repair one bottleneck at a time.

### Stop/reset

Reset the channel/positioning if either condition occurs:

1. the first 100 qualified merchant conversations produce fewer than 20 strict seller activations; or
2. the first 50 strict sellers fail to produce a median of 3 confirmed buyer activations within 7 days of their share.

Pause acquisition immediately for any material PII leak, cross-tenant checkout, price manipulation, stock corruption, fake seller/review signal, or repeated unsolicited-marketing complaint.

### Missed-target contingency

- **Below 110 cumulative activations on day 7:** do not buy ads; run 20 more observed setups at the best-performing location and repair the largest single loss.
- **Below 315 on day 14:** narrow further to the highest-converting fashion subcategory/stock point, cut unproductive partners, and reforecast. Below 158 means the 1,000 target is no longer credible.
- **Below 610 on day 21:** stop pretending the month-end target is credible; optimize for a clean retained cohort and documented economics rather than low-quality registrations.
- **At 1,000 but D7 seller retention below 35% or buyer confirmations are weak:** do not call it product-market fit or scale paid acquisition.

## My Required Actions

These are the actions that require the legal/business owner, money, physical presence, or external communication.

1. **By 17:00 SAST on 24 July:** approve or reject the R99,000 maximum / R85,000 base operating budget and a temporary team of four outbound operators plus two onboarding/activation concierges. If this capacity is unavailable, reset the 30-day forecast to roughly 400-600 total activations and preserve the same quality rules.
2. **By 12:00 SAST on 25 July:** provide a sheet of the first 30 prioritized partner prospects, from a 200-prospect working list, with contact, location, relationship/permission basis, expected reseller traffic, and available setup dates.
3. **By 26 July:** book two three-hour Joburg setup sessions and personally attend the first.
4. **During days 1-7:** ensure the team completes 1,500 permission-compliant personalized seller contacts, 225 two-way conversations, and 80 partner pitches using the script and qualification rules.
5. **During days 2-7:** obtain permission from each activated seller for tracked Status/group/customer distribution; ensure sellers send from their own business accounts and report gross reach separately from unique visitors.
6. **By day 7:** conduct or review 10 recorded-notes seller interviews and 5 buyer interviews; provide verbatim objections and abandonment reasons, with PII removed.
7. **Before deployment:** supply the requested consolidated evidence package and production owner approval for the security/instrumentation release. Do not send passwords, API keys, tokens, private keys, or full customer PII in chat.
8. **Daily by 18:00 SAST:** return the exact metric block below. Do not substitute reach, raw events, or registrations for activation.

## Metrics

Copy and fill this daily:

```text
Date / acquisition day:

SELLER FUNNEL
Personalized new-seller deliveries:
Referral invitations:
Qualified seller conversations:
Qualified seller website visits:
Registration attempts:
Completed registrations:
Shops completing required profile/location:
Shops with 3 valid in-stock quality products:
Tracked catalog shares:
Shops receiving a distinct non-owner 2+ product session:
Strict seller activations:
Seller value activations:
Median minutes: registration → product 1 / product 3 / share / first buyer:

BUYER FUNNEL
Seller/partner catalog placements:
Gross buyer-facing impressions (not users):
Distinct qualified catalog visitors:
Distinct 2+ product explorers:
Valid WhatsApp enquiries/orders:
Seller-confirmed genuine interactions:
Rejected owner/test/bot/duplicate interactions:
Confirmed buyer activations:

RETENTION / COMMERCE
D1 retained sellers / eligible:
D7 retained sellers / eligible:
D7 retained buyers / eligible:
Pending / confirmed / shipped / delivered / cancelled orders:
Median seller response time:
Payment-complete orders:
New paying sellers / total paying sellers:
Collected revenue:

CHANNEL / OPERATIONS
Partner asks / meetings / booked sessions / productive sessions:
Activations by partner, field, referral, community, organic, paid:
Seller interviews / buyer interviews:
Top verbatim objection:
Spend today / cumulative spend:
Privacy, trust, fraud, stock, payment, or support incidents:
```

## Decision Trigger

The next founder decision is not “what feature should we build?” It is:

> Can one concentrated Joburg fashion-reseller acquisition cell repeatedly turn 100 qualified seller conversations into at least 20 strict sellers, and can the median strict seller create three seller-confirmed buyers within seven days?

If yes, add partner locations and rep capacity while protecting quality. If seller conversion fails, change the offer/channel based on observed sessions. If buyer conversion fails, stop adding supply and fix stock relevance, trust, sharing, response time, and manual matching. If safety or privacy fails, pause growth until it is corrected.
