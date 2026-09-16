# Activation operations — 16 September 2026

The earlier audit's trust wording, product milestone recording and truthful homepage counts were already fixed. A fresh read-only production check found product_created and catalog_shared events dated 16 September, 42 enabled empty shops, 117 active listings with at least one completeness issue, and 33 pending orders older than seven days. All 12 existing reviews remain unverified purchases; this does not establish that their content is false.

## Delivered workflow

/admin/operations is restricted to platform admins. It prioritises recent incomplete shops, presents ten sellers at a time, lists exact product/shop repairs, and offers assistance copy for review. A saved follow-up assigns responsibility to the saving admin and records status, next action, follow-up date, evidence and seller-confirmed enquiry state in the existing audit log. Closing a follow-up does not mark a seller activated. Completed goals require three complete products, shop contact/location/fulfilment/returns details, a recorded share/copy action and explicit seller enquiry confirmation. A share/copy event is not proof that a message reached a buyer.

The oldest 100 pending orders over seven days have a seller-outcome follow-up form. These append-only evidence notes never mutate payment, stock, order status or refunds. Reconciliation still requires seller/provider evidence. Historical inventory is not guessed.

Seller readiness uses the same completeness checks, counts the full catalogue, exposes the catalogue share control and distinguishes listing completeness from shop readiness. The 40-character description target is an editorial completeness check; it does not verify product facts, authenticity or legal compliance. Existing discovery rules and the migration's grace window are unchanged.

/admin/reviews?filter=unverified exposes legacy unverified feedback for consistent platform review. Moderation does not silently mark purchases verified. Measurement health shows latest first-occurrence milestones; completed means the legacy celebration screen, not business activation. No historical events are backfilled. HUNT receives no expansion in this release.

## Work requiring seller input

Real product images, accurate descriptions/categories and returns commitments must come from merchants. First enquiries and historical order outcomes require evidence. No sellers have been contacted, no drafts sent, no live order outcomes changed, and no ten-seller cohort is claimed complete by this software release.

## Validation and rollout

500 unit tests passed, including readiness, priority ordering and evidence validation. The operations data queries ran successfully read-only against production. Lint and production build are checked before release. Authenticated admin form submission is not claimed as manually browser-tested. No database migration or customer outreach is needed to deploy this release; it uses the existing audit log. Production verification must also confirm unauthenticated access is rejected.
