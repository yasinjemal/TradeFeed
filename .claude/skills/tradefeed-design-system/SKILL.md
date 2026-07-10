---
name: tradefeed-design-system
description: TradeFeed's visual design system — tokens, typography, spacing, components, icons, motion, dark mode, and the legacy-vs-TF dual-system rules. Use this whenever building or editing ANY UI in this repo (pages, components, styles, skeletons, empty states, animations, colors, fonts), reviewing UI code, or deciding which component/token to use — even if the request doesn't say "design system".
---

# TradeFeed Design System

## The one fact that governs everything

This repo has TWO design systems. Check which one you're in before writing a line of UI:

1. **TF system** (`components/tf/**`) — the canonical system being shipped. Warm trust-first palette, `tf-*` tokens, Clash Display/General Sans, CSS-only motion. All new buyer-facing UI is TF.
2. **Legacy system** (`components/landing`, `components/marketplace`, `components/catalog`, most of `components/dashboard`) — emerald/luxury styling, framer-motion, scheduled for deletion after the TF flip. Do not invest in legacy unless fixing a live bug.

The switch is `FEATURE_FLAGS.UI_REDESIGN` in `lib/config/feature-flags.ts` (build-time env `NEXT_PUBLIC_FF_UI_REDESIGN`) for BUYER surfaces, and `FEATURE_FLAGS.UI_REDESIGN_DASHBOARD` for SELLER surfaces (dashboard home, create-shop) — split so the buyer flip ships independently. Grep for the flag before editing a page — most pages branch on it and you must edit the correct branch.

## Tokens (source of truth: `app/globals.css`)

Tailwind v4 CSS-first config — there is **no tailwind.config file**. All tokens live in `app/globals.css`:

- **TF tokens** (`@theme` block, search `--color-tf-`): `tf-surface`, `tf-raised`, `tf-ink`, `tf-primary` (emerald #047857), `tf-primary-hover`, `tf-deep`, `tf-deepest`, `tf-accent` (amber), `tf-accent-ink/-soft`, `tf-verified/-soft`, `tf-success/warning/error/-soft`, `tf-stone-50…900`, `--shadow-tf-sm/md`, fonts `--font-tf-hero` (Clash Display) / `--font-tf-display` (General Sans).
- **Dark mode**: class strategy via `@custom-variant dark` + next-themes (`ThemeProvider` in app/layout.tsx; forced light while `UI_REDESIGN` is off so legacy prod is untouched; toggle = `TfThemeToggle`). TF dark values live in a `.dark { --color-tf-*: … }` block. Never hardcode hex colors in `components/tf/**` — a hardcoded `#047857` or `bg-white` breaks dark mode. Use `bg-tf-surface`, `text-tf-ink`, `accent-tf-primary`, etc. Known traps: `text-white` on `bg-tf-ink` must be `text-tf-surface`; `text-tf-deep` on `bg-tf-verified-soft` must be `text-tf-verified` (tf-deep/deepest stay dark by design — they're for permanently-dark hero sections).
- **CTA indirection**: TfButton `primary` paints with `--tf-cta`/`--tf-cta-hover`/`--tf-cta-text` (globals.css). Pro shop themes retint CTAs via `[data-shop-themed]` on the catalog content wrapper — shop colors tint interactive accents ONLY, never surfaces or body text.
- **Legacy/shadcn tokens**: standard shadcn oklch vars (`--background`, `--primary`, …) plus brand vars (`--color-whatsapp #25D366`).
- **Per-shop Pro themes**: `lib/config/themes.ts` + `buildThemeCssVars` inject `--shop-primary/--shop-accent/--shop-font` in `app/catalog/[slug]/layout.tsx`. Rule: shop theme vars tint **interactive accents only** (buttons, active pills) — never surfaces or body text. In dark mode, lift with `color-mix(in oklab, var(--shop-primary) 85%, white)`.

## Typography

- App-wide: **Inter** via next/font in `app/layout.tsx` (`--font-inter`).
- TF display faces: Clash Display (heroes) + General Sans (headings) loaded by `components/tf/tf-fonts.tsx`.
- Custom h1–h6 letter-spacing/line-height rules are in globals.css — don't fight them.
- Body text ≥16px on mobile; line-height 1.5–1.75.

## Components

- **shadcn/ui installed set is minimal**: button, input, label, card, textarea, form, badge (`components/ui/`). Button has custom sizes (`xs`, `icon-*`) — check before adding variants.
- **TF primitives** (reuse, never duplicate): `TfButton`, `TfSkeleton`/`TfProductCardSkeleton`/`TfSellerCardSkeleton` (`components/tf/skeleton.tsx`), `TfEmptyState` (`components/tf/empty-state.tsx`), `TfProductCard`, `TfBottomNav`, theme toggle. Export hub: `components/tf/index.ts`.
- **Legacy primitives** still shared app-wide: `EmptyState` + `illustrations.tsx` (11 hand-drawn SVGs), `TradeFeedLogo`, `SouthAfricanFlag`, `TrustBadge`, `CatalogAppShell`.
- **Icons: lucide-react only.** Never use emojis as UI icons. Fixed 24×24 viewBox sizing (`w-5 h-5` / `w-6 h-6`).

## Motion (TF "Counter-weight" system — CSS only)

Decision (locked): **no framer-motion in TF code.** The motion system is compositor-only CSS classes in globals.css driven by tiny JS primitives in `components/tf/motion/`:

- `tf-reveal` / `tf-stagger` — IntersectionObserver-triggered entrance (has a 1.6s auto-show failsafe).
- `tf-card-tactile`, `tf-pop`, `tf-slide-in-right/up`, `tf-presence`, `tf-header` (scroll-aware glass), `tf-marquee`, `tf-rail`, `tf-ambient`.
- Helpers: `TfReveal`, `TfCountUp`, `TfTilt`, `TfMarquee`, `TfLiveTicker`.

Rules: transforms + opacity only (never animate width/height/top), 150–300ms micro-interactions, everything behind `prefers-reduced-motion`. framer-motion exists only in legacy landing/marketplace and dies with them.

## States

Every route on the buyer path gets: a `loading.tsx` built from `TfSkeleton` primitives **matching the real layout** (no generic spinners), an `error.tsx` using `TfEmptyState` with `reset()` retry, and designed empty states with a primary action. Copy the pattern from `app/catalog/[slug]/loading.tsx`.

## Non-negotiables (from the ui-ux-pro-max audit rules)

- Touch targets ≥44px (`min-h-11` is the TF standard).
- `tf-stone-400` on `tf-surface` fails AA (~2.6:1) — decorative only; body copy ≥ `tf-stone-600`.
- `cursor-pointer` + visible hover feedback on every interactive element; hover must not shift layout.
- `focus-visible:ring-tf-primary` rings, both modes.
- next/image everywhere with correct `sizes`; never raw `<img>`.
- Same radius scale and shadow tokens everywhere — no ad-hoc `shadow-[…]`.
