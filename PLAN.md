## TradeFeed Launch-Stability Hardening Plan

### Summary
- Current state is strong: `lint`, `tsc`, and `build` all pass locally.
- Focus selected: **Launch stability** for the next 2–4 weeks.
- Priority is to harden correctness, observability, and deploy safety before more features.

### Current Health Snapshot
- Build/testability: healthy build output with one platform warning about middleware deprecation.
- Repo hygiene: working tree is currently dirty with functional changes in progress.
- Gaps: no automated CI pipeline and no test suite found.
- Documentation drift exists between tracker claims and actual code.

### P0 (This Week) — Correctness + Platform Compatibility
1. Fix marketplace analytics identity mismatch.
- Issue: marketplace click tracking sends `shop.slug` where action/database semantics expect shop ID.
- Evidence:
  - [marketplace-product-card.tsx:31](/e:/apps/whatsapp-clone-market-place/components/marketplace/marketplace-product-card.tsx:31)
  - [marketplace-product-card.tsx:34](/e:/apps/whatsapp-clone-market-place/components/marketplace/marketplace-product-card.tsx:34)
  - [marketplace.ts:50](/e:/apps/whatsapp-clone-market-place/app/actions/marketplace.ts:50)
- Decision: add `shop.id` to marketplace query payload and use `shop.id` for analytics events; keep `shop.slug` only for routing.

2. Migrate from deprecated `middleware.ts` to `proxy.ts` (Next 16 guidance).
- Evidence: Next build warning about middleware convention deprecation.
- Decision: move logic as-is to `proxy.ts`, keep matcher and behavior unchanged.

3. Stabilize auth surface and remove dead legacy path.
- Issue: tracker says dev auth removed, but file remains.
- Evidence: [dev.ts](/e:/apps/whatsapp-clone-market-place/lib/auth/dev.ts)
- Decision: delete unused dev auth helper and update docs accordingly.

### P1 (Week 2) — Delivery Safety
1. Add CI pipeline (GitHub Actions).
- Gates: `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Trigger: PR + main branch push.

2. Add minimal automated tests.
- Unit:
  - `interleavePromotedProducts` behavior and de-duplication.
  - rate limiter window behavior.
  - WhatsApp message builder formatting.
- Integration:
  - marketplace filters/sort URL-param behavior.
  - product CRUD server actions with mocked auth boundary.

3. Add error telemetry.
- Add Sentry (or equivalent) for:
  - server action errors
  - webhook failures
  - middleware/proxy throttling anomalies

### P2 (Week 3–4) — Operational Hardening
1. Replace in-memory rate limiting with shared-store limiter (Upstash Redis).
- Keep same limits first; switch implementation only.
- Preserve response headers for observability.

2. Add data safety checks for production.
- Startup/env validation for required keys.
- Guardrails around payment webhook idempotency and signature failures.

3. Refresh project docs to match real state.
- Reconcile tracker dates/statuses and remove “done” claims that drifted from code.
- Keep one source of truth for launch checklist.

### Public API / Interface / Type Changes
1. `MarketplaceProduct` shape in data layer:
- Add `shop.id: string` to marketplace query result type.
- Keep existing `shop.slug` for URL generation.

2. `trackMarketplaceClickAction` and `trackPromotedClickAction` call sites:
- Continue same signatures, but callers pass `shop.id` (not slug).
- Optional enhancement: rename parameter names to `shopId` everywhere for semantic clarity.

3. Routing runtime hook:
- Replace exported default in `middleware.ts` with equivalent `proxy.ts` entrypoint per Next 16 recommendation.

### Tests and Validation Scenarios
1. Analytics correctness:
- Clicking marketplace product records event with real shop ID.
- Promoted click increments promotion clicks and logs event with same shop ID.

2. Proxy compatibility:
- Protected routes still require auth.
- Public routes remain public.
- Rate limits still return 429 with expected headers.

3. Regression checks:
- `npm run lint`, `npx tsc --noEmit`, `npm run build` clean in CI.
- Marketplace page behavior unchanged visually and functionally.

### Assumptions and Defaults
- Default horizon: launch-hardening first, not new feature expansion.
- Keep current UX and URL structure unchanged while fixing stability.
- Keep existing DB schema unless needed for analytics correctness; prefer minimal type/query changes first.
