# TradeFeed — Component Library (TF)

_Inventory of the `components/tf/*` system. New surfaces compose these; do not fork styles._

## Primitives

| Component | File | Notes |
|---|---|---|
| `TfButton` | `tf/button.tsx` | `primary · secondary · ghost · whatsapp · danger`; sizes `default · lg · sm · icon`; all ≥44px tap target; focus ring; motion-safe press scale. `asChild` for links. |
| `TfInput` | `tf/input.tsx` | 10px radius, raised surface, tf focus ring |
| `TfBadge` | `tf/badge.tsx` | Status pills — pending amber, confirmed emerald, neutral stone |
| `TfSkeleton` | `tf/skeleton.tsx` | Warm shimmer placeholder |
| `TfEmptyState` | `tf/empty-state.tsx` | Illustration + one-line + single primary action |
| `RatingChip` | `tf/rating-chip.tsx` | ★ score, stone text |
| `TrustBar` | `tf/trust-bar.tsx` | Quiet POPIA/PayFast/SSL row |
| `VerifiedSellerCard` | `tf/verified-seller-card.tsx` | Logo, name, tick, city, product count |
| `ProductCard` | `tf/product-card.tsx` | Image-first, price second-loudest, metadata quiet |
| `BottomNav` | `tf/bottom-nav.tsx` | 5-tab thumb bar, safe-area padded |
| `StickyCtaBar` | `tf/sticky-cta-bar.tsx` | Slide-up WhatsApp CTA |

## Motion helpers (`tf/motion/`)

`TfReveal` (scroll reveal + failsafe) · `TfCountUp` · `TfTilt` (pointer tilt) ·
`TfLiveTicker` · `TfMarquee` (pause on hover, reduced-motion off).

## Composed surfaces

- **Landing** `tf/landing/`: `TfLanding`, `TfLandingHeader` (scroll-aware glass), `PhoneMock`, `StickyCta`.
- **Marketplace** `tf/marketplace/`: `TfMarketplaceShell`, `TfFilterSheet`.
- **Storefront** `tf/storefront/`: `TfStorefront`, `TfProductGrid`, `TfReviews`.
- **Product** `tf/product/`: `TfProductPage`, `TfGallery` (swipe nudge), `TfOrderPanel`.
- **Checkout** `tf/checkout/`: `TfCartPanel` (slide-in-right).
- **Dashboard** `tf/dashboard/`: `TfDashboardHome`, `TfShareCatalogue`.

## Gaps to build (in roadmap order)

1. **`TfDashboardShell`** — header + nav + mobile tabs in TF language (P1 in audit).
   Interim: restyle `components/dashboard/*` in place with stone/emerald (done 2026-07-09,
   see implementation-log.md).
2. `TfTable` — dense order/product tables with status pills (Shopify-admin density).
3. `TfStat` — revenue/orders stat tile with display-face number.
4. `TfOnboardingStep` — centered card, progress dots, URL live-preview (create-shop).
5. `TfToast` — wrap sonner with tf tokens.
6. `TfChart` — recharts/sparkline theme (emerald mono + stone grid).

## Usage rules

- A page is "TF" only if its canvas is `bg-tf-surface` and it imports zero `blue-*`/`slate-*` classes.
- Compose; never copy variant strings out of `tfButtonVariants`.
- New tokens go in the `@theme` tf block in `globals.css`, then here, then get used.
