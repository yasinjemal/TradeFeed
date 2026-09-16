# TradeFeed marketplace quality audit

Audit date: 16 September 2026. Code reference: main commit `47cc159` plus a read-only inspection of the working tree. Unrelated uncommitted changes were not treated as deployed fixes.

## Recommendation

Build a curated South African marketplace with reliable seller operations and helpful WhatsApp communication. Give buyers the confidence of a mature retailer through accurate product information, clear prices, fulfilment commitments, dependable order states and a visible resolution process. A premium visual system should express those capabilities.

TradeFeed currently combines a seller acquisition website, independent shop catalogues, a marketplace, wholesale workflows and partially integrated commerce. The largest problem is inconsistency between those experiences. More features will amplify that inconsistency unless the core journey is made dependable first.

Retain the working foundations. Do not undertake a wholesale rewrite or promise Amazon-scale logistics before the supporting operations exist. Deliver one coherent buyer journey and one simple seller journey, then expand.

## Scope and evidence

- Live inspection: homepage, marketplace, search, filter controls, a featured storefront, a product page, variant selection, add/remove local cart, cart summary, registration and support.
- Product layout checked at a verified 390 x 844 viewport, alongside larger layouts. Sampled layouts only; not a full device/accessibility certification.
- Source inspection: orders, inventory, review lookup/moderation, shipping estimates, payment presentation, product discovery/ranking, registration, onboarding, feature flags, CI and synthetic-monitor definitions.
- Production database aggregate queries executed in a read-only transaction. No personal customer records exported.
- No orders, payments, seller accounts, reviews or outbound messages created. The temporary cart item was removed.
- No authenticated seller/admin walkthrough in this audit. The admin observations from this task's earlier screenshots are separate evidence. Seller onboarding beyond registration was reviewed in source, not completed live.
- Not a penetration test, load test, accessibility conformance assessment or legal review. Real-user Core Web Vitals, provider settlement, courier booking, backup restoration and current hosted monitor status remain to be verified.

## Current operational snapshot

These are database states at inspection, not audited commercial results. External WhatsApp/EFT transactions may be absent, and test/internal activity was not classified.

| Measure | Observed |
| --- | ---: |
| Enabled shops | 110 |
| Enabled shops without an active product | 42 (38%) |
| Enabled shops marked verified | 7 |
| Enabled shops without a saved return policy | 109 |
| Active products in enabled shops | 266 |
| Those products without a description | 55 (21%) |
| Orders in the database | 71 |
| Pending / confirmed / shipped / delivered / cancelled | 33 / 12 / 2 / 19 / 5 |
| Pending orders older than seven days | 33 |
| Orders created in the preceding seven days | 0 |
| Orders with a recorded paid timestamp | 4 |
| Reviews / reviews marked verified purchase | 12 / 0 |

The public homepage displayed 267 listed products during the audit. Its cached aggregate need not match the narrower active-product query above. Do not present either as a completed-sale count. Zero recorded new orders also does not establish zero off-platform business.

The health endpoint returned HTTP 200 with database status `connected`. Its reported database latency was 768 ms in that one request; this is not a performance percentile or page-speed score.

## Findings requiring attention before growth

### P0 — Inventory is reduced at order creation but not restored by the inspected cancellation path

Evidence: `lib/db/orders.ts:372` conditionally decrements stock inside order creation. `lib/db/orders.ts:525` changes order status without an inventory adjustment. `app/actions/orders.ts` permits cancellation from pending and confirmed states and calls that helper. No order-reservation expiry worker was found in the cron routes inspected.

Consequence: an abandoned WhatsApp handoff or a cancelled order can leave stock unavailable. The 33 older pending orders make reconciliation urgent, but do not prove how much current stock is affected.

Required change: explicit stock reservations, expiry, once-only release on cancellation, paid-order reconciliation, and atomic guarded status transitions. Do not blindly add historical quantities back: reconcile inventory with sellers and payment state first.

Acceptance: concurrent orders cannot oversell; repeated cancellation cannot restore twice; abandoned reservations expire; late payment cannot revive an invalid reservation without reconciliation; notifications follow the committed transition.

### P0 — Payment and delivery promises disagree across the journey

Live evidence: the Sneakers product page says to arrange payment with the seller; its cart and the featured shop display “PayFast secure payments.” The cart says nothing is paid until buyer and seller agree. Support says PayFast handles subscriptions and TradeFeed does not handle buyer payments. Source includes a buyer PayFast payment path and defaults the cart payment method to PAYFAST.

The terms' service description also says TradeFeed does not process orders, despite the application recording orders. This is a product-description mismatch; policy changes require review against the actual business model.

Shipping evidence: `lib/shipping/rates.ts` contains estimated carrier rate tables, not live quotes. The cart can submit the selected estimate as PLATFORM_COURIER and order creation includes its cost. Actual booking, parcel assumptions and carrier reconciliation were not validated.

Required change: one authoritative capability model per shop/order. Distinguish seller-arranged payment from integrated payment. Show carrier estimates as estimates unless there is a supported fulfilment process. Show who collects money, who delivers, what shipping costs and who resolves problems before commitment.

Acceptance: product, cart, payment page, confirmation, tracking, help and policies describe the same transaction. No unverified guarantees. Payment cancellation/failure, duplicate webhook and delayed callback scenarios pass in a sandbox.

### P1 — Product slug URLs lose reviews and sales counts

Live evidence: Sneakers had 5.0 (1) on a marketplace card but no reviews on its product page.

Root cause: `app/catalog/[slug]/products/[productId]/page.tsx:167` passes the route parameter to `getProductReviews`, `getReviewAggregation` and `getProductSoldCount`. The route parameter may be a slug; the page has already resolved the actual product as `product.id`.

Required change: use the resolved product ID for all related lookups. Review both old ID links and canonical slug links, structured metadata, and invalidation after review changes.

Acceptance: both URL forms show identical review totals and legitimate sales evidence. A real new review appears on the card, product and shop consistently.

### P1 — Reviews and success badges need stronger evidence rules

Evidence: `lib/db/reviews.ts:53` auto-approves submitted reviews. `app/actions/reviews.ts:106` authorises sellers with moderation permission to delete shop reviews. All 12 current review records are unverified. This is not evidence those reviews are fake; it means the system has not matched them to a purchase.

Order-based evidence is also loose: `lib/db/orders.ts:623` and marketplace sold-count enrichment count all non-cancelled order quantities, including pending orders. Seller tier metrics also use total orders.

Required change: visibly distinguish product reviews, seller reviews and verified purchases; seller responses/reporting instead of unilateral deletion of valid criticism; platform moderation with an audit trail; define paid sales, fulfilled orders, pending requests and seller verification separately.

Acceptance: a pending WhatsApp request cannot inflate a completed-sales claim. A verified seller badge explains its scope and does not imply product authenticity or guaranteed delivery.

### P1 — Search and sorting do not yet deliver predictable discovery

Live evidence: searching “sneakers” returned relevant footwear, but also polo sets and T-shirts. The search does have full-text and fuzzy support; this is a relevance-quality issue, not missing search.

Source evidence: `lib/db/marketplace.ts` limits full-text candidates to `pageSize * 3`, performs database pagination and then re-sorts that page by relevance. Relevance sorting is applied whenever search hits exist, which can override an explicit price sort. Top-rated sorting also happens after pagination. This cannot guarantee catalogue-wide ordering.

Required change: apply the chosen ranking before pagination; stable tie-breakers; exact product/category matches ahead of incidental description mentions; correct filtered result counts; recovery for misspellings and no results. Preserve explicit buyer-selected sort order.

Acceptance: seeded tests with more than three pages prove ordering across page boundaries, combined filters, no duplicates and no hidden eligible matches. Evaluate a small set of real SA shopping queries, not just successful HTTP responses.

### P1 — Public listing quality is too uneven for a premium impression

Live examples: a product named only “Sneakers,” a description reading “orginal sneakers,” a price of R2,500.02, inconsistent photograph crops/backgrounds, and long repetitive titles starting “Stylish,” “Premium” or “Trendy.” The unusual price may be intentional; flag it for seller confirmation rather than automatically changing it.

Required change: a marketplace publication standard distinct from saving a draft. Require a useful image, accurate category, identifiable product, validated price and available variants. Guide sellers through materials/specifications they can verify, size guidance, condition, delivery and returns. AI should suggest copy and surface uncertainty, not invent authenticity, material or performance claims.

Acceptance: newly discoverable products pass the standard; existing sellers receive specific repair tasks and a grace period; image failure has a graceful fallback. Preserve private drafts and shareable shops while improving public discovery.

## Visual and interaction direction

The existing cream/emerald marketplace palette and product-first grid are useful foundations. The product layout already attempts a premium editorial style. The problem is cohesion and information hierarchy.

| Surface | Observed issue | Recommended direction |
| --- | --- | --- |
| Homepage | Seller/AI acquisition dominates; shopping is far below the opening section | Make Browse/Search obvious immediately. If the marketplace is the primary business, use a shopper-first home and move the seller pitch to a dedicated Sell page. |
| Global navigation | Homepage, marketplace and shop headers behave differently; HUNT is more prominent than basic buyer utilities in some places | One predictable commerce shell: search, categories, orders, help, account and cart. Keep seller entry visible but secondary to shopping. |
| Marketplace | Sparse featured-seller space above products; long horizontal category rail; sort hidden inside filters | Use curated relevant collections, a visible sort control and clear filter state. Do not pretend a category is deep when it contains one item. |
| Product page | Oversized editorial title, very heavy price, repeated verification/trust messaging | Make product, price, selected variant, availability, delivery and returns easy to scan together. Reserve large editorial typography for campaigns. |
| Mobile product | Truncated shop identity and two persistent bottom bars reduce useful space | Keep one compact purchase action region and simplify navigation priority. Test long names and large text at 360–430 px. |
| Registration | White text competes with a bright photograph; identity differs from the storefront | Consistent branding, stable contrast, short practical benefits, a clear return-to-shopping route. Keep the working authentication system. |
| Product content | Inconsistent crop, naming and descriptive detail | Standard image frames, predictable title length and structured facts. Use professional curation before adding decorative effects. |
| Support | Useful contact channels exist, but answers are largely seller/account focused | Add buyer-first paths: order not received, wrong item, damaged item, payment problem, return and seller not responding. |

Design specification: warm white surfaces, deep emerald for primary actions, dark neutral text, one functional type family and at most one restrained editorial family. Standardise spacing, field heights, button hierarchy, corner radii, image ratios and price formatting. Prefer calm feedback and useful empty states over decorative motion and badges.

Luxury here should mean clarity, strong photography, care and dependable service. Do not use expensive-looking decoration to imply protections the business does not provide.

## Seller activation and operations

The existing first-listing checklist and recently added assistance rules are good starting points. With 42 empty shops, prioritise a guided route to a sellable catalogue over extra dashboard features.

Suggested first-session path: business/contact details → first product photo → confirm title/price/stock/options → delivery/returns → preview as buyer → publish → share catalogue. Make progress and the next action explicit. Autosave drafts, explain upload errors, preserve entered data on failure, and keep advanced wholesale/AI/promotions options secondary.

In the inspected product order panel, the order type defaults to wholesale even when the buyer sees no wholesale choice. The cart labelled the single-item sneaker purchase “wholesale.” Simplify the retail default and expose wholesale only when it is meaningful.

The assistance panel is a support tool, not a substitute for fixing the confusing step. Keep its consent, suppression, review and frequency protections. Measure whether the suggested action was completed, not just whether an email was sent.

For admins, prioritise queues for stalled orders, failed payment callbacks, seller verification, poor listings, unresolved customer issues, delivery exceptions and failed notifications. Every queue needs an owner, next action, age and outcome. The existing activation panel's provider configuration detail is useful operationally, but most of it belongs in an admin settings/readiness area rather than competing with everyday tasks.

## Quality, security and delivery discipline

Positive foundations found: server-side price/stock validation, conditional stock decrements, scoped shop access, rate-limit infrastructure, privacy-limited public tracking projection, TypeScript/build checks, unit tests, and Checkly buyer/seller monitor definitions. The preceding fix's 523 passing local tests are useful evidence, not proof of a complete transaction lifecycle.

Gaps:

- Several `e2e/buyer-flow.spec.ts` checks conditionally do nothing if no matching product exists; one cart check asserts only that the body is visible. Use deterministic fixtures and fail if the critical journey cannot run.
- A Checkly buyer test expects a marketplace H1; none appeared in the marketplace accessibility snapshots. Verify this selector and the hosted monitor results before relying on the monitor.
- CI explicitly notes that legacy migration history cannot be replayed and uses `prisma db push` to construct test databases. Establish a production migration baseline, schema-drift checks and a tested restore procedure.
- Old and redesigned page implementations coexist behind feature flags. Confirm the production flag matrix and remove obsolete branches once migration is complete; duplicated flows invite inconsistent copy and behaviour.
- Some AI helpers return mock-looking content if the provider key is absent. Present an honest unavailable/manual-entry state in production instead of appearing to generate a completed listing.
- Complete a separate security review of tenant isolation, role permissions, upload ownership, private order access, payment signatures/replay handling and sensitive logs. No exploitation was attempted here.

Performance/accessibility release criteria: measure mobile and desktop field performance; target p75 LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1. These are targets, not measured TradeFeed results. Check keyboard flows, contrast, screen-reader labels, reduced motion, 200% zoom, image alt text and failed/slow network behaviour. Product image alt text currently includes uploaded filenames in inspected pages.

Reference: [Google's Core Web Vitals guidance](https://web.dev/articles/vitals).

## Sequence of work

1. **Commerce correctness and truthful presentation.** Fix canonical product lookups, payment/fulfilment wording, reservation/cancellation accounting, sales evidence, review governance and ranking order. Add regression tests for each failure.
2. **A coherent buyer experience.** Establish the shared design system and navigation. Redesign home/discovery, product and cart as one journey. Validate desktop and mobile with real catalogue content.
3. **Seller readiness and catalogue curation.** Repair the most useful existing shops, launch the guided activation flow, require meaningful fulfilment policies and offer targeted assistance. Start with the categories that have enough real supply.
4. **Dependable post-purchase service.** Introduce order-linked support cases and a clear returns/dispute process, then prove payment reconciliation and supported courier operations with controlled orders.
5. **Scale after the journey works.** Expand categories, automation, promotions and complex marketplace payment/fulfilment capabilities only after the operational measures improve.

These are release stages, not calendar guarantees. Each stage should have a reviewable scope, staging checks, a rollback path and production observation after rollout. Avoid a single large visual-and-commerce deployment on a site real businesses already use.

## Definition of a release worth trusting

- A new seller can publish three complete products, set fulfilment information and share the correct shop link without help.
- A buyer can find a relevant product, choose a valid variant, understand the full payment/delivery arrangement and complete the supported order path.
- Slug and ID links agree; cards, product pages, cart and tracking agree on prices and evidence.
- Order failure, duplicate requests, cancellation and late payment cannot corrupt inventory or payment state.
- A buyer with a problem has a visible support path and can see the case outcome.
- Each important automated test fails when its fixture or journey is unavailable.
- Operations can identify a failed checkout, payment callback, email, upload or stale order without waiting for a customer complaint.

Track activation-to-three-ready-products, first inquiry/order, completed/paid/fulfilled orders separately, checkout errors, cancellations, seller response time, unresolved-case age and repeat buyers. Keep organic customer activity separate from internal/test activity and synthetic monitoring.

## Benchmark interpretation

Use Amazon and Takealot as standards for clear commerce and service, rather than copying their entire feature set. For example, Takealot's help flow connects a wrong-item problem to an account-linked return process. TradeFeed needs a similarly understandable resolution path appropriate to its own responsibilities.

Reference: [Takealot's incorrect-item help flow](https://www.takealot.com/help-centre/delivery/what-should-i-do-if-i-received-an-incorrect-item-my-order).

The immediate objective should be a small marketplace where the core journey works consistently. That is a stronger basis for expansion than a broad catalogue wrapped in a more expensive-looking theme.
