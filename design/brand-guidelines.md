# TradeFeed — Brand Guidelines (TF Design Language)

_The single design language for all surfaces. Source of truth for tokens: `app/globals.css`
(`@theme` block, `tf-*` namespace). If it isn't here, don't invent it — extend the tokens._

## 1. Brand idea

**"The upgrade from chaos to a real shop."**
TradeFeed makes an informal WhatsApp seller look — and feel — like an established business.
Every design choice must pass one test: *does this make a Jeppe Street wholesaler prouder to
share their link?*

Personality: **warm, grounded, quietly confident.** Never corporate-cold (no slate, no blue),
never toy-like (no emoji-as-UI, no bouncing).

## 2. Color

| Role | Token | Value | Use |
|---|---|---|---|
| Surface | `tf-surface` | `#faf8f4` | Page canvas — warm, never pure white pages |
| Raised | `tf-raised` | `#ffffff` | Cards, sheets, inputs |
| Ink | `tf-ink` | `#1a1a17` | Primary text |
| Primary | `tf-primary` | `#047857` | CTAs, links, active states |
| Primary hover | `tf-primary-hover` | `#065f46` | |
| Deep | `tf-deep` | `#064e3b` | Dark hero/footer sections, active press |
| Accent | `tf-accent` | `#f59e0b` | Sparingly: urgency chips, highlights (never CTAs) |
| WhatsApp | `whatsapp` | `#25D366` | ONLY on buttons that literally open WhatsApp |
| Verified | `tf-verified` / `-soft` | `#047857` / `#ecfdf5` | Trust marks |
| Error / Warning | `tf-error` / `tf-warning` | `#b91c1c` / `#b45309` | |
| Neutrals | `tf-stone-50…900` | warm stone scale | All greys. **Slate is banned.** |

Rules:
- One emerald family. `blue-*` classes are a lint smell anywhere outside admin (admin may
  keep red accents for its "danger zone" identity).
- Amber is seasoning, not a course: max one amber element per viewport.
- Gold/VIP shimmer utilities are deprecated — do not use in new work.

## 3. Typography

| Layer | Face | Token | Use |
|---|---|---|---|
| Hero | Clash Display | `font-tf-hero` | Landing headlines, product title+price, big numbers |
| Headings | General Sans | `font-tf-display` | Section titles, card headings |
| Body/UI | Inter | `--font-inter` | Everything else |

- Tracking tightens as size grows (`h1 -0.04em` … `h4 -0.015em`, already global).
- Fonts load via `<TfFonts/>`; never add another face. Data cost is a design constraint.
- Numbers that matter (price, revenue) get display treatment; labels stay small, stone-500.

## 4. Space, radius, elevation

- 8px rhythm; 4px only inside dense components.
- Radius: inputs/buttons `10px`, cards `16px` (`rounded-2xl`), sheets `24px` top.
- Shadows: `shadow-tf-sm` (rest) and `shadow-tf-md` (hover/raised) — warm-tinted, defined in
  tokens. Never Tailwind's cold default shadows, never colored glows.

## 5. Motion — "Counter-weight"

One easing `cubic-bezier(0.22,1,0.36,1)` (`--tf-ease`). Three durations: **420ms** entrances,
**200ms** hovers, **120ms** presses. Stagger 50–60ms, cap ~290ms.
- Transforms + opacity only. Never animate layout/size/blur.
- Everything gated behind `prefers-reduced-motion`; hidden-until-JS content must keep the
  1.6s auto-show failsafe (`tf-autoshow`).
- The only "bounce" in the system: one-time verified-tick `tf-pop`.

## 6. Voice

- Merchant language, second person, plain: "Share your catalogue", "3 orders to confirm".
- Rand amounts always formatted `R4,850` (en-ZA locale).
- Reassure at commitment points: "Free · no card needed · under 3 minutes".
- No exclamation stacking, no "🔥 You're growing!" hype — confidence is quiet.

## 7. Imagery & illustration

- Product photography is the hero; UI must flatter mediocre phone photos (warm surface,
  consistent crops, no harsh borders).
- Spot illustrations: warm stone linework + flat emerald/amber fills (see approved Higgsfield
  style sheet in design-decisions.md). One style; replaces all emoji empty-states.

## 8. Accessibility floor

- 44px minimum tap targets (TfButton enforces this — even `sm`).
- Visible `focus-visible` ring (`ring-tf-primary`) on every interactive element.
- Text contrast ≥ 4.5:1 on `tf-surface` (stone-500 is the lightest allowed body text).
- All motion reduced-motion safe; all images `alt`-ed; icons are decorative unless labeled.
