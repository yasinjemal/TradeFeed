---
name: tradefeed-ai-features
description: TradeFeed's AI feature architecture — photo-to-listing generation, credits and plan gating, rate limits, translations, background removal, price suggestions, and prompt evals. Use this whenever building, changing, or debugging ANYTHING involving OpenAI calls, AI credits, the product wizard's AI path, listing generation, AI chat/sales features, or prompt changes — and before adding any new AI capability.
---

# TradeFeed AI Features

## Provider & architecture

All AI runs on **OpenAI** (`openai` SDK; vision features use gpt-4o-mini). AI logic lives in `lib/ai/*`; HTTP entry points in `app/api/ai/*`; credit accounting in `lib/db/ai.ts`. Every feature has a **mock fallback when `OPENAI_API_KEY` is unset** — keep that property when adding features so dev environments work without keys.

## The flagship: photo → listing

`app/api/ai/generate-product/route.ts`: seller uploads a product photo, vision model returns SEO name, 150–300 word description, category, tags, WhatsApp caption, SEO title/meta. Consumed by the product wizard (`components/product/product-wizard.tsx`), create form (`?ai=true`), and quick-sell flow. Output passes through `applyAISafety` (`lib/validation/ai-product.ts`) before touching the DB — never write raw model output to Prisma.

Supporting modules in `lib/ai/`: `analyze-product-image.ts`, `import-draft.ts` + `parse-text-listings.ts` (WhatsApp catalogue paste → structured listings), `price-suggestion.ts` (comparable-listing pricing, surfaced via `components/product/price-suggestion-hint.tsx`), `translate-listing.ts` (en/zu/xh/af/st, `LISTING_TRANSLATIONS` flag), `remove-background.ts` (`BG_REMOVAL` flag). WhatsApp AI sales assistant: `lib/whatsapp/ai-sales.ts` + `/dashboard/[slug]/conversations`.

## Credits, gating, limits (the business rules)

- Monthly AI generation allowance per plan — enforcement in `lib/db/ai.ts`, marketing numbers in `lib/billing/plans.ts` (Free 10/mo, Starter 25/mo, Pro & Pro AI unlimited). **These two files must agree** — the plans.ts header documents this contract.
- Pro AI-exclusive features: catalogue import, background removal, listing translations (feature-flagged AND plan-gated — check both).
- Abuse control: Upstash rate limiting (e.g., 50 generations/day) on top of credits.
- Personalization: generation prompts read `SellerPreferences` (tone, language) — respect them in any new prompt.
- Running out of credits is an upgrade moment: always render the upgrade path, never a bare error (see tradefeed-growth-cro).

## Prompt changes

- Prompt evals exist: **promptfoo** (`npm run ai:eval`, config in the repo). Any prompt change should run the evals; add cases for new behaviors.
- Multilingual output is a requirement, not a nicety — sellers operate in 5 languages.
- Model responses must be schema-validated (Zod) with explicit fallbacks; a malformed model response must degrade to the manual form, never block product creation.

## UX rules for AI surfaces

- AI is an accelerator, never a gate: every AI path has a manual escape hatch (the wizard falls back to manual entry).
- Show generation progress honestly (multi-second vision calls need skeleton/streaming states, disabled submit, and cancellation).
- Generated content is **editable before saving** — sellers must be able to correct the model.
- Label AI output as AI-generated in seller-facing UI; credit counters stay visible near the trigger button.

## Adding a new AI feature — checklist

1. Module in `lib/ai/` with mock fallback; Zod-validate the response.
2. Credit/plan gate decision (which plans? does it consume credits?) wired through `lib/db/ai.ts`.
3. Upstash rate limit.
4. Feature flag in `lib/config/feature-flags.ts` for rollout.
5. promptfoo eval cases.
6. Manual fallback path + upgrade-nudge on gate.
