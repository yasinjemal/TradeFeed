# TradeFeed — Design Decisions Log

_Decisions with rationale. Newest first. Higgsfield job IDs reference the concept round of 2026-07-09._

## 2026-07-09 — Creative direction round (Higgsfield, 10 concepts)

**D1. The TF system is confirmed as the sole design language.** The exploration round
(warm-editorial hero `bcc5f116`, deep-emerald bento hero `5a64d946`) did not surface a
direction stronger than the existing TF tokens — it validated them. We finish TF; we do not
restart. _Consequence: all build work is convergence work._

**D2. Deep-emerald "band" sections are adopted** (from `5a64d946`, refined in `cb61637b`):
full-bleed `tf-deep #064e3b` sections with cream type and a **subtle SA-textile geometric
pattern** as an ownable brand motif — used for the landing final-CTA band and dashboard
"share catalogue" moments. Rejected from that concept: photo-collage bento hero (too busy,
fights product photography), glowing CTA (violates motion/elevation rules).

**D3. Dashboard target = concept `b9a4466d` (desktop) / `03acdfdf` (mobile).**
Stat tiles with display-face numbers + "vs yesterday" deltas; amber/emerald/stone status
pills; jobs-to-be-done nav (**Home · Products · Orders · Money · Grow**); zero emoji, zero
gradients. New components required: `TfStat`, `TfTable` (see component-library.md).

**D4. Marketplace card anatomy locked** (from `200abd2e` + spec sheet `2d90b0af`):
image-first → bold price (second-loudest) → verified tick + city metadata → amber stock chip
(only when scarce). Rejected: the concept's all-beige search zone (insufficient contrast);
its floating WhatsApp FAB colliding with the tab bar.

**D5. Product page giant-type treatment stands** (validated by `acdc9ce6` against the
shipped Clash Display title+price commit). Price stays one optical size below the concept's.

**D6. Illustration style approved** (`e8e64a8a`): warm stone linework, flat emerald/amber
fills, textile-pattern details, cream paper texture. Replaces ALL emoji-as-illustration in
empty states and nudge cards. Assets to be produced per empty-state as needed.

**D7. Onboarding pattern approved** (`7601abf9`): one question per screen, progress dots,
live URL preview in emerald, reassurance microcopy at the commitment point. Target for
`/create-shop` rebuild.

**D8. Token discipline over concept drift.** Concepts invented off-token colors
(`#004d40`); the system values (`#047857`, `#064e3b`, `#f59e0b`) always win over any
generated reference.

## 2026-07-09 — Refinement round verdicts

**D2a. Landing refinement `cb61637b` approved with one correction:** the deep-emerald band
with diamond textile pattern + cream illustration cards is the direction for the landing
mid-section, and the "Chat to Buy" product row works. The concept's **amber final CTA is
rejected** — amber is never a CTA (see brand-guidelines §2); final CTA stays emerald.

**D3a. Mobile dashboard `03acdfdf` confirmed as the reference** for `TfStat` (numeric delta
chips), the "Orders to confirm" row pattern (name · amount · amber Pending pill · emerald
Confirm), and the 5-tab Money-inclusive bottom nav. The protea line-art avatar placeholder
is a keeper detail for shops without logos.

## 2026-07-09 — Build order

**D9. First build: dashboard shell unification** (audit P1). Pure restyle of
`app/dashboard/[slug]/layout.tsx` + `components/dashboard/*` nav to warm stone/emerald.
Ships unflagged because dashboard sub-pages are already stone/emerald — the shell is the
outlier, not the pages.

**D10. Blockers to flipping `UI_REDESIGN` on permanently** (not design, but design-owned):
pricing single-source (audit P3), TfLanding i18n parity (P4), onboarding on-system (P2).

## Standing decisions (inherited, kept)

- Motion: "Counter-weight" spec (420/200/120ms, one easing, reduced-motion safe, 1.6s failsafe).
- WhatsApp green reserved exclusively for actions that open WhatsApp.
- 44px tap-target floor via TfButton.
- Warm stone neutrals; slate and blue banned outside admin.
