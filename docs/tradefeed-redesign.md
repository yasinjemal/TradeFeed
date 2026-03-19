# TradeFeed Platform Redesign — Master Document

**Version**: 1.0  
**Date**: 2026-03-18  
**Author**: Product Team  
**Status**: Active — Updated continuously

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current Problems (Audit)](#2-current-problems-audit)
3. [Design System](#3-design-system)
4. [Page Breakdown (Roadmap)](#4-page-breakdown-roadmap)
5. [Component System](#5-component-system)
6. [Trust System](#6-trust-system)
7. [UX Improvements](#7-ux-improvements)
8. [Progress Tracker](#8-progress-tracker)

---

## 1. Project Overview

### What TradeFeed Is

TradeFeed is a **WhatsApp-native multi-tenant marketplace** built for South African small businesses. It enables sellers — from Jeppe Street wholesalers to home-based resellers — to publish a professional online catalog and receive structured orders via WhatsApp, without any app download or tech expertise required.

**Core value proposition**: "Shopify for WhatsApp sellers in Africa."

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL + Prisma ORM |
| Auth | Clerk |
| Payments | PayFast |
| Storage | Uploadthing (CDN) |
| AI | OpenAI GPT-4o-mini |
| i18n | next-intl (en, zu, xh, af, st) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Monitoring | Sentry + Vercel Analytics |

### Main Goal

Build a **trustworthy, professional marketplace** that:
- Gives sellers a credible storefront they are proud to share
- Gives buyers confidence that they are dealing with verified, active sellers
- Generates sustainable platform revenue through subscriptions and promoted listings

### Target Users

| Persona | Description |
|---------|-------------|
| **Street/Wholesale Seller** | Jeppe Street or township-based sellers with many products but no digital presence |
| **Home-Based Reseller** | Selling clothing, beauty, or food from home via WhatsApp groups |
| **Boutique Shop Owner** | Small physical store extending their reach online |
| **Marketplace Buyer** | South African consumers browsing for deals, discovering local sellers |

---

## 2. Current Problems (Audit)

### 2.1 UI Issues

| Issue | Severity | Location |
|-------|----------|----------|
| Inconsistent color scheme — dark (`stone-950`) on some pages, light (`white`) on others with no clear system | High | App-wide |
| Product cards use `aspect-[4/5]` but many product images are square — causes awkward cropping | Medium | Marketplace product card |
| Marketplace filter sidebar has no visual separator between filter groups | Medium | Filter sidebar |
| Missing skeleton/loading states on marketplace search results | Medium | Marketplace page |
| Typography scale inconsistent — some pages use `text-2xl font-extrabold`, others `text-3xl font-bold` | Medium | App-wide |
| No favicon or OpenGraph image coverage across all pages | Low | Non-landing pages |
| Promoted products have no visual distinction beyond a small "Promoted" tag | Medium | Marketplace page |
| Mobile navigation (bottom nav) overlaps with page content on some screens | High | Mobile viewport |
| Seller shop page (`/catalog/[slug]`) has no consistent hero/header design | Medium | Catalog pages |

### 2.2 UX Friction

| Issue | Severity | Location |
|-------|----------|----------|
| Shop creation form is a long single-page form — high abandonment risk | High | `/create-shop` |
| No guided onboarding wizard after shop creation — sellers are left to figure it out | High | Post-signup flow |
| Product creation requires all fields upfront — no draft / quick-add flow | High | Add product page |
| Filter state is lost on browser back navigation | Medium | Marketplace |
| No breadcrumb navigation on product pages | Medium | Product pages |
| Cart is single-seller only (per-shop) — not clearly communicated to buyers | High | Cart/checkout |
| Order confirmation page has no visual celebration or next-step guidance | Medium | Order confirmation |
| No empty state UI when search returns zero results | High | Marketplace search |
| Buyers cannot save/wishlist products across sessions | Medium | Marketplace |
| Dashboard analytics data loading is slow with no progressive rendering | Medium | Seller dashboard |

### 2.3 Trust Issues

| Issue | Severity | Location |
|-------|----------|----------|
| No visible seller verification badge system on marketplace | High | Marketplace + product pages |
| Review count shown but no breakdown of star ratings (no histogram) | Medium | Product/seller pages |
| Seller "last active" or response time signals not visible to buyers | High | Seller shop pages |
| No buyer protection messaging anywhere in the purchase flow | High | Product/checkout pages |
| Promoted listings not clearly distinguished from organic — blurs trust | Medium | Marketplace |
| No "verified phone number" or "verified business" indicators | High | Seller profiles |
| Seller revenue and GMV metrics in dashboard are not visible to buyers | Low | Internal only |

### 2.4 Missing Features

| Feature | Priority |
|---------|----------|
| Buyer accounts (login, order history, wishlists) | High |
| Verified seller badge tiers (Bronze/Silver/Gold) | High |
| Recently viewed products (persistent) | Medium |
| Product comparison tool | Low |
| In-app messaging (not just WhatsApp redirect) | Medium |
| Price drop alerts | Low |
| Multi-seller cart | High |
| Location-based discovery (`/city/johannesburg`) | Medium |
| Flash sales / time-limited offers | Medium |
| Affiliate/referral program | Medium |

---

## 3. Design System

### 3.1 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `brand-green` | `#25D366` | WhatsApp CTA buttons, success states |
| `brand-emerald` | `#059669` | Primary actions, verified badges, highlights |
| `brand-emerald-light` | `#34d399` | Hover states, glow effects |
| `brand-purple` | `#7c3aed` | Pro/premium features, billing |
| `brand-purple-light` | `#a78bfa` | Purple hover states |
| `brand-dark` | `#0c0a09` | Dark backgrounds (dashboard, orders, tracking) |
| `brand-dark-surface` | `#1c1917` | Dark surface/card backgrounds |
| `brand-dark-card` | `#292524` | Dark card backgrounds |
| `brand-muted` | `#78716c` | Secondary text on dark backgrounds |
| `brand-text` | `#fafaf9` | Primary text on dark backgrounds |
| `brand-text-secondary` | `#a8a29e` | Secondary text on dark backgrounds |
| `slate-50` | `#f8fafc` | Light page backgrounds |
| `slate-200` | `#e2e8f0` | Light borders |
| `slate-900` | `#0f172a` | Primary text on light backgrounds |

**Theme rule**: 
- **Buyer-facing pages** (marketplace, product pages, shop pages): **Light theme** — white backgrounds, slate text
- **Seller-facing pages** (dashboard, orders, tracking): **Dark theme** — `stone-950` backgrounds, stone text  
- **Landing/marketing pages**: Light with dark hero sections

### 3.2 Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Page titles (`h1`) | Inter | 800 (extrabold) | `text-3xl` / `text-4xl` on desktop |
| Section headings (`h2`) | Inter | 700 (bold) | `text-2xl` |
| Card titles | Inter | 600 (semibold) | `text-base` / `text-lg` |
| Body text | Inter | 400 (normal) | `text-sm` / `text-base` |
| Labels / captions | Inter | 500 (medium) | `text-xs` / `text-sm` |
| Price display | Inter | 700 (bold) | `text-lg` / `text-xl` |

Font: **Inter** (current, via `var(--font-inter)`) — keep as primary typeface.

### 3.3 Spacing System

Follow Tailwind's default scale. Key spacing guidelines:
- **Page padding**: `px-4 sm:px-6 lg:px-8`
- **Section vertical spacing**: `py-16` (mobile) → `py-24` (desktop)
- **Card internal padding**: `p-4` (compact) / `p-5` / `p-6` (standard)
- **Grid gaps**: `gap-4` (mobile) → `gap-6` (desktop)
- **Max content width**: `max-w-7xl mx-auto` (full pages) / `max-w-3xl mx-auto` (focused flows)

### 3.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-lg` | 8px | Inputs, small cards |
| `rounded-xl` | 12px | Standard cards, buttons |
| `rounded-2xl` | 16px | Product cards, modals |
| `rounded-3xl` | 24px | Hero elements, large cards |
| `rounded-full` | 9999px | Badges, avatars, pills |

### 3.5 Component Styles

#### Buttons
```
Primary (CTA):       bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-5 py-2.5 font-semibold
Secondary:           bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-5 py-2.5
WhatsApp:            bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl px-5 py-2.5
Destructive:         bg-red-600 hover:bg-red-500 text-white rounded-xl px-5 py-2.5
Ghost:               text-slate-600 hover:bg-slate-100 rounded-xl px-4 py-2
```

#### Cards
```
Light card:          bg-white border border-slate-200/80 rounded-2xl shadow-sm
Dark card:           bg-stone-900 border border-stone-800/50 rounded-2xl
Elevated card:       bg-white border border-slate-200/80 rounded-2xl shadow-md hover:shadow-lg
```

#### Badges
```
Verified:            bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5 text-xs font-medium
Promoted:            bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5 text-xs font-medium
New:                 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 text-xs font-medium
Pro:                 bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2.5 py-0.5 text-xs font-medium
```

### 3.6 Shadow System

```
--shadow-sm:   0 1px 2px 0 rgb(0 0 0 / 0.05)              — subtle card lift
--shadow-md:   0 4px 6px -1px rgb(0 0 0 / 0.1)             — hover states
--shadow-lg:   0 10px 15px -3px rgb(0 0 0 / 0.15)          — elevated modals
--shadow-xl:   0 20px 25px -5px rgb(0 0 0 / 0.15)          — hero elements
--shadow-glow-emerald: 0 0 20px rgb(16 185 129 / 0.15)     — verified/primary glow
--shadow-glow-purple:  0 0 20px rgb(124 58 237 / 0.15)     — pro/premium glow
```

---

## 4. Page Breakdown (Roadmap)

### 4.1 Homepage (`/`)

| | |
|--|--|
| **Status** | Not Started |
| **Priority** | High |
| **Description** | Marketing landing page targeting South African sellers. Acts as primary conversion funnel from organic and paid traffic. |

**Key improvements needed:**
- Hero section needs a stronger visual — real product/seller photo instead of abstract mesh
- Pricing section: add an annual billing toggle (save 20%)
- Social proof section: add real seller testimonials with photos and province tags
- Add a "Featured Shops" section with 3–4 real seller previews to build marketplace credibility
- Footer: add links to all 9 province landing pages for local SEO
- Performance: lazy-load sections below the fold
- Add a persistent mobile sticky CTA bar for conversion on mobile

---

### 4.2 Marketplace (`/marketplace`)

| | |
|--|--|
| **Status** | Completed |
| **Priority** | High |
| **Description** | The core product discovery engine. Where buyers browse, search, and filter products across all sellers. |

**Key improvements needed:**
- Search bar: add autocomplete/suggestions powered by recent searches and trending products
- Filter sidebar: redesign with collapsible sections and clear visual hierarchy
- Product grid: standardize `aspect-square` for all product card images
- Promoted products: redesign promotion badge to be visually distinct but not spammy
- Add "No results" empty state with search suggestions
- Add "Trending this week" horizontal scroller above main grid
- Add social proof signals: "X sellers • Y products" live counter in header
- Improve mobile filter experience — fix bottom sheet filter modal
- Category bar: make horizontally scrollable on mobile with better visual indicators
- Province filter: add map-based or icon-based province selector
- Add "Recently Viewed" shelf for returning visitors
- Add infinite scroll or pagination with visible page count

#### Implementation Notes (Marketplace)

**Component breakdown**:
- `MarketplaceShell` remains the page orchestrator for header, trends, filters, and product grid composition
- `SearchBar` will be extracted from the shell into a reusable marketplace search component with suggestion, recent-search, and trust copy support
- `MarketplaceFilterSidebar` will be upgraded to collapsible filter groups with applied-filter chips and clearer mobile parity with the sheet variant
- `MarketplaceProductCard` will be redesigned around trust-first commerce metadata: verified badge, rating, seller, province, pricing, promoted state, and activity indicators
- `EmptyState` will provide a reusable no-results experience for marketplace search outcomes
- `TrustBadge` will provide the first shared trust primitive for verified, promoted, and response-time states

**Layout structure**:
- Replace the current dark hero treatment with a light, trust-first marketplace header
- Keep category discovery near the top, followed by search and applied filters
- Keep trending content above the main results when there is no active search/filter state
- Use a two-column desktop layout: left filter rail, right results stack
- Preserve a mobile-first flow with sticky search/filter controls and bottom-sheet filtering

**Data flow**:
- Continue using the existing marketplace page loaders in `app/marketplace/*` routes to fetch products, promoted listings, categories, trending products, and featured shops on the server
- Pass the current query parameters into the extracted search and filter components so URL state remains the source of truth
- Derive trust and activity display from existing product/shop metadata already returned by marketplace queries
- Use loading boundaries for skeleton states and conditional empty states when result sets are empty

**What will be created**:
- `components/marketplace/search-bar.tsx`
- `components/ui/trust-badge.tsx`

**What will be updated**:
- `components/marketplace/marketplace-shell.tsx`
- `components/marketplace/marketplace-product-card.tsx`
- `components/marketplace/marketplace-filter-sidebar.tsx`
- `components/marketplace/marketplace-filter-sheet.tsx`
- `components/ui/empty-state.tsx`
- `app/marketplace/loading.tsx`

**What was implemented**:
- Replaced the marketplace hero with a light, trust-first header focused on seller verification, buyer protection, and live marketplace activity
- Extracted the marketplace search experience into `components/marketplace/search-bar.tsx` with autocomplete, recent searches, and trending query shortcuts
- Redesigned `MarketplaceProductCard` around square imagery, clearer pricing hierarchy, seller identity, location, rating, verification, promotion, and activity metadata
- Rebuilt desktop and mobile filtering into clearer category, location, price, and trust groupings with improved chips and bottom-sheet behavior on mobile
- Added a stronger no-results experience using the shared `EmptyState` component with suggested searches
- Updated marketplace loading states to use product skeleton cards and header/layout-aware placeholders
- Added the initial `TrustBadge` shared component and used it across marketplace discovery surfaces

**What remains**:
- Add map/icon-based province selection instead of the current select input
- Add a persistent recently viewed shelf for returning visitors
- Add explicit page-count pagination or richer infinite-scroll progress messaging
- Broaden trust signals beyond marketplace cards into full seller response-time and last-active indicators once backend support is wired

**Known limitations**:
- Recent searches are stored locally in the browser and do not sync across devices or sessions for signed-in users
- Marketplace activity signals in the header remain heuristic summaries derived from marketplace totals, not real-time Redis-backed counters
- Mobile filter category buttons currently prioritize the most relevant top categories; deeper category discovery still relies on the horizontal category bar and route pages

---

### 4.3 Product Page (`/catalog/[slug]/products/[productSlug]`)

| | |
|--|--|
| **Status** | ✅ Completed |
| **Priority** | High |
| **Description** | Individual product detail page. Primary intent-to-buy moment for marketplace buyers. |

**Key improvements needed:**
- Add breadcrumb navigation: Marketplace → Category → Product name
- Image gallery: add thumbnail strip with fullscreen zoom
- Add "Seller Info" card with verification badge, rating, response time, and province
- Add buyer protection message: "Order via WhatsApp — seller verified by TradeFeed"
- Add "Similar Products" section (same category, different sellers)
- Add "More from this seller" horizontal section
- Add structured data: Product JSON-LD schema (price, availability, seller)
- Show review count with star breakdown histogram
- Add WhatsApp CTA with urgency signal: "X people viewed this today"
- Show stock status prominently (In Stock / Low Stock / Sold Out)

#### Implementation Notes (Product Page)

**Status: COMPLETED**

**What was implemented**:
- `components/catalog/product-breadcrumb.tsx` — Breadcrumb nav: Marketplace → Category → Product Name
- `components/catalog/seller-info-card.tsx` — Shop name, logo, Pro badge, verified/response-time badges, rating/products/completed stats, location, member since, review count, View Shop CTA
- `components/catalog/trust-messaging.tsx` — Buyer protection block with 4 trust signals (verified seller, WhatsApp ordering, real contact details, order reference)
- `components/catalog/similar-products.tsx` — Horizontal scroll cards from same category by other sellers, verified badges, price, shop name
- `components/catalog/more-from-seller.tsx` — Responsive grid (2→3→4 cols) of other products from same shop
- `lib/db/catalog.ts` — Added `getSimilarProducts(categoryId, excludeShopId, excludeProductId)` and `getMoreFromSeller(shopId, excludeProductId)` queries

**Layout changes**:
- Two-column desktop layout (gallery 7/12 left, info 5/12 right) with single-column mobile
- Container upgraded from max-w-3xl to max-w-6xl
- Gallery sticky on desktop for scroll
- Stone-themed colors migrated to slate (slate-900 text, slate-200 borders, emerald accents)
- Seller Info Card and Trust Messaging sit in right column below product info
- Full-width sections below: Reviews → Recently Viewed → Similar Products → More from Seller → Viral CTAs (now side-by-side grid)
- Loading skeleton updated to match new two-column layout

**Preserved existing functionality**:
- `AddToCart` with wholesale/retail toggle, size/color selection, sticky mobile bar
- `ShareProduct` (WhatsApp/Facebook/copy/native)
- `RestockAlert` for out-of-stock products
- `ProductReviews` with star distribution bars
- `RecentlyViewedTracker` + `RecentlyViewedStrip`
- Wholesale RFQ button for bulk orders
- Full JSON-LD schema and SEO metadata
- Viral CTAs (Start Your Shop + AI advertising)

**What was NOT changed (out of scope)**:
- ProductImageGallery fullscreen zoom modal (existing component works well, enhancement deferred)
- "X people viewed this today" urgency signal (requires real-time view tracking, separate feature)
- Stepped wizard/Quick Sell for add product page (separate item 4.4)

---

### 4.4 Add Product Page (`/dashboard/[slug]/products/add`)

| | |
|--|--|
| **Status** | Not Started |
| **Priority** | Medium |
| **Description** | Seller's interface for creating a new product listing. First key moment of product adoption. |

**Key improvements needed:**
- Redesign as a **stepped wizard** (not a single long form): Step 1 → Photo, Step 2 → Name & Price, Step 3 → Details & Category
- Add AI-assisted description generation button (already backed by GPT-4o-mini)
- Photo upload: drag-and-drop with preview grid; accept up to 6 photos
- Show a live preview of the product card as seller fills in details
- Add a "Quick Sell" shortcut (name + price + photo only — fill the rest later)
- Listing quality score widget: show real-time score as fields are completed
- Add inline help tooltips for each field explaining what buyers see

---

### 4.5 Seller Dashboard (`/dashboard/[slug]`)

| | |
|--|--|
| **Status** | Not Started |
| **Priority** | High |
| **Description** | Central command center for sellers. Where they manage orders, products, analytics, and shop settings. |

**Key improvements needed:**
- Dashboard home: redesign as a **Today at a glance** card grid — orders pending, views today, revenue this month
- Orders section: add visual status pipeline (Pending → Confirmed → Shipped → Delivered) with one-click status update
- Analytics: add sparkline charts for 7-day revenue trend, add top-performing products by views and orders
- Product list: add bulk actions (archive, discount, promote multiple products at once)
- Onboarding checklist widget: show progress for new sellers (add 5 products, get first order, etc.)
- Settings: redesign sidebar navigation with clear sections (Shop, Products, Orders, Billing, Account)
- Add "Shop Health Score" card — overall rating based on reviews, response rate, order completion rate
- Mobile: ensure full dashboard functionality on mobile (sellers often access from phones)

---

### 4.6 Seller Shop Page (`/catalog/[slug]`)

| | |
|--|--|
| **Status** | ✅ Completed |
| **Priority** | High |
| **Description** | Public-facing seller storefront. The URL sellers share with customers on WhatsApp. Key trust and conversion surface. |

**Key improvements needed:**
- Add a hero banner section: shop cover photo, name, tagline, province badge, WhatsApp button
- Show seller verification status prominently in the hero
- Add seller stats bar: "X products • Y reviews • Active since [date]"
- Product grid: use consistent card design matching marketplace
- Add category filter tabs at top of product grid
- Search within shop: allow buyers to search just this seller's catalog
- Show seller's response time badge ("Usually replies in 1 hour")
- Add "About this seller" section with seller story/bio
- Add reviews section at bottom of page
- Mobile: sticky "Contact Seller" bottom bar on mobile

**Implementation Notes:**
- Created `components/catalog/shop-hero.tsx` — Trust-first hero: banner, avatar (rounded-2xl), name + verified/PRO/tier badges, description (2-line clamp), location, stats row (products, fulfilled, rating, member since), prominent WhatsApp CTA, "Open now" live indicator
- Created `components/catalog/shop-about-section.tsx` — Always-visible about section: seller bio, photo gallery with lightbox, business hours card, location card with Google Maps link, social links (Instagram, Facebook, TikTok, Website, WhatsApp Group)
- Redesigned `app/catalog/[slug]/page.tsx` — New layout order: Hero → Search+Filter+Grid → Drops → Combos → About → Recently Viewed → CTAs → Browse → Cache. stone→slate/white/emerald theme migration. Removed old collapsible ShopProfile import, replaced with ShopHero (above fold) + ShopAboutSection (below products). Streamlined recruitment CTAs (removed AI showcase, kept shop CTA).
- Updated `app/catalog/[slug]/loading.tsx` — Skeleton now matches hero+grid layout with banner shimmer, avatar, stats row, search bar, and 6-card product grid. stone→slate theme.

---

### 4.7 Auth Pages (`/sign-in`, `/sign-up`)

| | |
|--|--|
| **Status** | Not Started |
| **Priority** | Medium |
| **Description** | Authentication flow for new sellers and returning users. First impression for new signups. |

**Key improvements needed:**
- Redesign wrapper layout: add TradeFeed branding, social proof snippet (e.g., "Join 100+ sellers"), and a product preview on the right panel (desktop)
- Sign-up page: add a value promise above the form ("Free forever · No credit card · Up in 2 minutes")
- Add Google OAuth as a signup option (reduce friction significantly)
- Post-signup redirect: take new users directly to the onboarding wizard, not a blank dashboard
- Error states: improve error messages to be human-readable (not "Something went wrong")
- Mobile: ensure the auth form fills the viewport properly without overflow

---

### 4.8 Profile Page (`/dashboard/[slug]/settings`)

| | |
|--|--|
| **Status** | Not Started |
| **Priority** | Low |
| **Description** | Seller's account and shop settings page. Where they configure their public profile. |

**Key improvements needed:**
- Redesign as a tabbed layout: General / Shop Branding / Payment / Notifications / Danger Zone
- Add profile completeness indicator (percentage + list of what's missing)
- Allow uploading a profile/avatar photo
- Add social links section (Instagram, Facebook, TikTok)
- Add Notification preferences (email / WhatsApp alerts for new orders)
- Danger Zone: add confirmation flow for account deletion and data export (POPIA compliance)

---

## 5. Component System

### 5.1 Reusable Component Inventory

#### `ProductCard`
**Location**: `components/marketplace/marketplace-product-card.tsx`  
**Used on**: Marketplace, Seller shop page, Product recommendations  
**Improvements needed**:
- Standardize image aspect ratio to `aspect-square` (currently `aspect-[4/5]`)
- Add skeleton loading state
- Add wishlist/save button (heart icon) in top-right of image
- Promoted badge needs higher visual prominence
- Add "verified seller" micro-badge under seller name

#### `SellerCard`
**Location**: To be created — `components/marketplace/seller-card.tsx`  
**Used on**: Marketplace featured sellers carousel, search results  
**Spec**:
- Shop cover photo / avatar
- Shop name + verified badge
- Province + category
- Star rating + review count
- Product count + "View Shop" CTA
- Response time indicator

#### `CategoryCard`
**Location**: `components/marketplace/category-bar.tsx` (partial)  
**Used on**: Marketplace category bar, homepage  
**Improvements needed**:
- Add category icon/emoji
- Active state styling (currently no visual feedback)
- Better mobile scroll behavior

#### `FilterSidebar`
**Location**: `components/marketplace/marketplace-filter-sidebar.tsx`  
**Improvements needed**:
- Collapsible sections with animated expand/collapse
- Applied filters as removable chips at the top
- Clear All button more prominent
- Price range slider instead of min/max inputs
- Better mobile bottom sheet version

#### `TrustBadge`
**Location**: To be created — `components/ui/trust-badge.tsx`  
**Used on**: Product pages, Seller shop pages, Marketplace product cards  
**Variants**:
- `verified` — Verified Seller (emerald)
- `response-time` — Fast Responder (blue)
- `top-seller` — Top Seller (gold)
- `new-seller` — New Seller (slate)
- `promoted` — Promoted Listing (amber)

#### `SearchBar`
**Location**: Inside `marketplace-shell.tsx` (should be extracted)  
**Target location**: `components/marketplace/search-bar.tsx`  
**Improvements needed**:
- Extract into standalone reusable component
- Add debounced autocomplete suggestions dropdown
- Add recent searches stored in localStorage
- Add trending searches section
- Mobile: expand to full-width on focus

#### `EmptyState`
**Location**: `components/ui/empty-state.tsx`  
**Used on**: No search results, empty orders list, empty product list  
**Improvements needed**:
- Add contextual illustrations per page type
- Add actionable CTA button per context
- Add suggested search terms for marketplace empty state

#### `OnboardingChecklist`
**Location**: To be created — `components/dashboard/onboarding-checklist.tsx`  
**Used on**: Seller dashboard (first 30 days)  
**Spec**:
- Progress bar (X/5 tasks complete)
- Task list: Add first product, Complete shop profile, Share catalog link, Get first order, Enable WhatsApp notifications
- Dismissable after completion
- Celebratory animation on completion

---

## 6. Trust System

### 6.1 Seller Verification Tiers

| Tier | Name | Requirements | Badge Color |
|------|------|-------------|-------------|
| 0 | Unverified | New signup | None |
| 1 | Bronze | Phone verified + 1+ products | Bronze ring |
| 2 | Silver | 10+ completed orders + email verified | Silver ring |
| 3 | Gold | 50+ orders + 4.0+ average rating + 6+ months active | Gold ring |
| 4 | Verified Business | Business registration number provided + Gold | Emerald checkmark |

**Implementation notes**:
- Verification tier computed automatically from existing data (orders, ratings, signup date)
- Display tier badge on: marketplace cards, product pages, seller shop pages
- Sellers can view their current tier and what's needed to advance in their dashboard
- Consider a "Verified Business" manual review process for formal businesses

### 6.2 Ratings & Reviews

**Current state**: Reviews exist in schema but display is basic (star average only).

**Improvements**:
- Show star breakdown histogram (5★ X%, 4★ Y%, etc.)
- Show most recent reviews on product and seller pages
- Allow buyers to leave reviews after order completion (email/WhatsApp prompt)
- Flag suspicious reviews (all 5-star from same IP range) — admin moderation queue
- Seller can respond to reviews (like TripAdvisor)
- "Helpful" voting on reviews

### 6.3 Activity Indicators

| Signal | Where Shown | Implementation |
|--------|-------------|----------------|
| "Last active X hours ago" | Seller shop page | Track last dashboard login timestamp |
| "Usually replies within X" | Seller shop page + product page | Median WhatsApp response time (estimated from order timestamps) |
| "X people viewing this now" | Product page | Simple Redis counter with 15-min decay |
| "X orders this month" | Seller shop page | Aggregate from orders table |
| "In stock / Low stock / Sold Out" | Product card + product page | From `stock` field in products table |

### 6.4 Buyer Protection Messaging

Display these trust signals at key anxiety points:
- **Product page**: "✓ Seller verified by TradeFeed · ✓ Order via WhatsApp · ✓ Real seller contact"
- **Checkout/order flow**: "Your order details are sent directly to the seller. Order reference included."
- **Order confirmation**: "Keep your order number safe. Use it to track or query your order."
- **Marketplace page**: "All shops on TradeFeed are real sellers — we verify phone numbers and business details."

---

## 7. UX Improvements

### 7.1 Onboarding Flow

**New seller journey** (current vs. target):

| Step | Current | Target |
|------|---------|--------|
| 1 | Sign up (Clerk form) | Sign up (add Google OAuth, reduce fields) |
| 2 | Redirect to blank dashboard | Redirect to 3-step shop setup wizard |
| 3 | Nothing — left to explore | Step 1: "Name your shop + choose category" |
| 4 | — | Step 2: "Add your first 3 products" |
| 5 | — | Step 3: "Share your catalog link" |
| 6 | — | Dashboard with onboarding checklist widget |

**Post-onboarding retention triggers**:
- Day 1: Welcome email with "your shop is live" link
- Day 3: "Add 2 more products to unlock your catalog score" push
- Day 7: "Your shop had X views this week!" encouragement
- Day 30: Monthly stats summary with "upgrade to Pro" CTA

### 7.2 Empty States

| Page / Context | Empty State Message | CTA |
|----------------|---------------------|-----|
| Marketplace — no search results | "No products found for '[query]'. Try a different search or browse categories." | Browse Categories |
| Dashboard — no products yet | "Your shop is empty. Add your first product to start selling." | Add First Product |
| Dashboard — no orders yet | "No orders yet. Share your catalog link to get your first customer." | Copy Catalog Link |
| Orders page — no orders | "You haven't placed any orders yet. Explore the marketplace to find what you need." | Go to Marketplace |
| Seller reviews — no reviews yet | "No reviews yet. Orders and great service earn reviews automatically." | View Orders |

### 7.3 Feedback Messages

**Principle**: Always tell users what happened and what to do next.

| Trigger | Current | Target |
|---------|---------|--------|
| Product saved | Generic toast | "Product saved! It's now live on your catalog. [View Product →]" |
| Order status updated | Generic toast | "Order marked as Shipped. Your buyer has been notified. [View Order →]" |
| Subscription upgraded | Redirect | "Welcome to Pro! You now have unlimited products and AI features. [Start Exploring →]" |
| Shop created | Redirect to dashboard | Celebratory animation + "Your shop is live! Here's your catalog link: [copy button]" |
| Product deleted | Generic toast | "Product removed from your catalog." with 5s undo option |

### 7.4 Micro-interactions

- Product card: smooth y-axis lift on hover (`y: -6`) — already implemented ✓
- Button loading states: spinner instead of freeze on form submits
- Image upload: progress indicator + preview before confirming
- Filter selection: instant visual feedback (chip added) before results reload
- Order status: animated step indicator (currently plain text)
- Dashboard stats: count-up animation on first load

---

## 8. Progress Tracker

### Phase 1 — Foundation (Design System + Documentation)

- [x] Product audit completed (`docs/product_audit.md`)
- [x] Redesign master document created (`docs/tradefeed-redesign.md`)
- [ ] Design system tokens finalized in `globals.css`
- [ ] Reusable component specs reviewed and approved

### Phase 2 — Core Buyer Experience

- [x] Marketplace page redesigned (search, filters, cards, empty states)
- [x] Product page redesigned (gallery, trust signals, seller info, related products)
- [x] Seller shop page redesigned (hero, stats, product grid, reviews)
- [x] Search bar extracted and improved with autocomplete

### Phase 3 — Seller Experience

- [ ] Dashboard homepage redesigned ("today at a glance")
- [ ] Add product wizard redesigned (stepped, with live preview)
- [ ] Onboarding flow built (post-signup wizard + checklist widget)
- [x] Seller shop page (public) redesigned

### Phase 4 — Trust System

- [x] `TrustBadge` component created
- [ ] Seller verification tiers computed and displayed
- [ ] Reviews histogram implemented
- [ ] Activity indicators implemented (last active, response time, stock status)
- [x] Buyer protection messaging added at key touchpoints

### Phase 5 — Homepage & Auth

- [ ] Homepage redesigned (real testimonials, featured shops, annual billing toggle)
- [ ] Auth pages redesigned (branding, value prop, Google OAuth)

### Phase 6 — Polish & Animations

- [ ] Page transitions added
- [ ] Skeleton loading states added to all data-fetching components
- [ ] Empty states illustrated and implemented across all pages
- [ ] Feedback/toast messages improved
- [ ] Micro-interactions polished

---

*This document is the single source of truth for the TradeFeed redesign. Update it after every completed phase.*
