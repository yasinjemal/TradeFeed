# PayFast subscription cancellation

What "Cancel subscription" does, and how to prove it in the PayFast sandbox.
Written 2026-11-19 against <https://developers.payfast.co.za/api> and
<https://developers.payfast.co.za/docs>.

## What happens when a seller cancels

1. `cancelSubscriptionAction` (`app/actions/billing.ts`) calls
   `cancelShopSubscription` (`lib/billing/cancel-subscription.ts`).
2. That calls PayFast: `PUT https://api.payfast.co.za/subscriptions/{token}/cancel`
   (`lib/payfast-api.ts`). In the sandbox the URL gets `?testing=true`.
3. Only if PayFast answers `{"code":200,"status":"success","data":{"response":true}}`
   is our row set to `CANCELLED`. The seller keeps the plan until
   `currentPeriodEnd`; the daily `subscription-expiry` cron then moves them to Free.
4. If PayFast does not confirm, nothing changes on our side, the seller sees
   "We couldn't stop your payments with PayFast… still active", and Sentry gets
   `payfast-subscription-cancel-failed` with PayFast's reason.
5. PayFast emails the buyer and sends our webhook an ITN with
   `payment_status=CANCELLED`. The webhook matches it on the subscription token.

Plans paid by manual EFT have no PayFast subscription, so step 2 is skipped.

## Account prerequisites (live and sandbox)

- A **passphrase** must be set, or PayFast rejects every API call.
- If a **Recurring Billing IP whitelist** is set in the PayFast dashboard, the
  API only answers those IPs (`401 Request origin could not be verified`).
  Vercel has no fixed outgoing IP — leave the whitelist empty.

## Verify in the PayFast sandbox

Nothing here touches real money or the live PayFast account.

**Set up (once)**

1. Go to <https://sandbox.payfast.co.za> and sign in with your email address.
2. On the sandbox dashboard, set a **Salt Passphrase** (Account Information /
   Settings). Subscriptions do not work without one. Note the sandbox
   **Merchant ID** and **Merchant Key** shown there.
3. PayFast must be able to reach your machine. Start a tunnel
   (`ngrok http 3000`) and copy the `https://…` address.
4. In `.env.local` (never the production env) set:

   ```
   PAYFAST_MERCHANT_ID=<sandbox merchant id>
   PAYFAST_MERCHANT_KEY=<sandbox merchant key>
   PAYFAST_PASSPHRASE=<the salt passphrase from step 2>
   NEXT_PUBLIC_APP_URL=<the https tunnel address>
   ```

   Use a development database, not production.
5. `npm run dev`. Outside production the app targets the sandbox
   automatically (`NODE_ENV !== "production"`), for checkout and for the API.

**A. Subscribe**

6. Open the tunnel address, sign in as a seller on the Free plan, go to
   Dashboard → Billing, and click **Upgrade to Starter**.
7. On the PayFast sandbox page, log in as the test buyer
   (`sbtu01@payfast.io` / `clientpass`), pick the test credit card, enter the
   CVV shown, and pay.
8. Back on the billing page you should see **"Payment successful! Your Starter
   plan is active."** (or "Payment received… activating your Starter plan" for
   a few seconds — refresh).
9. In the sandbox dashboard open **ITN**. There is one notification with
   `payment_status=COMPLETE` and a `token`. Copy the token — the sandbox does
   not show it anywhere else. Confirm the same value is in
   `Subscription.payfastToken` for the shop.

**B. Cancel — the change under test**

10. On the billing page click **Cancel subscription… → Yes, cancel**.
11. Expected in the app: **"Subscription cancelled. PayFast has stopped your
    monthly payment — you won't be charged again. You keep Starter until
    <date>."** The status badge reads `CANCELLED`.
12. Expected in the dev server log: no `payfast-subscription-cancel-failed`.
13. Expected in the sandbox dashboard: the subscription is listed as
    cancelled, and **ITN** shows a second notification with
    `payment_status=CANCELLED` and the same token.
14. Database: `Subscription.status = CANCELLED`, `payfastToken` unchanged,
    `currentPeriodEnd` unchanged.

**C. Cancel must fail safely**

15. Subscribe again with another shop that is on the Free plan (steps 6–9).
16. Stop the dev server, change `PAYFAST_PASSPHRASE` to a wrong value, start
    it again, and click **Cancel subscription… → Yes, cancel**.
17. Expected: the red message "We couldn't stop your payments with PayFast, so
    your subscription is still active…". Status stays `ACTIVE`. The log shows
    `payfast-subscription-cancel-failed … rejected — HTTP 401`. The sandbox
    still lists the subscription as active.
18. Restore the passphrase and cancel properly.

**D. Upgrade between two paid plans**

19. On a shop with an active sandbox Starter subscription, click **Upgrade to
    Pro** and pay.
20. Expected: plan becomes Pro. The sandbox now shows the **Starter
    subscription cancelled** and the Pro one active — one subscription, not
    two. ITN shows `COMPLETE` (Pro) then `CANCELLED` (Starter's token), and
    the shop stays on Pro, `ACTIVE`.

**E. A debit after cancelling (optional)**

21. In the sandbox dashboard, find a subscription the app has NOT cancelled at
    PayFast, set our row to `CANCELLED` by hand, then use the sandbox's
    **charge** action on it.
22. Expected: the shop keeps its plan for one more month but stays
    `CANCELLED`; the app cancels the subscription at PayFast; Sentry gets
    `payfast-charged-after-cancel`.

## After deploying to production

Sellers who clicked Cancel before this change are still subscribed at
PayFast. Find them and cancel those subscriptions in the PayFast dashboard
(Recurring Billing) before their next billing date:

```sql
SELECT sh.slug, p.slug AS plan, s."payfastToken", s."currentPeriodEnd"
FROM "Subscription" s
JOIN "Shop" sh ON sh.id = s."shopId"
JOIN "Plan" p  ON p.id  = s."planId"
WHERE s.status = 'CANCELLED'
  AND s."payfastToken" IS NOT NULL
  AND p.slug <> 'free';
```

If one is missed, the webhook now catches it at the next debit: the seller
keeps the month they paid for, the subscription is cancelled at PayFast, and
`payfast-charged-after-cancel` is raised so the payment can be refunded.

Alerts worth watching in Sentry after release:

| Context | Meaning | Action |
| --- | --- | --- |
| `payfast-subscription-cancel-failed` | A seller tried to cancel and PayFast did not confirm | Check passphrase / IP whitelist; cancel in the PayFast dashboard |
| `payfast-charged-after-cancel` | PayFast debited a cancelled subscription | Refund; confirm it is cancelled at PayFast |
| `payfast-superseded-cancel-failed` | Seller upgraded, old subscription could not be cancelled | Cancel the old one in the PayFast dashboard |
| `payfast-superseded-subscription-charged` | An old, replaced subscription was debited | Refund; confirm it is cancelled at PayFast |
