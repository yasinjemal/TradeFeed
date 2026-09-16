# Seller assistance email pilot

This pilot recommends useful next steps from saved shop data. It does not use AI-generated claims or infer that someone is struggling from inactivity alone. No database migration is required: it uses the existing email preference, suppression, campaign and recipient tables.

## Rules

| Situation | Eligibility | Action |
|---|---|---|
| No first product | Shop at least 48 hours old, no saved products | Open the photo-first product form |
| Incomplete listing | Active, unflagged listing with missing photo, price, category or useful description; last edit at least 24 hours ago | Open that listing’s editor; name its actual missing details |
| Catalogue not shared | At least three complete, stocked listings, no recent edits, no tracked catalogue share | Open the product dashboard and explain the Share catalog button |

Draft-only catalogues and stock-only gaps do not generate reminders. A tracked share is not proof that a WhatsApp message was delivered; copy acknowledges that sellers might have shared outside TradeFeed.

## Consent and review

Sellers explicitly enable **Seller help and product news** in Dashboard → Notifications. The product dashboard links to that choice. The saved evidence version is `seller_help_and_product_news_v2`. Existing `product_news_v1` consent does not silently expand to tailored help; the notifications page offers an explicit additional opt-in. Opt-outs remain effective, and re-opt-in only releases the user’s unsubscribe suppression, never bounces or complaints.

The read-only production check on 16 September 2026 found 108 non-banned owners of enabled shops, all with UNKNOWN email consent. They are not eligible until they opt in. No consent was changed during implementation.

Admin → Activation → Seller assistance emails shows the recipient address, observed situation, subject, exact text, and direct action link. Approve each message individually. Approval binds the recipient address, shop, situation and rendered template to a fingerprint. Changing any of those requires a fresh review. Each approval and cancellation is logged. Pending approvals can be cancelled.

The page evaluates up to 500 opted-in owner memberships, newest shops first, and shows up to 20 suggestions. Refresh it for new situations. This pilot does not autonomously approve emails or generate recurring campaigns for everyone.

## Delivery

The Vercel job `/api/cron/seller-assistance` runs daily at 08:00 UTC / 10:00 SAST and processes at most ten approved messages per run. It requires `CRON_SECRET` in every environment. It never sends unapproved suggestions.

Immediately before sending, the worker rechecks ownership, shop activity, consent version, bans, shared-address ambiguity, suppression, address identity, the seven-day cap and the actual situation. Resolved or changed situations become SUPPRESSED. Recent marketing attempts also block assistance. Address-scoped database locks and atomic recipient claims prevent this worker from double-sending concurrent approvals/runs. The same snapshot is approved at most once; it is not repeated every week.

Provider idempotency keys remain stable. SENT means provider accepted; DELIVERED requires a provider webhook. An uncertain attempt becomes FAILED or may remain PROCESSING after interruption; neither is automatically retried. Reconcile such records in Resend before any manual intervention. Never reset them just to retry after provider idempotency retention has elapsed.

The system records current completion of the requested listing/share action after a send. That is observational, not causal attribution or proof of a sale. It does not count email opens as activation. First enquiries and sales remain separate seller/analytics outcomes.

## Configuration and launch

1. Deploy the reviewed application changes and configure `CRON_SECRET`.
2. Keep `SELLER_ASSISTANCE_SEND_ENABLED=false` while reviewing pilot messages.
3. Configure the existing strong `EMAIL_MARKETING_HMAC_SECRET`, `RESEND_API_KEY`, verified sender/provider readiness and marketing delivery settings. The existing `EMAIL_MARKETING_NCC_CLEANSED_AT` freshness lock is preserved; it is not overridden by this feature.
4. Register `https://tradefeed.co.za/api/webhooks/resend` for `email.delivered`, `email.bounced`, and `email.complained`; set its signing secret as `RESEND_WEBHOOK_SECRET`. Verify delivery events reach the endpoint before enabling sends.
5. Invite sellers to make their email choice through the dashboard. Do not mark existing unknown preferences as opted in.
6. Preview and approve a small pilot batch in Admin → Activation. Enable `SELLER_ASSISTANCE_SEND_ENABLED=true` and the existing `EMAIL_MARKETING_SEND_ENABLED=true` only when ready for that approved batch to send.
7. Review actual listing completion, sharing, delivery failures and replies to `support@tradefeed.co.za`. Switch assistance sending off to pause the queue.

The webhook verifies the raw body using the signing secret. Bounce/complaint events create durable address-level suppression and stop queued email. Duplicate and out-of-order events cannot turn a complaint into a successful delivery. Signed recipient tags allow reconciliation if a webhook arrives before the send response is stored.

Production deployment, provider configuration and seller consent are not performed by the implementation itself. No customer email was sent while building or testing this pilot.

## Validation

`npx tsx --test tests/seller-assistance-policy.test.ts tests/seller-assistance-delivery.test.ts`

The tests mock the database and provider. They cover timing, stock-only and draft exclusions, incomplete details, share completion, HTML escaping, consent versions, weekly limits, stale previews, address changes, cancellation, disabled sends, unknown delivery results, signed webhook replay and complaint precedence. Database integration/concurrency under a real PostgreSQL scheduler and live provider delivery should be exercised in staging before enabling the pilot.

## Implementation verification — 16 September 2026

- Full unit suite: 516 passing tests, including 20 assistance-specific cases/subcases. No live email provider calls.
- TypeScript and changed-file ESLint checks passed.
- Browser previews checked for all three message types; no real signup, approval or send was performed.
- The PostgreSQL advisory-lock statement was checked in a read-only transaction and released immediately.
- Preview files can be regenerated with `npx tsx scripts/preview-seller-assistance.ts`; they contain fictional seller data and non-live unsubscribe tokens.
