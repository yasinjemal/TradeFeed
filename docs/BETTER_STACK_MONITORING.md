# Better Stack monitoring runbook

This runbook configures independent uptime checks for TradeFeed and completion
heartbeats for all jobs in `vercel.json`. Better Stack is optional at runtime:
when no heartbeat URL is set, cron behavior is unchanged.

The heartbeat URLs below are credentials. Store them only as server-side Vercel
environment variables. Never prefix them with `NEXT_PUBLIC_`, paste them into a
ticket, or include them in logs.

## 1. Uptime monitors

In Better Stack, go to **Monitors → Create monitor** and create the following
keyword monitors. Replace `https://tradefeed.co.za` if the canonical production
origin changes.

| Name | URL | Required keyword | Check frequency | Confirmation period |
|---|---|---|---:|---:|
| TradeFeed API health | `https://tradefeed.co.za/api/health` | `"status":"ok"` | 3 minutes | 3 minutes |
| TradeFeed homepage | `https://tradefeed.co.za/` | `WhatsApp-first marketplace` | 5 minutes | 5 minutes |
| TradeFeed marketplace | `https://tradefeed.co.za/marketplace` | `Sell on TradeFeed` | 5 minutes | 5 minutes |
| TradeFeed synthetic catalogue | `https://tradefeed.co.za/catalog/<synthetic-shop-slug>` | `<synthetic-shop-name>` | 5 minutes | 5 minutes |
| TradeFeed sign-in | `https://tradefeed.co.za/sign-in` | `Your catalog is waiting` | 5 minutes | 5 minutes |

For every monitor:

1. Select `GET`, require HTTP `200`, enable SSL verification, and leave request
   headers and body empty.
2. Set the confirmation period to one check interval. This requires a second
   failed check before opening an incident.
3. Send incidents to the founder/owner email first. Do not add public status
   page subscribers until the checks have been stable for seven days.
4. Keep the catalogue monitor paused until a permanent, clearly named synthetic
   shop with at least one active product exists. Replace both placeholders in
   the table; never point this monitor at a real seller.

The health endpoint checks database connectivity. Its public failure response
is intentionally generic and does not expose the database driver's exception.

## 2. Cron heartbeats

Go to **Heartbeats → Create heartbeat** and create these five heartbeats:

| Better Stack heartbeat name | Vercel schedule (UTC) | Expected period | Grace | Vercel environment variable |
|---|---|---:|---:|---|
| TradeFeed — data retention | `0 3 1 * *` | 31 days (`2678400` seconds) | 60 minutes (`3600` seconds) | `BETTER_STACK_HEARTBEAT_DATA_RETENTION_URL` |
| TradeFeed — seller sequences | `0 7 * * *` | 24 hours (`86400` seconds) | 60 minutes (`3600` seconds) | `BETTER_STACK_HEARTBEAT_SELLER_SEQUENCES_URL` |
| TradeFeed — ranking computation | `0 2 * * *` | 24 hours (`86400` seconds) | 60 minutes (`3600` seconds) | `BETTER_STACK_HEARTBEAT_RANKING_COMPUTATION_URL` |
| TradeFeed — domain health | `0 * * * *` | 1 hour (`3600` seconds) | 20 minutes (`1200` seconds) | `BETTER_STACK_HEARTBEAT_DOMAIN_HEALTH_URL` |
| TradeFeed — subscription expiry | `0 1 * * *` | 24 hours (`86400` seconds) | 60 minutes (`3600` seconds) | `BETTER_STACK_HEARTBEAT_SUBSCRIPTION_EXPIRY_URL` |

Enable email alerts for each heartbeat. Copy the unique secret URL shown on
each heartbeat detail page and add it, unchanged, to the corresponding
**Production** environment variable in Vercel. The value must have this form:

```text
https://uptime.betterstack.com/api/v1/heartbeat/<secret-token>
```

Use the base URL only. Do not add `/fail`; TradeFeed adds that suffix when a job
fails. Do not add a query string or fragment. After all five values are saved,
redeploy production so the functions receive them.

The code deliberately does not put these optional secrets in the validated
required-environment schema. Builds, previews, local development, and tests
continue to work without a Better Stack account.

### Delivery behavior

- A success heartbeat is queued only after the job completes.
- An explicit `/fail` heartbeat is queued for caught failures. Subscription
  expiry also reports failure when one or more downgrades fail, while preserving
  its existing HTTP response.
- Unauthorized requests never send heartbeats, so a public caller cannot
  manufacture incidents.
- Next.js runs delivery after the route response. The fetch has a 1.5-second
  timeout and monitoring errors are absorbed, so Better Stack cannot turn a
  successful business job into a failed or slow response.
- Only HTTPS heartbeat URLs on `uptime.betterstack.com` are accepted. Logs
  contain the job name and bounded result only, never the URL or token.

## 3. Verification before relying on alerts

1. Deploy to production with all five environment variables.
2. Run each cron once through an authenticated production request or the Vercel
   cron controls. Confirm the route response first, then confirm the heartbeat
   changes from **Pending** to **Up** in Better Stack.
3. In staging, use separate temporary heartbeat URLs. Trigger one successful
   job and confirm receipt.
4. Cause a controlled staging job failure and confirm Better Stack opens an
   incident from the explicit `/fail` signal. Restore the dependency and run
   the job successfully to confirm recovery.
5. Pause the temporary staging heartbeat after the test so it cannot create a
   false missed-heartbeat incident.
6. For the API monitor, point a temporary staging monitor at a controlled
   unhealthy health response and verify an email arrives after the configured
   confirmation period.

Better Stack begins missed-heartbeat timing only after the first successful
request. A dashboard entry that remains **Pending** is not proof the integration
works.

## 4. Incident ownership and first actions

| Monitor | Owner | First diagnostic action | Recovery action |
|---|---|---|---|
| API health | Founder/on-call | Check the latest Vercel function logs and Neon status | Restore DB connectivity or roll back the failing deployment, then confirm HTTP 200 |
| Homepage | Founder/on-call | Compare `/api/health` and the latest homepage deployment logs | Roll back/redeploy the affected release and confirm the keyword |
| Marketplace | Founder/on-call | Check marketplace function logs and database latency | Restore the failing query/dependency and confirm products render |
| Synthetic catalogue | Founder/on-call | Check the fixture shop/product is active, then inspect catalogue logs | Restore the fixture or catalogue release and confirm its marker |
| Sign-in | Founder/on-call | Check Clerk status and the sign-in route deployment logs | Restore Clerk configuration or roll back, then complete a sign-in smoke test |
| Any cron heartbeat | Founder/on-call | Open the matching Vercel cron invocation and function logs | Fix the dependency, rerun the same job once, and confirm Better Stack recovers |

Do not resolve an incident merely because the page loads locally. Recovery is
complete only when the production monitor or heartbeat is green again.

## 5. References

- [Better Stack cron and heartbeat monitor](https://betterstack.com/docs/uptime/cron-and-heartbeat-monitor/)
- [Better Stack API monitor](https://betterstack.com/docs/uptime/api-monitor/)
- [Better Stack confirmation and recovery periods](https://betterstack.com/docs/uptime/confirmation-and-recovery-period/)
