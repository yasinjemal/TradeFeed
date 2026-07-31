# TradeFeed HUNT

> **Screenshot it. South Africa finds it.**

This is the canonical product and delivery document for TradeFeed HUNT. Every
HUNT change must update the checkpoint, checklist, decisions, or progress log
in this file in the same change.

## Current checkpoint

| Field | Value |
|---|---|
| Last updated | 2026-07-31 |
| Product stage | Stage 0 — concierge pilot |
| Build status | Visible public Beta live; first-submission resilience fix deployed |
| Pilot wedge | Fashion and sneakers in Johannesburg |
| Public launch | Limited Beta discovery approved; broad campaign not yet approved |
| Current engineering goal | Verify the first real HUNT submission and complete the concierge loop |
| Biggest unproven risk | Relevant sellers responding quickly with credible stock |
| Next gate | Recruit opted-in sellers and complete five internal end-to-end Hunts |

## North-star goal

Make TradeFeed the place where a South African buyer can show the marketplace
something that is not listed yet and receive a credible, local offer from a
real seller.

The product promise is:

> **Show TradeFeed anything. The marketplace forms around your request.**

The first commercial proof is not traffic or registrations. It is a completed
loop:

```text
Screenshot
→ structured request
→ relevant seller response
→ current stock evidence
→ buyer chooses
→ organised WhatsApp order
→ fulfilled purchase
```

## Why this can win

HUNT combines a set of behaviours that usually live in separate products:

- visual product discovery;
- buyer-led requests instead of seller-led listings;
- local seller routing;
- buyers joining the same demand;
- fresh stock evidence;
- seller-committed quantity pricing; and
- WhatsApp fulfilment.

The interface and the AI model are not the long-term moat. The moat is the
local demand-and-fulfilment graph: what buyers want, what alternatives they
accept, which sellers have hidden inventory, who responds accurately, real
accepted prices, and who fulfils reliably.

## Product principles

1. **Reality is the spectacle.** Never show invented sellers, offers, response
   times, buyer counts, price drops, or proof.
2. **No result becomes a Hunt.** A failed marketplace search should create
   demand instead of losing the visitor.
3. **Sharing must improve the outcome.** It should help aggregate real demand
   or reach a seller-committed quantity tier.
4. **Private by default.** Buyer phone numbers, raw notes, and identity must
   never appear on public Hunt pages.
5. **Evidence, not guarantees.** Proof of Now can show recent possession and
   visual similarity; it cannot guarantee authenticity.
6. **Human confirmation before purchase.** AI may extract and rank, but a
   buyer chooses the seller and confirms the WhatsApp order.
7. **One dense market first.** Liquidity in one category and city matters more
   than shallow national coverage.

## Stage plan

### Stage 0 — Concierge validation

Goal: prove that buyers will submit requests and relevant sellers will answer.

- [x] Define the flagship concept and positioning.
- [x] Choose the first market: Johannesburg fashion and sneakers.
- [x] Define truth, privacy, moderation, and seller opt-in rules.
- [x] Build screenshot-based Hunt creation.
- [x] Build a durable public Hunt room.
- [x] Let another buyer join a Hunt without exposing their number.
- [x] Apply the HUNT database migration and deploy the hidden pilot.
- [x] Add a private operations view for the TradeFeed team.
- [x] Let the team manually route a Hunt to selected opted-in sellers.
- [x] Let the team enter a genuine seller offer.
- [x] Hand the chosen offer into the existing WhatsApp order flow.
- [ ] Recruit 20–30 responsive pilot sellers.
- [ ] Complete 20 concierge Hunts.
- [ ] Complete 100 valid Hunts before funding the remarkable version.

Out of scope in Stage 0:

- automated seller broadcasts;
- public competitive bidding or auctions;
- AI authenticity guarantees;
- automated purchasing;
- synthetic product photos;
- fake group-price demonstrations;
- 3D, AR, or virtual try-on; and
- TikTok or Facebook scraping.

### Stage 1 — Real marketplace MVP

Goal: automate the repeated work that the concierge pilot proves valuable.

- [ ] Structured image and request extraction.
- [ ] Existing-catalogue matching.
- [x] Seller opt-in and category/location preferences.
- [ ] Relevance-based seller routing with notification limits.
- [ ] Seller response link for price, variants, quantity, and delivery.
- [x] Live offer updates.
- [x] Exact, Similar, and Uncertain match labels.
- [x] Offer selection and WhatsApp checkout handoff.
- [x] Hunt expiry, buyer closing, abuse reporting, and takedown tools.
- [ ] Successful-result share card.
- [x] Real persisted funnel events from creation through confirmed fulfilment.

### Stage 2 — Proof of Now

Goal: make current physical stock visible and defensible.

- [ ] Dynamic capture instruction or code.
- [ ] In-flow five-second proof recording.
- [ ] Recent-capture and reused-media checks.
- [ ] Visual similarity assessment.
- [ ] Proof review state and expiry.
- [ ] Clear evidence disclaimer.
- [ ] Proof video inside offer cards and result reels.

### Stage 3 — Viral demand network

Goal: make every successful Hunt generate the next one.

- [ ] Seller-committed quantity price tiers.
- [ ] Verified reservations before a tier unlocks.
- [ ] Similar-Hunt demand merging.
- [ ] Trending and time-boxed Hunt feed.
- [ ] Downloadable vertical “Found it” result videos.
- [ ] `Hunt this too` remixes.
- [ ] PWA image share target.
- [ ] Category-and-city expansion only after liquidity gates pass.

## Pilot funnel and success gates

Every stage must measure the complete funnel:

```text
Hunt started
→ public Hunt shared
→ external visitor
→ visitor joined
→ seller routed
→ first credible offer
→ offer chosen
→ WhatsApp order
→ fulfilment confirmed
```

Go forward after 100 valid Hunts only if the pilot approaches:

| Metric | Gate |
|---|---:|
| Hunts receiving a credible offer within 30 minutes | 60%+ |
| Median time to first relevant offer | Under 15 minutes |
| Hunt starters who share | 30%+ |
| External visitors per shared Hunt | 1.0+ |
| Hunt visitors who join | 15%+ |
| Valid Hunts producing an order | 10%+ |
| Seller opt-out and bait-and-switch | Very low |

These are decision gates, not marketing claims.

## First vertical slice

The current build must make this true:

> A buyer uploads a product screenshot, adds a city, budget, variant and private
> WhatsApp number, receives a shareable Hunt link, and another buyer can join
> that Hunt. The public page contains only real persisted data.

### Required states

```text
empty
→ image selected
→ uploading
→ safety check
→ reading request
→ Hunt created
→ searching
→ joined
```

### Required public information

- reference image after explicit public-display consent;
- AI-assisted, editable-safe title and summary;
- city or area;
- maximum budget;
- requested variant;
- truthful Hunt status;
- real participant count;
- real creation and expiry times; and
- honest empty-offer state.

### Information that must remain private

- buyer and participant WhatsApp numbers;
- raw request text that may contain personal information;
- feature/session identifiers;
- seller name, logo, contact details, and proof media before a buyer chooses
  an offer during Beta;
- internal routing and moderation notes; and
- precise buyer location.

## Safety and legal gates

- [x] POPIA retention and deletion periods documented.
- [x] Explicit consent to display the uploaded reference publicly.
- [x] Separate consent for Hunt-related WhatsApp updates.
- [x] No unrelated marketing consent bundled into the Hunt flow.
- [ ] Faces, usernames, and unrelated personal details can be reviewed or
      blurred before broad public promotion.
- [x] Prohibited-content and unsafe-image moderation before publication.
- [x] Counterfeit and rights-holder report/takedown process.
- [x] Seller notifications only for opted-in, relevant sellers.
- [ ] No public auction mechanics without South African legal review.
- [ ] Quantity prices shown only when committed by the seller.
- [ ] Proof of Now remains disabled until dedicated consent, sanitization,
      owned-key storage, and deletion controls exist; when enabled, it must be
      described as evidence of recent possession, never authenticity.
- [x] Active and empty Hunts remain `noindex`; only legitimate solved Hunts may
      become indexable.

## Launch readiness gates

HUNT may be linked as a clearly labelled, no-guarantee Beta so real demand can
be measured. Do not run a broad `#CanTradeFeedFindIt` campaign until all of
these are true:

- [ ] At least 20 opted-in pilot sellers are ready.
- [ ] A TradeFeed operator is assigned during published service hours.
- [x] Moderation and takedown paths work.
- [x] Empty Hunts do not imply that sellers were contacted when they were not.
- [ ] At least five end-to-end internal Hunts have been completed.
- [x] Persisted events distinguish creations, shares, joins, seller routes,
      credible offers, selections, WhatsApp handoffs, and confirmed
      fulfilment.
- [ ] The first public campaign uses real elapsed time or a clearly labelled
      time-lapse.

## Technical direction

TradeFeed already provides the foundations: Next.js, Prisma/PostgreSQL, Clerk,
UploadThing, OpenAI image understanding, product variants, seller locations,
verification, carts, orders, and WhatsApp handoff.

New HUNT capabilities should remain separated by responsibility:

```text
app/hunt/*                 public entry and Hunt rooms
components/hunt/*          creation, room, join, share, and offer UI
app/actions/hunts.ts       validated public mutations
lib/ai/hunt-*              moderation and request extraction
lib/db/hunts.ts            public-safe and private operations queries
lib/validation/hunt.ts     shared input boundaries
prisma/schema.prisma       durable Hunt records
```

Public queries must use explicit selects that cannot return private contact
fields.

## Decision log

| Date | Decision | Reason |
|---|---|---|
| 2026-07-30 | HUNT is the visitor-growth flagship; ShopTwin remains a later seller inventory tool. | HUNT creates an acquisition and sharing loop, while ShopTwin mainly improves seller setup and browsing. |
| 2026-07-30 | Start with a concierge pilot, not full automation. | Seller liquidity and response quality are the hardest risks; code cannot manufacture them. |
| 2026-07-30 | Use screenshot/photo input, not social-platform scraping. | It is more robust, privacy-aware, and compatible with a future PWA share target. |
| 2026-07-30 | Active Hunts are not search-indexed. | Empty or user-generated requests would create thin content and SEO/moderation risk. |
| 2026-07-30 | Buyer contact data is structurally separated from public Hunt data. | This lowers the chance of accidental POPIA exposure. |
| 2026-07-30 | “Offers,” not “auctions.” | Public competitive bidding introduces avoidable legal and trust risk. |
| 2026-07-30 | No global navigation link during the internal pilot. | A live feature requires seller coverage and an operating response process. |
| 2026-07-31 | Add a visible `HUNT Beta` entry while withholding the broad social campaign. | The operations, moderation and genuine-offer loop now exist; limited discovery can validate buyer demand without pretending seller liquidity is proven. |
| 2026-07-31 | Keep paid HUNT creation fail-closed on a privacy-safe PostgreSQL limiter. | Production must remain usable without an optional Redis provider while still bounding AI and storage work before it begins. |

## Open decisions

- [ ] Exact Johannesburg pilot service hours.
- [ ] Named operator and backup operator.
- [ ] Seller response SLA and notification cap.
- [ ] Reference-image retention period for abandoned and expired Hunts.
- [ ] Whether joined buyers need verified WhatsApp OTP before counting toward a
      future quantity tier.
- [ ] Refundable reservation mechanism for genuine group-price unlocks.
- [ ] Categories prohibited from HUNT even if they are otherwise legal to sell.

## Progress log

### 2026-07-30 — Product workstream opened

- Promoted HUNT from concept to an explicit staged product bet.
- Defined the north-star outcome, pilot wedge, go/no-go metrics, truth rules,
  privacy boundaries, and launch gates.
- Chose the first engineering checkpoint: durable creation plus a public room
  and real join flow.
- Started implementation of that first vertical slice.

### 2026-07-30 — First buyer vertical slice implemented

- Added durable `Hunt`, private requester, and anonymous participant records
  with a reviewable Prisma migration.
- Added a `/hunt` buyer entry page for the Johannesburg fashion pilot.
- Re-encodes screenshots in the browser to strip file metadata and remain under
  the server-action request limit.
- Validates real JPG, PNG, and WebP file signatures before any provider call.
- Applies multimodal moderation and product/privacy extraction before storage.
- Rejects images with visible faces, usernames, messages, addresses, or other
  personal information instead of publishing them automatically.
- Keeps the buyer's WhatsApp number and raw matching note in a structurally
  separate private record.
- Added `/hunt/[slug]` with real persisted request data, real participant
  counts, idempotent joining, native sharing, WhatsApp sharing, and a truthful
  no-offer state.
- Added explicit Hunt-only contact consent, public-image consent, and pilot
  terms acknowledgement.
- Added action-scoped abuse limits and non-enumerable public Hunt slugs.
- Active Hunts are `noindex`; a Hunt can become indexable only after it is
  found and separately SEO-approved.
- Added seven focused HUNT tests. The complete test suite and production build
  pass.
- Kept HUNT out of the main TradeFeed navigation until seller coverage and
  concierge operations are ready.

Production runtime requirements:

- The migration in
  `prisma/migrations/20260730120000_add_hunt_concierge_mvp/migration.sql` is
  applied and recorded in the production Prisma migration ledger.
- Production creation also requires working OpenAI, UploadThing, database, and
  rate-limit configuration. Missing image moderation fails closed; it never
  returns a fake Hunt.

### 2026-07-30 — Local verification checkpoint passed

- Focused ESLint passes for every new or HUNT-touched TypeScript file.
- TypeScript passes with `npx tsc --noEmit`.
- Prisma validates the additive schema and migration.
- All seven focused HUNT tests pass.
- The complete repository suite passes: 433 tests, 0 failures.
- The production build passes and includes `/hunt` and `/hunt/[slug]` among
  its 124 generated routes.
- A generated launch-card draft was deliberately not shipped: the first
  export contained recognisable brand-like artwork and the clean retry saved
  incorrectly. The existing code-generated Open Graph card remains in use
  until a publish-safe asset passes disk-level visual inspection.
- No migration, deployment, navigation promotion, or seller alert was
  performed as part of this local checkpoint.

### 2026-07-31 — Hidden production pilot verified

- Applied only the additive HUNT migration to the production Neon database,
  verified its tables, columns, indexes, constraints, and enum values, and
  recorded it in the Prisma migration ledger.
- Confirmed `https://tradefeed.co.za/hunt` serves the complete buyer-entry
  experience in production.
- Completed a controlled real create flow using an unbranded test image,
  consented test details, live AI safety/extraction, UploadThing media, and
  persisted production records.
- Confirmed the public room exposes no private requester fields, uses clean
  canonical metadata, remains `noindex`, and serves the uploaded image.
- Joined the Hunt twice with the same anonymous participant and confirmed the
  count increased once, proving the join mutation is idempotent.
- Confirmed the UI showed the real count and an honest no-offer state; no
  seller, response time, discount, or offer was fabricated.
- Rejected and deleted the controlled Hunt, its private and participant
  records, and its uploaded image. Production contains no smoke-test residue.
- Added isolated PostgreSQL services and schema synchronisation to both CI
  jobs so tests no longer depend on an unavailable localhost database.
- Kept HUNT hidden from global navigation and marketing. The buyer vertical
  slice is ready for controlled internal production testing, not a real-user
  pilot or public promotion.
- A real-user pilot remains blocked on the operations queue, seller offer and
  order handoff, retention cleanup, HUNT privacy disclosures, and takedown
  tooling.

### 2026-07-31 — Public-beta operating loop implemented

- Added high-contrast `HUNT Beta` entry points to both homepage designs, mobile
  navigation, the marketplace search bar, footers, and zero-result searches.
- A failed marketplace search now becomes a pre-filled Hunt instead of a dead
  end.
- Added an admin-only concierge queue with requester details kept off every
  public query.
- Added explicit seller opt-in with city/category scope, anonymized-offer
  publication consent, manual routing, and a pre-filled WhatsApp message.
  TradeFeed does not auto-broadcast to sellers.
- Added operator-published genuine offers. Public selects structurally omit
  seller name, logo, shop slug, WhatsApp number, private retention fields, and
  proof media; the owner-only handoff resolves the real seller privately.
- Added Exact, Similar, and Uncertain labels, current-stock confirmation,
  owner-only offer selection, and a structured WhatsApp confirmation handoff.
- Public proof media is deliberately disabled for Beta until TradeFeed has a
  dedicated sanitized upload, seller-publication consent, key ownership, and
  deletion lifecycle. Privately supplied proof is for concierge review only.
- Rebuilds every public buyer reference image server-side as a bounded WebP
  before AI review and upload, stripping EXIF/XMP, GPS, device data, embedded
  thumbnails, and unsupported payloads.
- Added buyer closing, abuse/rights/privacy reporting, admin takedown, audit
  logging, fulfilment confirmation, funnel events, and scheduled 180-day
  deletion of Hunt records and reference media.
- Updated the HUNT terms and privacy disclosures. The Beta continues to promise
  no guaranteed offer, no auction, and no authenticity guarantee.
- Verified the complete 439-test repository suite, focused lint, TypeScript,
  Prisma validation, and the 124-route production build.
- Applied only
  `prisma/migrations/20260731120000_add_hunt_public_beta_operations/migration.sql`
  to the production Neon database through a verified temporary branch, then
  confirmed the migration ledger and operational tables on production.

### 2026-07-31 — First-submission production incident diagnosed

- Confirmed that production contained zero Hunts: the first real buyer had not
  consumed a phone, browser, or database quota.
- Found that HUNT creation had been made dependent on Upstash while the linked
  production environment did not contain Upstash credentials. The fail-closed
  infrastructure result was incorrectly displayed as a genuine device quota.
- Replaced the single-provider creation gate with a fail-closed PostgreSQL
  limiter: six attempts per pseudonymous browser and thirty per pseudonymous
  network each hour. Only server-keyed HMAC digests are stored; raw browser and
  network identifiers are never persisted.
- Unknown or malformed network values no longer share one global `unknown`
  bucket. A valid browser identity remains required and rate-limited.
- Cheap field, phone, file-signature, and safe-image checks now run before an
  attempt consumes the paid AI/storage quota.
- Added a separate three-successful-Hunts-per-day browser limit alongside the
  existing atomic WhatsApp-number limit.
- Added retention cleanup for expired rate-limit buckets and updated the HUNT
  privacy disclosure.
- Fixed the missing request nonce on the theme bootstrap and root JSON-LD
  scripts, removing the CSP violation visible during the first production try.

## Next three build moves

1. Recruit 20–30 responsive Johannesburg fashion and sneaker sellers and
   record their explicit routing preferences.
2. Assign the operator schedule and complete five internal end-to-end Hunts.
3. Complete 20 concierge Hunts, compare response and conversion metrics with
   the gates above, then decide whether to automate seller responses.
