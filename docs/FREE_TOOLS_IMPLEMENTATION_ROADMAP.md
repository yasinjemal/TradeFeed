# TradeFeed Free-Tools Implementation Roadmap

**Prepared:** 27 July 2026
**Horizon:** 30 days, followed by evidence-based adoption decisions
**Objective:** improve seller activation, production reliability, and research throughput without replacing TradeFeed's working core stack.

## Implementation status

The repository implementation is complete and has passed unit tests,
type-checking, lint, Prisma validation, and a production build. The remaining
work changes external provider or production state:

| Workstream | Repository status | External acceptance still required |
|---|---|---|
| Consent and measurement | Complete; analytics is explicit opt-in, Sentry Replay is fully disabled, request metadata is not persisted, and event ownership is documented | Apply the three migrations; disable GA4 Enhanced Measurement; inspect live GA4/Vercel/Sentry payloads before enabling the GA review flag |
| Better Stack | Five cron integrations, shared heartbeat adapter, health hardening, and runbook complete | Create five uptime monitors and five heartbeats, add server-only URLs, and prove controlled failure/recovery alerts |
| Checkly | API, production buyer, and staging seller checks complete as monitoring-as-code | Add Checkly credentials/account variables, provision the dedicated staging tenant, deploy, and complete the seven-day burn-in |
| Activation funnel | Signup cohorts, sequential milestone timing, source breakdown, paid reconciliation, and durable deduplication complete | Apply migrations and record the first seven-day baseline |
| Tally | Exactly three privacy-bounded form blueprints complete | Create and publish the forms in the selected Tally workspace, then start the weekly review routine |
| Geoapify | Server proxy, South African normalization, confirmation workflow, manual fallback, attribution, and public-location controls complete | Add the server key, apply migrations, validate the address sample, and run the two-week pilot |

## Executive decision

The original tool order should change after auditing the repository.

| Priority | Decision | Why |
|---|---|---|
| P0 | Fix consent and measurement ownership | GA4 currently loads before the cookie notice is acknowledged, and the notice has no reject or preference option. New analytics would compound this gap. |
| P0 | Adopt Better Stack uptime and heartbeat monitoring | TradeFeed already exposes `/api/health` and runs five Vercel crons, but it has no independent monitor proving they are healthy. |
| P0 | Adopt Checkly for a small set of scheduled journeys | Playwright already exists, but the current suite does not create a shop, publish a product, or edit a live catalogue as an authenticated seller. |
| P1 | Use Tally immediately for seller research | This produces learning without adding another permanent TradeFeed feature. |
| P1 | Improve the existing first-party funnel before adopting PostHog broadly | TradeFeed already has GA4, Vercel Analytics, Sentry Replay, `AnalyticsEvent`, `OnboardingEvent`, seller analytics, and an admin activation funnel. |
| P2 | Pilot Geoapify for address normalization | The database already has address, city, province, postcode, latitude, and longitude fields, but input is not fully normalized. |
| Defer | Do not add Trigger.dev yet | Vercel crons already run seller sequences, retention, rankings, domain health, and subscription expiry. |
| Defer | Do not add TinyPNG yet | Product import flows already compress images client-side and UploadThing provides CDN delivery. |

## Audit baseline before implementation

TradeFeed already has more of the recommended foundation than the earlier research assumed:

- Sentry error capture and traces; Replay was present at audit time and is now disabled
- GA4, Vercel Analytics, and Vercel Speed Insights
- first-party catalogue, product, cart, checkout, marketplace, promotion, and payment events
- a seller analytics dashboard and an admin activation funnel
- a database-aware `/api/health` endpoint
- unit tests, Playwright tests, and GitHub Actions CI
- five scheduled Vercel cron jobs
- seller onboarding, re-engagement, weekly report, and monthly report sequences
- seller and product health-scoring engines
- structured South African city/province fields and empty latitude/longitude support
- client-side image compression in multiple upload flows

The highest-value gaps are:

1. Non-essential analytics were not genuinely controlled by the consent notice.
2. Independent uptime alerting and proof of cron completion were absent.
3. Production-critical journeys were not continuously exercised.
4. Lifecycle measurement was split across several systems and missed upgrade intent and some product-creation paths.
5. Seller research was not an operating routine.
6. Location data existed but was not consistently normalized or geocoded.

## Guardrails

- Do not replace Neon, Clerk, Vercel, Prisma, Resend, UploadThing, PayFast, or Sentry.
- Do not send passwords, phone numbers, addresses, payment details, order messages, buyer notes, or form contents to analytics tools.
- Keep acquisition analytics, business events, and error telemetry clearly separated.
- Run mutating synthetic journeys against staging or a dedicated disposable tenant.
- Make every integration removable by deleting one adapter/configuration area and its environment variables.
- Establish a baseline before setting numerical growth targets.

## Phase 0 — Privacy-correct measurement

**Target:** 27–29 July
**Priority:** P0
**Effort:** 1–2 engineering days

### Work

1. Replace the acknowledgement-only cookie notice with explicit analytics choices:
   - accept analytics;
   - reject non-essential analytics;
   - change preference later.
2. Default analytics consent to denied before loading GA4.
3. Keep essential authentication and privacy-filtered exception telemetry operational; keep Sentry Session Replay fully disabled until URL-safe payload handling is independently verified.
4. Review Vercel Analytics against the documented consent policy and either gate it or document why it is treated differently.
5. Create one event dictionary defining:
   - event owner;
   - trigger;
   - allowed properties;
   - prohibited properties;
   - retention;
   - source of truth.
6. Capture the initial 7-day activation baseline without inventing targets.

### Measurement ownership

| Question | Source of truth |
|---|---|
| Where did a visitor come from? | GA4 |
| Did a seller create and activate a shop? | TradeFeed database events and state |
| Did a buyer view, add, or start checkout? | `AnalyticsEvent` |
| Did an exception or performance regression occur? | Sentry |
| Is the service or a scheduled job down? | Better Stack / Checkly |

### Acceptance criteria

- No GA4 collection request is sent before opt-in.
- Rejecting analytics persists and survives a new browser session.
- Changing the preference takes effect without clearing all site data.
- Event tests prove that sensitive values cannot enter analytics payloads.
- The privacy page and event dictionary match actual behavior.

This is an engineering roadmap, not a legal determination; the final consent language should receive an appropriate POPIA/privacy review.

## Phase 1 — Independent uptime and cron monitoring

**Target:** 30 July–2 August
**Priority:** P0
**Tool:** Better Stack
**Effort:** 1–2 engineering days plus dashboard setup

Better Stack's current free offering is sufficient for a focused first pass: its official pages list free uptime monitors, heartbeats, alerts, and a status page. Verify limits again when creating the account.

### Monitors

Create these first:

1. `GET /api/health` — require HTTP 200 and `"status":"ok"`.
2. Homepage — require HTTP 200 and a stable TradeFeed text marker.
3. Marketplace — require HTTP 200 and its primary heading.
4. One permanent synthetic catalogue — require shop name and at least one product.
5. Sign-in page — require HTTP 200 and Clerk UI marker.

Do not monitor webhook endpoints by sending fake Clerk or PayFast events.

### Heartbeats

Add success/failure heartbeats to:

- data retention;
- seller sequences;
- ranking computation;
- domain health;
- subscription expiry.

Send the success heartbeat only after the job completes. Send an explicit failure signal from the catch path, while preserving the existing HTTP failure response and Sentry error.

### Small code hardening

- Stop returning raw database exception text from the public health response.
- Add a shared heartbeat helper with a short timeout; monitoring failure must never turn a successful business job into a failed job.
- Keep heartbeat URLs server-only and redact them from logs.

### Alert policy

- Page or API: alert after two confirmed failures.
- Daily cron: expected interval plus a 60-minute grace period.
- Hourly cron: expected interval plus a 20-minute grace period.
- Email is the initial alert destination; add another channel only if email proves too slow.
- Publish a status page after seven stable days, not on day one.

### Acceptance criteria

- A deliberately failed staging health check produces an alert.
- A missed staging heartbeat produces an alert after its grace period.
- Every production cron reports its first successful heartbeat.
- The runbook identifies the owner, first diagnostic action, and recovery action for each monitor.

## Phase 2 — Scheduled critical-journey checks

**Target:** 3–9 August
**Priority:** P0
**Tool:** Checkly
**Effort:** 3–5 engineering days

Checkly can run existing Playwright suites as scheduled monitors. Its current Hobby plan lists 1,000 browser/Playwright runs and 10,000 API runs per month, so the schedule must stay within that budget.

### Check design

1. **Production buyer journey — hourly**
   - open the marketplace;
   - find the permanent synthetic shop;
   - open a product;
   - add it to the cart;
   - start WhatsApp checkout;
   - assert the generated WhatsApp URL and message shape;
   - do not open WhatsApp or place a real order.

2. **Staging seller journey — daily**
   - sign in with a synthetic seller;
   - create or reset a disposable shop;
   - publish a product;
   - edit its price or title;
   - confirm the public catalogue changed;
   - clean up or reset the fixture.

3. **API health check — every five minutes**
   - require HTTP 200;
   - validate the response schema;
   - set a latency threshold after one week of baseline data.

Keep Checkly-specific tests in a small monitoring project so the full CI suite is not scheduled in production.

### Synthetic-data rules

- Use an unmistakable `synthetic-*` tenant and email identity.
- Exclude synthetic sessions from growth and seller-performance reporting.
- Never reuse a real seller, product, phone number, or order.
- Prefer a staging mutation flow and a read-only production flow.
- Store credentials in Checkly secrets, never in the repository.

### Acceptance criteria

- All checks pass for seven consecutive days.
- A controlled staging regression triggers an alert containing a screenshot or trace.
- The suite stays within the free monthly run allowance.
- False alerts remain below 5% during the first two weeks.

## Phase 3 — Complete the activation funnel

**Target:** 10–16 August
**Priority:** P1
**Tool decision:** improve existing instrumentation; run a PostHog pilot only if justified
**Effort:** 3–5 engineering days

### Canonical lifecycle

Normalize these business events across all creation paths:

```text
seller_signup_started
seller_signup_completed
shop_created
first_product_started
first_product_published
ai_product_generated
catalog_shared
first_buyer_view
product_viewed
whatsapp_checkout_clicked
upgrade_viewed
subscription_started
```

The event contract must specify whether each item is derived from durable database state or explicitly emitted. Prefer durable state for irreversible milestones such as shop creation, first publication, and subscription activation.

### Dashboard work

- Add signup-week cohorts to the admin activation view.
- Show median time from signup to shop, first product, share, and first buyer view.
- Add upgrade-view to subscription-start conversion.
- Separate onboarding-source events from events produced by CSV, bulk import, WhatsApp import, and normal product forms.
- Add an automated reconciliation check between event counts and durable database state.

### PostHog decision gate

Do not install PostHog merely to duplicate GA4, Sentry Replay, and the internal dashboards. Start a 14-day, analytics-only pilot only if the existing stack cannot answer one of these approved questions:

- Which onboarding screens cause abandonment?
- Which feature exposure changes activation?
- Which anonymous pre-signup journey predicts shop creation?

If piloted:

- start with product analytics only;
- do not enable a second session-replay system initially;
- load it only after analytics consent;
- use a strict property allowlist;
- define deletion and rollback procedures before sending production data.

PostHog currently advertises a free allowance of one million product-analytics events per month, but the adoption decision should be based on unique insight, not free capacity.

### Acceptance criteria

- Every event has one owner and one documented meaning.
- Funnel totals reconcile with durable database state within an agreed tolerance.
- No analytics payload includes restricted data.
- A weekly founder view answers: signup volume, shop creation, first-product activation, first buyer view, WhatsApp intent, and paid conversion.

## Phase 4 — Seller research operating loop

**Target:** start by 3 August; run continuously
**Priority:** P1
**Tool:** Tally
**Effort:** half a day to launch, 30 minutes per week to review

Launch only three forms initially:

1. **Seller interview / free shop setup request**
2. **Import my WhatsApp catalogue**
3. **Why did you stop using TradeFeed?**

Use direct links before embedding anything in TradeFeed. Add hidden source fields such as campaign and entry point, but do not prefill private customer data into URLs.

### Operating routine

- Review submissions at the same time every week.
- Tag responses by activation blocker, requested outcome, and seller segment.
- Contact respondents only where they explicitly consented.
- Promote a repeated request into the product roadmap only after multiple independent sellers describe the same problem.

Tally currently offers unlimited forms and submissions within its fair-use rules, including conditional logic. Treat third-party form submissions as personal information and document retention/export ownership before collecting seller details.

### Success checkpoint

After two weeks, the forms should have produced at least ten useful seller conversations or a clear explanation for why distribution—not form tooling—is the bottleneck.

## Phase 5 — Location normalization pilot

**Target:** 17–30 August
**Priority:** P2
**Tool:** Geoapify
**Effort:** 4–6 engineering days

### Sequence

1. Measure current city/province completeness and common spelling variants.
2. Normalize known South African city and province values server-side.
3. Add debounced address autocomplete to shop creation and settings.
4. Save normalized address, city, province, postcode, latitude, and longitude only after explicit seller confirmation.
5. Record provider and geocoding timestamp so results can be refreshed or removed.
6. Test a representative South African address sample before any bulk backfill.
7. Build distance-based discovery only after coordinate coverage and accuracy are good enough.

### Constraints

- Show required Geoapify attribution.
- Cache selected normalized results where the provider terms permit it.
- Never expose a server-only API key.
- Do not geocode buyer delivery addresses for this seller-discovery feature.
- Do not launch a map marketplace during the pilot.

Geoapify currently lists 3,000 free credits per day, no card requirement, and limited commercial use with attribution.

### Acceptance criteria

- At least 95% of the test-address set resolves to the correct city and province.
- Manual entry remains available when autocomplete fails.
- Existing shop settings continue to work without an API key.
- API usage, errors, and quota exhaustion are observable.

## Explicitly deferred

### Trigger.dev

Reconsider only when at least one of these becomes true:

- a workflow regularly exceeds Vercel execution limits;
- step-level retries and resumability are required;
- an external approval must pause and resume a job;
- cron failure diagnosis remains poor after heartbeat monitoring;
- job volume requires concurrency controls not available in the current design.

Until then, adding it would create a second scheduler for workflows TradeFeed already runs.

### TinyPNG

Reconsider only if measurement shows that the existing client compression and CDN are insufficient—for example, image bytes remain excessive or product-page LCP misses the agreed mobile target. Fix the duplicated local compression helpers before adding another paid or quota-limited image pipeline.

### Better Stack logs and another replay product

Do not ingest all logs or add another session-replay system in the first month.
Sentry already covers privacy-filtered exceptions and consented tracing; Replay
remains disabled. Expand only when a named debugging question cannot be
answered safely.

## 30-day delivery board

| ID | Work item | Priority | Effort | Dependency | Status |
|---|---|---:|---:|---|---|
| PRIV-01 | Consent state and preference controls | P0 | M | None | Code complete; production payload review pending |
| PRIV-02 | Gate analytics and disable Sentry Replay | P0 | M | PRIV-01 | Code complete; GA4 property review pending |
| DATA-01 | Event dictionary and restricted-property tests | P0 | M | PRIV-01 | Complete |
| REL-01 | Better Stack HTTP monitors | P0 | S | None | External account setup pending |
| REL-02 | Shared cron heartbeat helper and five integrations | P0 | M | REL-01 | Code complete; heartbeat URLs pending |
| REL-03 | Monitoring runbook and status-page decision | P0 | S | REL-01 | Runbook complete; burn-in pending |
| SYN-01 | Permanent synthetic tenant and exclusion policy | P0 | M | DATA-01 | Safeguards complete; staging fixture pending |
| SYN-02 | Hourly production buyer check | P0 | M | SYN-01 | Code complete; Checkly deployment pending |
| SYN-03 | Daily staging seller journey | P0 | L | SYN-01 | Code complete; staging deployment pending |
| RESEARCH-01 | Launch three Tally forms | P1 | S | Privacy copy | Blueprints complete; publication pending |
| DATA-02 | Normalize lifecycle events across product paths | P1 | L | DATA-01 | Complete |
| DATA-03 | Cohort timing and upgrade funnel | P1 | M | DATA-02 | Complete; baseline pending |
| GEO-01 | Location completeness and accuracy audit | P2 | S | None | Pilot acceptance pending |
| GEO-02 | Geoapify autocomplete pilot | P2 | L | GEO-01 | Code complete; key and pilot pending |
| DECIDE-01 | PostHog go/no-go review | P2 | S | DATA-03 | Deferred until baseline evidence |

Effort guide: **S** under half a day, **M** one to two days, **L** three to five days.

## End-of-month scorecard

Record baselines first, then review:

- median time to detect a production outage;
- percentage of scheduled jobs with a current heartbeat;
- critical synthetic journey pass rate;
- signup → shop conversion;
- shop → first product conversion;
- median time to first product;
- first product → first buyer view conversion;
- WhatsApp checkout intent per unique buyer;
- upgrade view → paid subscription conversion;
- percentage of active shops with normalized city/province;
- number of useful seller interviews completed.

## Current official references

- [Better Stack pricing](https://betterstack.com/pricing)
- [Better Stack cron and heartbeat monitoring](https://betterstack.com/docs/uptime/cron-and-heartbeat-monitor/)
- [Checkly pricing](https://www.checklyhq.com/pricing/)
- [Checkly Playwright monitoring guide](https://www.checklyhq.com/docs/guides/playwright-testing-to-monitoring/)
- [PostHog product and free-tier overview](https://posthog.com/)
- [Tally pricing](https://tally.so/pricing)
- [Geoapify pricing](https://www.geoapify.com/pricing/)

Free tiers change. Recheck official limits before each account is created or production traffic is enabled.
