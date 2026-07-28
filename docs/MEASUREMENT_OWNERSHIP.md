# TradeFeed Measurement Ownership and Event Dictionary

**Owner:** TradeFeed founder/product owner
**Engineering custodian:** repository maintainer
**Last reviewed:** 27 July 2026
**Review cadence:** quarterly and before adding any analytics vendor

This document is the contract for measurement in TradeFeed. It separates
acquisition analytics, product/business events, and operational telemetry so
one metric has one authoritative source.

## Consent boundary

Non-essential measurement is denied until
`tf_analytics_consent_v1=granted` exists:

- Google Analytics 4;
- Vercel Web Analytics;
- Vercel Speed Insights;
- Sentry browser tracing (Session Replay remains disabled);
- the TradeFeed anonymous visitor cookie and browser-originated
  `AnalyticsEvent` records.

Rejecting or withdrawing consent persists for 12 months, deletes the
TradeFeed analytics visitor cookie on the next request, removes browser GA
cookies, and reloads the app with the vendors disabled. Authentication,
fraud prevention, server logs, and privacy-filtered Sentry exception capture
remain operational because they are necessary to provide and secure the
service. Transaction state such as a successful payment remains part of the
contractual business record and does not depend on analytics consent.

Anonymous wishlist and restock-alert persistence uses a separate
`tf_buyer_feature_id` cookie created only when a signed-out person invokes one
of those features. It expires after 90 days and is never copied into
`AnalyticsEvent`; rejecting analytics therefore does not break buyer features
or cause anonymous database rows to share a null identity.

## Source-of-truth ownership

| Question | Authoritative source | Accountable owner |
|---|---|---|
| Where did a consented visitor come from? | GA4 | Growth/founder |
| Did a seller sign up, create a shop, publish, or subscribe? | Durable TradeFeed database state; lifecycle events are diagnostic only | Product/founder |
| Did a consented buyer view, add, or begin WhatsApp checkout? | `AnalyticsEvent` | Product/founder |
| Was a PayFast payment completed? | `Order`, `Payment`, and `Subscription` state; `PAYMENT_COMPLETE` is a convenience metric | Finance/operations |
| Did an exception occur? | Sentry issue event plus application logs | Engineering |
| Is browser performance regressing? | Sentry tracing and Vercel Speed Insights, with consent | Engineering |
| Is the service or a scheduled job unavailable? | Better Stack/Checkly monitor state | Engineering/operations |

When two tools expose a similar number, the authoritative source above wins.
Dashboards must link or reconcile to it rather than silently choosing the
more convenient total.

## Global prohibited data

Never send these values to GA4, Vercel Analytics, `AnalyticsEvent`, Sentry
extras, tracing attributes, or Replay:

- passwords, authentication cookies, API keys, secrets, or one-time tokens;
- names, email addresses, phone numbers, WhatsApp messages, or buyer notes;
- street/delivery addresses, GPS coordinates, or free-form form contents;
- card, bank, PayFast payload, proof-of-payment, or other payment details;
- raw IP addresses or IP-derived fingerprints;
- URL query strings or fragments.

`lib/analytics/event-policy.ts` is the runtime allowlist for
`AnalyticsEvent`. `lib/telemetry-privacy.ts` strips unapproved Sentry extras
and identifying request fields. Adding a property requires updating code,
tests, and this document in the same change.

## Acquisition and performance dictionary

| Event/system | Trigger | Allowed properties | Retention | Source of truth / owner |
|---|---|---|---|---|
| GA4 `page_view` | Consented route view | Origin and templated route pathname only; dynamic shop/product/order/token segments removed; advertising storage and signals disabled | 2 months in the GA4 property; verify during deployment and quarterly | GA4 / Growth |
| Vercel Web Analytics page view | Consented app load and navigation | Provider-default aggregate page and referrer dimensions; no custom payloads | Provider-plan retention; review quarterly | Vercel / Growth |
| Vercel Speed Insight | Consented Web Vital sample | Provider-default Web Vital, route, browser and device class | Provider-plan retention; review quarterly | Vercel / Engineering |
| Sentry browser transaction | Consented browser navigation/performance trace | Templated route pathname and technical timing/span fields | Sentry project retention; review quarterly | Sentry / Engineering |
| Sentry Session Replay | Disabled | No events. Replay DOM metadata includes unsanitizable full browser URLs, so it must remain off until route exclusion or equivalent sanitization is verified. | None | Engineering |
| Sentry exception | Application exception, regardless of analytics choice | Exception type, sanitized stack frames, templated origin/pathname/transaction, approved technical IDs/status values; free-form exception messages and values are removed | Sentry project retention; review quarterly | Sentry / Engineering |

GA4 must have enhanced-measurement page-view/history tracking disabled in the
property. TradeFeed emits its own page view with a query-free, templated route
so user-entered search values, order numbers, invitation/review tokens, shop
slugs, and product IDs cannot enter the payload.

GA4 is fail-closed in code: it does not load unless both
`NEXT_PUBLIC_GA_ID` and `NEXT_PUBLIC_GA_MEASUREMENT_REVIEWED=true` are present.
Set the review flag only after disabling all Enhanced Measurement features
(especially outbound clicks and browser-history page views) and inspecting
live network payloads for safe location, referrer, and title values.

## `AnalyticsEvent` dictionary

All records share the same runtime property allowlist:

| Property | Meaning |
|---|---|
| `type` | One value from the Prisma `EventType` enum |
| `shopId` | Internal tenant identifier |
| `productId` | Internal product identifier, where applicable |
| `visitorId` | Random consent-dependent UUID; never derived from IP |
| `createdAt` | Database-generated timestamp |

User-Agent is inspected transiently to reject obvious bots but is never
persisted. First-party events do not store referrer headers; acquisition
attribution belongs to consented GA4. The
`20260727130000_remove_analytics_request_metadata` migration also removes
historical `userAgent` and `referrer` columns.

Browser-originated records require consent and are deleted after 90 days by
the data-retention cron.

| Type | Owner | Trigger | Source-of-truth note |
|---|---|---|---|
| `PAGE_VIEW` | Product | A non-owner opens a public catalogue | `AnalyticsEvent` |
| `PRODUCT_VIEW` | Product | A buyer opens a product detail page | `AnalyticsEvent` |
| `WHATSAPP_CLICK` | Product | A buyer selects a product WhatsApp enquiry link | `AnalyticsEvent` |
| `WHATSAPP_CHECKOUT` | Product | A buyer selects WhatsApp checkout from the cart | `AnalyticsEvent` |
| `ADD_TO_CART` | Product | A buyer adds a product to the local cart | `AnalyticsEvent` |
| `CHECKOUT_START` | Product | A buyer starts an order checkout | `AnalyticsEvent` for intent; `Order` for completed creation |
| `PAYMENT_COMPLETE` | Finance | A verified PayFast ITN completes payment | Durable `Order`/`Payment` state |
| `MARKETPLACE_VIEW` | Growth/product | A consented visitor opens marketplace discovery | `AnalyticsEvent` |
| `MARKETPLACE_CLICK` | Growth/product | A consented visitor follows a marketplace result | `AnalyticsEvent` |
| `PROMOTED_IMPRESSION` | Marketplace operations | A validated, active promoted result is visibly rendered | `AnalyticsEvent` for period analysis; `PromotedListing.impressions` for the cumulative operational counter |
| `PROMOTED_CLICK` | Marketplace operations | A visitor selects a validated, active promoted result | `AnalyticsEvent` for period analysis; `PromotedListing.clicks` for the cumulative operational counter |

## Seller lifecycle and paid-conversion diagnostics

`OnboardingEvent` records explain when a seller first reached a milestone;
the underlying `Shop`, `Product`, and `Subscription` rows remain the
authoritative business state. Lifecycle events contain an internal user ID,
a canonical step, an allowlisted source, relevant internal entity IDs, the
public shop slug where applicable, and the database-generated timestamp.
They are retained with the account and are deleted when the user is deleted.

| Step | Trigger | Allowed metadata | Source-of-truth note |
|---|---|---|---|
| `started` | An authenticated seller without a shop opens the get-started flow | `source` | Diagnostic entry into onboarding; `User.createdAt` is the signup cohort boundary |
| `shop_created` | A shop is successfully created through onboarding or the standalone creation flow | `shopId`, `shopSlug`, `source` | `Shop` and owner membership are authoritative |
| `product_created` | The onboarding flow successfully creates the seller's first active product | `shopId`, `shopSlug`, `productId`, `source` | `Product` is authoritative; the dashboard derives the true first product from durable rows |
| `completed` | The seller reaches the onboarding celebration state | `shopId`, `shopSlug`, `source` | Diagnostic UI completion only; it does not replace durable shop/product state |
| `catalog_shared` | An owner uses a supported catalogue-share control | `shopId`, `shopSlug`, `source` | Diagnostic; the share destination/content is never stored |
| `upgrade_viewed` | An eligible owner opens billing, or an owner opens the upgrade page | `shopId`, `shopSlug`, `source` | Diagnostic indication of upgrade interest |
| `subscription_started` | A paid plan is successfully activated by PayFast, manual approval, or an admin | `shopId`, `shopSlug`, `source` | `Subscription` is authoritative for entitlement and payment operations |

Lifecycle writes are idempotent through a database-unique dedupe key. The
activation dashboard reconciles events against durable business rows,
deduplicates milestones per shop, and matches new events by immutable
`shopId`, with `shopSlug` retained only as a legacy fallback. “Converted after view”
requires the first paid-start event to be at or after the first upgrade-view
event. Period filters form a cohort by seller signup (`User.createdAt`), not
shop or event date. Paid state is reconciled from durable subscriptions, while
event timestamps are used only for sequence and timing diagnostics.

## Change checklist

Before adding or changing measurement:

1. Name the decision the event will support and its accountable owner.
2. Prefer durable database state for irreversible milestones.
3. Add the smallest explicit property allowlist; never accept arbitrary
   metadata from a client.
4. Confirm consent gating and withdrawal behavior.
5. Add tests proving rejected/missing consent disables collection and
   unexpected sensitive properties are discarded.
6. Define retention and deletion before production collection.
7. Update the privacy policy and this dictionary.
