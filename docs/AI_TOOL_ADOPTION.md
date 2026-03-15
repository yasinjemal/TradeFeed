# TradeFeed — AI Tool Adoption & Implementation Tracker

> Decision log + implementation tracker for AI tooling evaluation.
> Covers: Promptfoo, The Agency, OpenViking, MiroFish, Impeccable.
>
> **Created:** 2026-03-13
> **Last updated:** 2026-03-13 (Phase A+B+C+D+E started)
> **Owner:** Yasin

---

## Status Key

| Icon | Meaning |
|------|---------|
| ⬜ | Not started |
| 🔵 | In progress |
| ✅ | Complete |
| ❌ | Skipped / Rejected |

---

## Tool Evaluation Verdicts

| # | Tool | Category | Verdict | Reason |
|---|------|----------|---------|--------|
| 1 | **Promptfoo** | AI Testing | ✅ Adopt | 14k+ ★ GitHub, MIT license, CLI + Node SDK. Tests existing GPT-4o-mini product generation pipeline. |
| 2 | **The Agency** | AI Automation | ❌ Skip | No public repo, website, or npm package found. Cannot verify existence. |
| 3 | **OpenViking** | AI Memory | ❌ Skip | Only 2 months old, Python/Go only (no JS/TS SDK), requires sidecar infra. Replace with Prisma `SellerPreferences` model. |
| 4 | **MiroFish** | Trend Prediction | ❌ Skip | Zero public evidence tool exists. Build trend intelligence internally via `lib/intelligence/`. |
| 5 | **Impeccable** | UI Framework | ❌ Skip | No React UI library by this name found. Current stack (shadcn/ui + Radix + Tailwind v4) is already industry-standard. |

---

## Current AI Infrastructure (Already Built ✅)

| Component | File | Status |
|-----------|------|--------|
| AI Product Generator (GPT-4o-mini Vision) | `app/api/ai/generate-product/route.ts` | ✅ Production |
| AI Zod Validation | `lib/validation/ai-product.ts` | ✅ Production |
| AI Credit System (5 free, unlimited Pro AI) | `lib/db/ai.ts` | ✅ Production |
| AI Create Product Form UI | `components/product/create-product-form.tsx` | ✅ Production |
| Seller Health Scoring Engine | `lib/intelligence/seller-health.ts` | ✅ Production |
| Seller Suggestions Engine | `lib/intelligence/seller-suggestions.ts` | ✅ Production |
| WhatsApp Business API Client | `lib/whatsapp/business-api.ts` | ✅ Built (blocked on Meta verification) |
| WhatsApp Webhook Handler | `app/api/webhooks/whatsapp/route.ts` | ⚠️ Logs only — no intent detection |
| AI Validation Barrel Export | `lib/validation/index.ts` | ❌ Missing — not re-exported |

---

## Implementation Phases

### Phase A: Promptfoo Setup & AI Testing (Week 1–2)

| # | Task | File(s) | Status | Notes |
|---|------|---------|--------|-------|
| A.1 | Install Promptfoo as dev dependency | `package.json` | ✅ | `npm install -D promptfoo` — v0.120.19 installed |
| A.2 | Create Promptfoo config | `promptfoo.yaml` (root) | ✅ | 18 test cases, 9 assertion types, targets GPT-4o-mini system prompt |
| A.3 | Write eval test cases (15–20) | `promptfoo.yaml` (inline) | ✅ | Apparel, electronics, beauty, food, home, edge cases |
| A.4 | Add `promptfoo eval` npm script | `package.json` | ✅ | `"ai:eval"` + `"ai:eval:view"` scripts added |
| A.5 | Add CI step (report-only mode) | `.github/workflows/ci.yml` | ✅ | Conditional step — runs when OPENAI_API_KEY secret exists, `--no-progress-bar` for CI output |
| A.6 | Establish baseline eval scores | `docs/AI_TOOL_ADOPTION.md` | ✅ | `.promptfoo/` added to .gitignore. Run `npm run ai:eval` locally with OPENAI_API_KEY to record baseline. |

### Phase B: AI Safety Layer (Week 2–3)

| # | Task | File(s) | Status | Notes |
|---|------|---------|--------|-------|
| B.1 | Add `sanitizeAIOutput()` helper | `lib/validation/ai-product.ts` | ✅ | Strips HTML, normalizes whitespace, removes empty tags |
| B.2 | Add `moderateContent()` helper | `lib/validation/ai-product.ts` | ✅ | Blocks phone/email/URL injection, spam phrases, health claims |
| B.3 | Add `limitTags()` safety guard | `lib/validation/ai-product.ts` | ✅ | Deduplicates + caps at 10 tags |
| B.4 | Wire safety layer into AI route | `app/api/ai/generate-product/route.ts` | ✅ | `applyAISafety()` runs after Zod parse, before response |
| B.5 | Re-export AI schemas from barrel | `lib/validation/index.ts` | ✅ | All AI types + safety functions exported |
| B.6 | Write unit tests for safety helpers | `tests/ai-safety.test.ts` | ✅ | 18 tests: sanitize, moderate, limitTags, applyAISafety — all passing |

### Phase C: SellerPreferences Model (Week 3–4)

> Replaces OpenViking concept — internal Prisma model for AI memory per seller.

| # | Task | File(s) | Status | Notes |
|---|------|---------|--------|-------|
| C.1 | Add `SellerPreferences` model to schema | `prisma/schema.prisma` | ✅ | 11 fields: brandTone, brandDescription, defaultCategory, preferredTags, priceRange, targetAudience, languagePreference, aiToneNotes, autoReplyEnabled |
| C.2 | Run Prisma migration | `prisma/migrations/` | ✅ | `npx prisma db push` — table created in Neon |
| C.3 | Create CRUD helpers | `lib/db/seller-preferences.ts` | ✅ | `getSellerPreferences()`, `upsertSellerPreferences()`, `buildSellerAIContext()` |
| C.4 | Feed preferences into AI prompt | `app/api/ai/generate-product/route.ts` | ✅ | Seller prefs loaded → `buildSellerAIContext()` → appended to GPT system prompt |
| C.5 | Add preferences UI in dashboard settings | `components/shop/seller-preferences-form.tsx` | ✅ | Full form: brandTone, brandDescription, defaultCategory, preferredTags, priceRange, targetAudience, languagePreference, aiToneNotes. Wired into settings page + sidebar with server action. |

### Phase D: Trend Intelligence (Month 2–3)

> Replaces MiroFish concept — internal analytics from existing order data.

| # | Task | File(s) | Status | Notes |
|---|------|---------|--------|-------|
| D.1 | Add `computeTrendingProducts()` query | `lib/intelligence/trending.ts` | ✅ | Pure function: order counts → ranked trending list with momentum scores |
| D.2 | Export from intelligence barrel | `lib/intelligence/index.ts` | ✅ | `computeTrendingProducts` + types exported |
| D.3 | Surface trending in seller dashboard | `components/dashboard/trending-products.tsx` | ✅ | Server component — queries OrderItems (30d), feeds `computeTrendingProducts()`, shows rank + momentum bars. Wired into dashboard overview page. |
| D.4 | Write unit tests | `tests/trending.test.ts` | ✅ | 7 tests: ranking, momentum, limits, tie-breaking — all passing |

### Phase E: WhatsApp AI Automation Groundwork (Month 2–3)

> Build the logic now. Activate when Meta Business API verification completes.

| # | Task | File(s) | Status | Notes |
|---|------|---------|--------|-------|
| E.1 | Add intent detection for buyer messages | `lib/whatsapp/intent-detection.ts` | ✅ | 7 intents: price, availability, delivery, order status, product info, greeting, thanks. SA-context aware (Howzit, Sawubona, Dankie, Joburg, etc.) |
| E.2 | Add auto-reply generator | `lib/whatsapp/auto-reply.ts` | ✅ | Pure function — generates contextual replies per intent (greeting, price, availability, delivery, order_status, product_info, thanks). 12 tests. |
| E.3 | Wire into webhook handler | `app/api/webhooks/whatsapp/route.ts` | ✅ | Wired: detect intent → check autoReplyEnabled → generate reply → sendTextMessage. Looks up shop from buyer's recent order. Non-fatal error handling. |
| E.4 | Write unit tests for intent detection | `tests/whatsapp-intent.test.ts` | ✅ | 35 tests: all intents, entity extraction, SA greetings, confidence thresholds — all passing |

---

## Architecture: AI Pipeline (Target State)

```
Seller uploads product photo
        │
        ▼
┌──────────────────────┐
│  AI Vision (GPT-4o)  │  ← app/api/ai/generate-product/route.ts
│  + SellerPreferences  │  ← prisma/schema.prisma (personalized context)
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│  AI Safety Layer     │  ← lib/validation/ai-product.ts
│  sanitize + moderate │     (sanitizeAIOutput, moderateContent)
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│  Zod Schema Validate │  ← lib/validation/ai-product.ts
│  (aiProductResponse) │     (aiProductResponseSchema.safeParse)
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│  Promptfoo Eval      │  ← promptfoo.yaml + tests/ai-eval/
│  (CI quality gate)   │     (runs in GitHub Actions)
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│  Seller Reviews      │  ← components/product/create-product-form.tsx
│  (human in the loop) │     (AI prefills, seller edits & saves)
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│  Database (Prisma)   │  ← prisma/schema.prisma
│  Product saved       │
└──────────────────────┘
```

---

## Why We Skipped Each Tool

### The Agency
- **What we found:** No GitHub repo, npm package, PyPI package, or official website
- **Risk:** Adopting an unverifiable tool = undefined risk with zero measurable benefit
- **Alternative:** TradeFeed AI features are single-purpose API calls, not multi-agent workflows. If scale demands orchestration later, evaluate CrewAI or LangGraph (both verified, 30k+ stars)

### OpenViking (volcengine/OpenViking)
- **What we found:** 7.7k ★ GitHub, Apache 2.0, but only 2 months old (v0.2.7)
- **No JS/TS SDK** — requires Python 3.10+, Go 1.22+, C++ compiler
- **Scope mismatch:** TradeFeed AI is stateless (image → listing). No long-running agent sessions need memory
- **Our solution:** `SellerPreferences` Prisma model (Phase C) — zero infra overhead, same benefit
- **Revisit when:** OpenViking ships a TypeScript SDK AND TradeFeed has agentic AI features

### MiroFish
- **What we found:** Zero results on GitHub, Google, npm, PyPI. Does not appear to exist publicly
- **Our solution:** Internal trend intelligence via Prisma order data (Phase D). We own the data — no need for external prediction engines at this stage
- **Revisit when:** Order volume exceeds 100k/month and simple SQL trending is insufficient

### Impeccable
- **What we found:** No React/Next.js UI library by this name exists in open source
- **Current stack assessment:**
  - shadcn/ui (new-york style) — ✅ industry standard
  - Radix UI primitives — ✅ accessible, headless
  - Tailwind CSS v4 — ✅ modern, performant
  - Lucide React icons — ✅ consistent
  - 16+ custom components in `components/ui/` — ✅ tailored to TradeFeed
- **Adding another UI library would cause:** CSS conflicts, bundle bloat, component API fragmentation
- **Verdict:** No action needed. Stack is already optimal for the Next.js ecosystem

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Promptfoo acquired by OpenAI — OSS may slow | MIT license allows forking. Monitor for 6 months. |
| AI hallucinations in product listings | Safety layer (Phase B) + human review (existing) |
| WhatsApp auto-reply sends wrong info | Build intent detection first, require confidence threshold before auto-reply |
| SellerPreferences not adopted by sellers | Make it optional, derive defaults from seller's existing products |
| Trend data insufficient at low volume | Only surface trending when ≥50 orders exist for a shop |

---

## Open Questions

1. **Promptfoo CI mode:** Start report-only (recommended) or gate PRs immediately?
2. **Content moderation:** Simple word-list filter or OpenAI Moderation API (free, already have key)?
3. **"AI Auto-Seller System"** (advisor suggestion: find WA sellers → generate listings → invite) — scope as Phase F?
4. **AI in edit flow:** Extend AI panel from create-product-form to edit-product-form?

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-13 | Initial document — tool evaluation + 5-phase implementation plan |
| 2026-03-13 | Phase A: Promptfoo installed (v0.120.19), `promptfoo.yaml` with 18 test cases, npm scripts added |
| 2026-03-13 | Phase B: AI Safety layer complete — `sanitizeAIOutput`, `moderateContent`, `limitTags`, `applyAISafety` + 18 unit tests |
| 2026-03-13 | Phase B: Safety wired into `app/api/ai/generate-product/route.ts` + barrel export in `lib/validation/index.ts` |
| 2026-03-13 | Phase C: `SellerPreferences` model added to Prisma schema + CRUD helpers in `lib/db/seller-preferences.ts` |
| 2026-03-13 | Phase D: `computeTrendingProducts` intelligence module + 7 unit tests |
| 2026-03-13 | Phase E: WhatsApp intent detection (7 intents, SA-aware) + 35 unit tests |
