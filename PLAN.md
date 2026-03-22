## TradeFeed Launch-Stability Hardening Plan

### Summary
- Current state is strong: `lint`, `tsc`, and `build` all pass locally.
- Focus selected: **Launch stability** for the next 2–4 weeks.
- Priority is to harden correctness, observability, and deploy safety before more features.

### Current Health Snapshot
- Build/testability: ✅ healthy — `tsc` and `build` both pass cleanly.
- CI pipeline: ✅ GitHub Actions workflow exists (`.github/workflows/ci.yml`).
- Proxy: ✅ migrated to `proxy.ts` (Next.js 16 convention, no deprecation warning).
- Repo hygiene: clean.

### P0 (This Week) — Correctness + Platform Compatibility
1. ✅ Fix marketplace analytics identity mismatch.
- Was: marketplace click tracking sent `shop.slug` where action/database expected shop ID.
- Status: **Already fixed** — `marketplace-product-card.tsx` now passes `product.shop.id`.

2. ✅ Migrate from deprecated `middleware.ts` to `proxy.ts` (Next 16 guidance).
- Renamed file, updated header comment. Build passes without deprecation warning.
- Commit: `591322a`

3. ✅ Stabilize auth surface and remove dead legacy path.
- Status: **Already done** — `lib/auth/dev.ts` no longer exists in repo.

### P1 (Week 2) — Delivery Safety
1. ✅ Add CI pipeline (GitHub Actions).
- Gates: `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Trigger: PR + main branch push.
- File: `.github/workflows/ci.yml`

2. Add minimal automated tests.
- Unit:
  - `interleavePromotedProducts` behavior and de-duplication.
  - rate limiter window behavior.
  - WhatsApp message builder formatting.
- Integration:
  - marketplace filters/sort URL-param behavior.
  - product CRUD server actions with mocked auth boundary.

3. ✅ Add error telemetry.
- Sentry `^10.40.0` installed and configured (`sentry.server.config.ts`, `sentry.edge.config.ts`).
- Source map upload gated on `SENTRY_AUTH_TOKEN`.

### P2 (Week 3–4) — Operational Hardening
1. ✅ Replace in-memory rate limiting with shared-store limiter (Upstash Redis).
- Implemented in `lib/rate-limit-upstash.ts`. Falls back to in-memory when env vars missing (local dev).
- `proxy.ts` imports from `@/lib/rate-limit-upstash`.

2. ✅ Add data safety checks for production.
- `lib/env.ts` validates all required env vars at import time via Zod.
- Crashes in production if required vars missing; warns in dev.

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
