# Checkly synthetic monitoring

TradeFeed has three monitoring-as-code checks:

| Check | Target | Schedule | Monthly scheduled runs (30 days) | Writes |
|---|---|---:|---:|---|
| API health | Production `/api/health` | Every 5 minutes | 8,640 API runs | None |
| Buyer journey | Production marketplace, catalogue, product, and cart | Every hour | 720 browser runs | Browser-local cart only |
| Seller journey | Public staging/preview deployment | Every 24 hours | 30 browser runs | Product create/edit/delete |

This uses roughly 86% of a 10,000 API-run allowance and 75% of a
1,000 browser-run allowance before manual runs or failure retries. A 31-day
month reaches 8,928 API and 775 browser runs. One Frankfurt location
(`eu-central-1`) is included on Checkly's current Hobby plan and keeps run
usage predictable. Paid plans may switch to Cape Town (`af-south-1`) after
confirming that location is available in the target account.

## What the checks prove

The health check requires HTTP 200, JSON, `status: ok`, and
`db.status: connected`.

The buyer check is deliberately read-only. It opens the marketplace, a
configured stable catalogue, and a configured product from that catalogue. It
selects the first available size/colour combination, validates that the visible
direct **Order on WhatsApp** link is HTTPS, targets `wa.me`, and contains the
product name. It adds the item to browser-local cart state, opens **View Cart**,
confirms the configured product is present, and requires an enabled
**Order on WhatsApp** or **Send Order on WhatsApp** control. The control exposes
a read-only synthetic preview that the check parses to require HTTPS,
`wa.me`, the product name, and the expected TradeFeed order heading.

The check deliberately does not click either WhatsApp control. The cart checkout
handler creates a real `Order` before opening WhatsApp, so the read-only preview
is the production-safe verification boundary. The configured product must
remain published, in stock, linked from its catalogue, and able to expose a
direct product-level WhatsApp link.

The seller check signs in with a short-lived Clerk ticket, using a dedicated
synthetic user. It removes stale products bearing the reserved
`CHECKLY SYNTHETIC -` prefix, creates and publishes a priced product, confirms
the public product page, edits the name, confirms the public update, and deletes
the product in cleanup. A failed run also attempts cleanup.

## Required Checkly account variables

Create the non-secret variables:

```powershell
npx checkly env add CHECKLY_BUYER_SHOP_SLUG
npx checkly env add CHECKLY_BUYER_PRODUCT_REF
npx checkly env add CHECKLY_BUYER_MARKETPLACE_SEARCH
npx checkly env add CHECKLY_SELLER_BASE_URL
npx checkly env add CHECKLY_SELLER_EXPECTED_HOST
npx checkly env add CHECKLY_SELLER_SHOP_SLUG
npx checkly env add CHECKLY_CLERK_FRONTEND_API_URL
```

Create the values that should remain hidden:

```powershell
npx checkly env add CHECKLY_SELLER_EMAIL --secret
npx checkly env add CHECKLY_SELLER_MUTATION_ACK --secret
npx checkly env add CHECKLY_CLERK_SECRET_KEY --secret
```

Omitting the value makes the CLI prompt for it. Set
`CHECKLY_SELLER_MUTATION_ACK` to exactly
`I_UNDERSTAND_THIS_MUTATES_STAGING`.

The Checkly CLI itself also needs a logged-in account or the standard
`CHECKLY_API_KEY` and `CHECKLY_ACCOUNT_ID` credentials. Those deployment
credentials are not passed to browser checks.

## Synthetic tenant safeguards

Before enabling the seller check:

1. Deploy a public HTTPS staging or dedicated preview environment with its own
   database and Clerk configuration.
2. Create exactly one Clerk user whose email includes `+clerk_test`,
   `+checkly`, or `synthetic`.
3. Give that user catalog-management access to a shop whose slug includes
   `checkly` or `synthetic`.
4. Keep the shop below its product limit and reserve the
   `CHECKLY SYNTHETIC -` prefix exclusively for monitoring.
5. Set `CHECKLY_SELLER_EXPECTED_HOST` to the exact hostname from
   `CHECKLY_SELLER_BASE_URL`.
6. Use the Clerk Frontend API hostname (without `https://` or a path) and the
   secret key belonging to that staging Clerk instance.

The check refuses an HTTP target, a host mismatch, the production
`tradefeed.co.za` hosts, any hostname that is not explicitly marked `staging`,
`preview`, `checkly`, or `synthetic`, an unmarked user/shop, or a missing
mutation acknowledgement. It never creates Clerk users or shops. Clerk testing
and sign-in tokens expire; no password or browser storage state is committed.

## Excluding synthetic analytics

Every app-origin browser request includes:

```text
x-tradefeed-synthetic: checkly
```

Top-level URLs also include:

```text
synthetic=checkly
utm_source=synthetic
utm_medium=monitoring
utm_campaign=checkly
```

The browser sets `tradefeed.synthetic=checkly` in local storage and session
storage plus a `tradefeed_synthetic=checkly` cookie. Its user agent begins with
`TradeFeed-Checkly/1.0`.

TradeFeed rejects the header or cookie before creating its analytics visitor
identity, and also treats the `TradeFeed-Checkly` user agent as a bot fallback.
The checks never grant analytics consent, so GA4, Vercel Analytics, Speed
Insights, and Sentry Replay remain off. Keep the query and storage markers for
log filtering and incident diagnosis. Do not remove the health check from
operational request logs; tag it as synthetic instead.

## Validate and deploy

List and bundle the constructs without executing them (this still requires a
Checkly CLI login or `CHECKLY_API_KEY` and `CHECKLY_ACCOUNT_ID`):

```powershell
npm run monitoring:list
```

For a local/cloud test, copy `.env.checkly.example` to the ignored
`.env.checkly.local`, fill it with staging-only values, authenticate the Checkly
CLI, and run:

```powershell
npm run monitoring:test
```

Preview changes before the first deployment:

```powershell
npx checkly deploy --preview
```

After reviewing the target account and variables:

```powershell
npm run monitoring:deploy
```

Normal lint, type-check, unit-test, build, and Playwright CI do not require any
Checkly or synthetic-seller secrets. The dedicated Checkly specs are discovered
only by `checkly.config.ts`; the existing local `playwright.config.ts` continues
to run the `e2e/` smoke suite.
