---
name: tradefeed-mobile-ux
description: TradeFeed's mobile UX rules — thumb zones, touch targets, bottom navigation, offline support, data-cost sensitivity, and responsive patterns for South African Android users. Use this whenever building or changing ANY user-facing screen, nav, drawer, sheet, sticky bar, gesture, breakpoint, or image loading behavior — mobile is the primary device for this product, not an afterthought.
---

# TradeFeed Mobile UX

## Context that drives every decision

The median TradeFeed user is on a low-to-mid-range Android phone, on expensive prepaid mobile data, often on 3G/patchy LTE, in South Africa. Design for that device first; desktop is the adaptation. Practical consequences: small bundles (no casual dependencies), aggressive image optimization, offline tolerance, and 60fps only via compositor-friendly CSS (transforms/opacity).

## Navigation model (three bottom navs — pick the right one)

- `components/ui/global-bottom-nav.tsx` — global mobile tab bar (Home/Explore/Orders/Account); auto-hides on catalog/dashboard/admin/auth via `HIDDEN_PREFIXES`.
- `components/ui/bottom-nav.tsx` — storefront nav inside `CatalogAppShell` (Home/Marketplace/Orders/Cart drawer/Account); TF variant is `components/tf/bottom-nav.tsx`.
- `components/dashboard/mobile-bottom-nav.tsx` — seller dashboard tabs, plus a floating "Add product" FAB.

Rules: primary actions live in the bottom 40% of the screen (thumb zone). The storefront shell is `h-[100dvh]` flex column (sticky header / scrollable main / bottom nav) — use `dvh`, never `vh`, or Android URL bars break the layout. Account for bottom navs with safe-area padding; never let content hide behind fixed elements.

## Touch & interaction

- Targets ≥44×44px (`min-h-11` TF standard); pills/chips included.
- No hover-dependent functionality — hover is an enhancement, tap is the interaction.
- Sticky mobile buy bar on product pages (thumb-reachable CTA while reading).
- Drawers/sheets (cart, filters) over modals; they must trap focus, close on Escape/backdrop, and restore focus to the opener.
- Disable buttons during async work and show progress (prevents the double-tap double-order).

## Offline & flaky-network tolerance

- Storefronts cache shop + products to IndexedDB via `CatalogCacheManager` (`components/catalog/`), with `OfflineBanner` when disconnected — a buyer who opened a catalog link in a taxi can still browse it.
- PWA: manifest + service-worker registration in the root layout.
- Any new buyer surface should degrade gracefully offline (show cached data or a designed offline state, never a white screen).

## Data-cost discipline

- next/image with honest `sizes` per breakpoint (a 375px card must not download a 1200px image); AVIF/WebP.
- Uploads are client-compressed to 1200px JPEG 0.85 before hitting UploadThing.
- Debounce network chatter (search 400ms, autocomplete 200ms — existing marketplace values).
- Infinite scroll uses IntersectionObserver with generous rootMargin (600px) so loading starts before the user hits the bottom.
- Skeletons (`TfSkeleton` family) matching real layout — perceived speed matters more than actual on slow links.

## Responsive checkpoints

Test at **375px** (primary), 768px, 1024px, 1440px. No horizontal scroll ever; wide content scrolls inside its own container. Body text ≥16px (also prevents iOS zoom-on-focus). Filters: bottom sheet on mobile (`tf-filter-sheet.tsx`), sidebar on desktop.

## Native feel

- 150–300ms transitions, transforms/opacity only, `prefers-reduced-motion` respected (TF motion classes handle this — reuse them, don't write new keyframes).
- Scroll-aware glass header (`tf-header`) instead of a permanently opaque bar.
- WhatsApp deep links (`wa.me`) open in a new tab/app; keep the originating page intact so the buyer can come back.
