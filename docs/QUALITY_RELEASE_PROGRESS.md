# Marketplace quality release — 16 September 2026

Implementation is isolated on codex/marketplace-quality in E:/apps/tradefeed-marketplace-quality. The original workspace and its unrelated uncommitted work are preserved. Production has not been changed by this release.

## Implemented

- Shopper-first home with real catalogue photography and a dedicated /sell landing page. Shared buyer navigation, visible marketplace sorting, smaller product typography, meaningful retail defaults, readable image alt text, and one mobile purchase bar with an accessible cart drawer.
- Whole-result ranking before pagination; explicit price/rating sorting is preserved. Slug routes use resolved product IDs for reviews and sales evidence. Sparse image positions no longer remove marketplace thumbnails.
- Checkout request keys prevent duplicate orders across retries. Authoritative price/stock checks remain in the database transaction. Stock reservations expire after 24 hours and an authenticated hourly job releases unconfirmed reservations. Cancellation, seller shipping, COD receipt and payment callbacks use locked order rows. Legacy inventory is never automatically restored.
- Late or inconsistent payments are recorded and held for administrator review without reviving cancelled orders. Sold evidence uses delivered orders; revenue counts recorded payments.
- Buyer PayFast requires explicit enablement, a shop allowlist and provider credentials. Subscription billing is unchanged. Manual seller payment remains available; COD follows shop settings. Estimates cannot be purchased as courier bookings. Collection is selectable without a delivery address; seller-arranged shipping is clearly additional.
- Unverified reviews enter platform moderation. Sellers can report feedback but cannot delete it. Admin decisions require reasons and create audit entries.
- Order-linked support cases for signed-in buyers and guests with matching order/phone details. Guest access uses a hashed random token in an HttpOnly cookie. Buyers, scoped sellers and admins can reply; admins can change status with an audit entry. Admin queue also exposes payment holds.
- Seller readiness checklist, product repair guidance, draft text/price recovery in the same browser tab, and explicit manual review when AI is unavailable. New discovery listings need a description, category, stock, photo, positive price and a shop returns/fulfilment policy. Existing products receive a 30-day repair window when the migration runs; their direct shop listings remain available.
- Public HTML and RSC responses are no longer stored by the service worker; they may contain signed-in buyer defaults. Static assets and images remain cacheable. Fixed native-share hydration mismatch and checkout positioning inside a filtered header.
- Deterministic buyer fixtures, strict buyer smoke tests, database concurrency regressions, and a guarded fresh-database baseline replay in CI replace the old test db-push setup.

## Validation

- Unit suite: 496 passed; the separate database integration suite is intentionally skipped in the ordinary unit command.
- PostgreSQL integration suite: 7 passed, covering duplicate submissions, authoritative pricing, oversell races, cancellation/expiry, legacy stock, late/duplicate payments, tenant scope, COD transitions, listing grace and review reports.
- ESLint and production build passed. Final changes are rechecked before commit.
- Browser: desktop and 390px mobile home/product/cart, retail selection, collection controls, no horizontal overflow, guest support submission and reply. Access without the case cookie returned 404 and no conversation content. No production order, customer message or payment was generated.
- Fresh PostgreSQL baseline plus release SQL replayed. Full custom-format backup restored into a separate local database, preserving the fixture product. Prisma schema comparison reported no difference.
- Hosted CI and browser-test runner results must be checked on the PR; local browser checks used the connected browser. Field Core Web Vitals and authenticated seller/admin end-to-end workflows are not claimed as verified.

## Production rollout

1. Take and verify a provider snapshot/backup. Inspect production schema and migration history against the current main schema before applying changes. Do not run the fresh-database baseline on production, reset the database, or blindly use db push.
2. Apply the five additive release migrations, in order: 20260916180000_order_reservations; 20260916190000_review_moderation; 20260916200000_support_cases; 20260916210000_restore_product_search; 20260916220000_listing_quality_grace. Use a staging clone first. Record their application in migration history according to the existing production baseline; historical migration checksums are deliberately untouched.
3. Deploy with the buyer redesign flag enabled. Verify public product, cart, manual order, tracking, support permissions, admin moderation and the protected expiry endpoint. Assign responsibility for the support/payment queues.
4. Keep BUYER_PAYMENTS_ENABLED=false until seller settlement and refund handling are approved. If approved, configure BUYER_PAYMENT_SHOP_IDS for those shops only. Existing PayFast links are unavailable for shops outside that allowlist. Courier booking still requires a real provider adapter and operational validation; the release does not claim to book shipments.
5. Existing sellers must supply accurate descriptions, categories and their own returns policies before the repair deadline. Do not generate product facts or merchant policies automatically. Review the legacy pending-order stock with each seller before any correction. Review existing paid orders separately from off-platform arrangements.
6. Monitor checkout failures, expiry results, held payments and unresolved cases. Measure mobile/desktop field performance after rollout; targets are not measurements. Remove remaining legacy UI branches only after the enabled flag matrix and authenticated routes are proven.

## Rollback and limits

Keep additive tables/columns and all accounting/support records. Roll back visual changes separately; do not blindly revert reservation-aware order code once new orders exist. The full restore rehearsal was local and does not establish the production provider's recovery time. Production migration-history reconciliation remains a release operation, not something the local bootstrap performs.

Search currently loads lightweight ranking candidates for the matching catalogue before paging. This fixes the current ordering defect; move ranking into an indexed database query as catalogue volume grows. Support queues show the oldest 100 unresolved cases; assign operational ownership before launch. Refunds are not automatically executed, and payment holds require provider reconciliation by an administrator.
