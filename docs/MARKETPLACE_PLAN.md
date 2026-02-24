# TradeFeed Marketplace — Feature Plan & Tracker

> Comprehensive plan for transforming TradeFeed from isolated shop catalogs
> into a discoverable marketplace with promoted listings monetization.
>
> **Created:** 2026-02-24
> **Status:** Planning
> **Priority:** Next major feature after Phases 1–8

---

## 🎯 Strategic Goals

| # | Goal | Why It Matters |
|---|------|----------------|
| 1 | **Make products discoverable** | Today buyers can only find products if a seller shares their link. Zero organic discovery. |
| 2 | **Create a marketplace feed** | Public `/marketplace` page where anyone can browse ALL products across ALL sellers — like Takealot but for WhatsApp sellers. |
| 3 | **Monetize with promoted listings** | Sellers pay to get their products shown first — "Sponsored" placements, featured sections. Recurring revenue beyond subscriptions. |
| 4 | **Expand beyond clothing** | Start with clothing (our niche), but architect for any product category (electronics, beauty, food, etc.) over time. Don't rush — clothing first, generalize later. |
| 5 | **Grow organically** | SEO-friendly marketplace pages that rank on Google → free traffic → more sellers → more buyers → flywheel. |

---

## 📐 Architecture Principle

> **Clothing-first, general-ready.**
>
> Every model, UI, and category system we build should work perfectly for
> clothing today but not be hardcoded to clothing. Use "Global Categories"
> (not "Clothing Categories"). Use "Products" (not "Garments"). When we
> eventually add electronics or beauty, it should be a category addition —
> not a rewrite.

---

## 🗂️ Feature Phases

### Phase M1 — Schema & Global Categories ✅

> Database changes and platform-wide category system.

| # | Feature | Description | Status | Notes |
|---|---------|-------------|--------|-------|
| M1.1 | `GlobalCategory` model | Platform-wide categories (not per-shop). Fields: `id`, `name`, `slug`, `icon`, `description`, `displayOrder`, `parentId` (self-ref for subcategories), `imageUrl`, `isActive`, `createdAt` | ✅ Done | Self-referential tree |
| M1.2 | Seed initial categories | Clothing-focused but named generically. Top-level: Men's, Women's, Unisex, Kids, Footwear, Accessories, Formal & Traditional. 34 subcategories. | ✅ Done | 7 top-level + 34 sub = 41 total |
| M1.3 | `globalCategoryId` on Product | Optional FK from Product → GlobalCategory. Sellers map their products to a platform category for marketplace discovery. | ✅ Done | Nullable — not required |
| M1.4 | `PromotedListing` model | Tracks promoted products. Fields: `id`, `shopId`, `productId`, `tier` (enum), `startsAt`, `expiresAt`, `impressions`, `clicks`, `status` (ACTIVE/EXPIRED/CANCELLED), `amountPaidCents`, `payfastPaymentId`, `createdAt` | ✅ Done | Indexed on status+expiresAt, tier+status |
| M1.5 | `PromotionTier` enum | `BOOST` (R49/wk), `FEATURED` (R149/wk), `SPOTLIGHT` (R399/wk) | ✅ Done | Pricing adjustable later |
| M1.6 | `PromotedListingStatus` enum | `ACTIVE`, `EXPIRED`, `CANCELLED` | ✅ Done | |
| M1.7 | New `EventType` values | Add to existing enum: `MARKETPLACE_VIEW`, `MARKETPLACE_CLICK`, `PROMOTED_IMPRESSION`, `PROMOTED_CLICK` | ✅ Done | Extends current analytics |
| M1.8 | `isFeaturedShop` on Shop | Boolean flag — admin can feature a shop on marketplace. Free promotion for early adopters / strategic partners. | ✅ Done | Indexed |
| M1.9 | Prisma migration | Applied via `prisma db push` (consistent with prior schema changes) | ✅ Done | Client regenerated |
| M1.10 | Global category seed script | `scripts/seed-global-categories.ts` — idempotent upsert of all categories + subcategories | ✅ Done | `npm run seed:categories` |

---

### Phase M2 — Marketplace Data Layer ✅

> Cross-shop queries, search, and ranking logic.

| # | Feature | Description | Status | Notes |
|---|---------|-------------|--------|-------|
| M2.1 | `lib/db/marketplace.ts` | New data access file for all marketplace queries | ✅ Done | 500+ lines, 10 exports |
| M2.2 | `getMarketplaceProducts()` | Cross-shop product query. Filters: globalCategory, priceRange, province/city, verifiedOnly, search text. Sorting: trending, newest, price asc/desc. Pagination: cursor-based or offset. Returns: product + first image + price range + shop name + shop location + isPromoted flag. | ✅ Done | Offset pagination, ILIKE search |
| M2.3 | `getPromotedProducts()` | Active promoted listings (not expired), ordered by tier (SPOTLIGHT > FEATURED > BOOST), then by recency. Includes product + shop info. | ✅ Done | Tier desc + startsAt desc |
| M2.4 | `getGlobalCategories()` | All active global categories with product counts. Tree structure (parent + children). | ✅ Done | Tree build + rolled-up counts |
| M2.5 | `getTrendingProducts()` | Products with highest (PRODUCT_VIEW + WHATSAPP_CLICK) in last 7 days. Cross-shop. Top 20. | ✅ Done | Also includes MARKETPLACE_CLICK |
| M2.6 | `getFeaturedShops()` | Shops with `isFeaturedShop=true` OR shops with active SPOTLIGHT promotions. Includes product count + shop profile. | ✅ Done | OR query on isFeaturedShop + spotlight |
| M2.7 | `searchMarketplace()` | Full-text search across product names, descriptions, shop names, category names. PostgreSQL `ILIKE` or `tsvector` if needed. | ✅ Done | V1: ILIKE via getMarketplaceProducts |
| M2.8 | `trackPromotedImpressions()` | Increment `impressions` on PromotedListing. Batch-friendly (fire-and-forget). | ✅ Done | updateMany with ID array |
| M2.9 | `trackPromotedClick()` | Increment `clicks` on PromotedListing + fire analytics event. | ✅ Done | Parallel: increment + PROMOTED_CLICK event |
| M2.10 | Interleaving algorithm | Merge promoted + organic results. Pattern: positions 1-4 organic, position 5 promoted, 6-9 organic, position 10 promoted, repeating. Promoted items labeled "Sponsored". | ✅ Done | Deduplicates, fills remaining slots |

---

### Phase M3 — Marketplace Page (Public) ✅

> The main discovery page at `/marketplace`.

| # | Feature | Description | Status | Notes |
|---|---------|-------------|--------|-------|
| M3.1 | Route: `/marketplace` | Public, no auth. Added to middleware public routes + rate limiting. | ✅ Done | 60 req/min, same as catalog |
| M3.2 | Hero section | "Discover SA's Best Products" headline. Search bar (product/shop name). Category pill row for quick filtering. | ✅ Done | Dark theme, desktop+mobile search |
| M3.3 | Featured carousel | Horizontal scrollable section: "🔥 Featured Products". Shows FEATURED + SPOTLIGHT promoted listings. "Sponsored" badge in amber. | ✅ Done | Only renders when promoted exist |
| M3.4 | Product discovery grid | Main feed — 4 cols desktop, 2 cols mobile. Each card: product image, name, price range (R), shop name, location badge, verified badge if applicable. Promoted items interleaved with "Sponsored" label. | ✅ Done | 3 tier badges: Spotlight/Featured/Sponsored |
| M3.5 | Filter sidebar / sheet | Filters: Category (tree), Price range (min/max), Province, Verified sellers only. Mobile: bottom sheet. Desktop: left sidebar or top bar. | ✅ Done | Slide-over panel, 9 SA provinces |
| M3.6 | Sort dropdown | Trending, Newest, Price Low→High, Price High→Low, Most Popular | ✅ Done | URL param driven |
| M3.7 | Pagination | "Load more" button or infinite scroll. Cursor-based for performance. | ✅ Done | Offset pagination, prev/next |
| M3.8 | Empty state | "No products found" with suggestion to adjust filters or browse all. | ✅ Done | Clear all + Browse All CTA |
| M3.9 | Product card → links to catalog | Clicking a marketplace product card goes to `/catalog/[shopSlug]/products/[productId]`. Preserves the per-shop buying experience. | ✅ Done | Tracks MARKETPLACE_CLICK + PROMOTED_CLICK |
| M3.10 | Loading skeleton | Shimmer grid matching product card layout | ✅ Done | loading.tsx with staggered animation |
| M3.11 | Mobile responsiveness | Full mobile-first design. Bottom sheet filters. Sticky search bar. | ✅ Done | Mobile search, filter sheet, 2-col grid |

---

### Phase M4 — Marketplace SEO & Discovery

> Make marketplace pages rank on Google.

| # | Feature | Description | Status | Notes |
|---|---------|-------------|--------|-------|
| M4.1 | Marketplace OG image | Dynamic OG: "Browse 1,000+ products from SA sellers on TradeFeed" | ✅ Done | type=marketplace in /api/og |
| M4.2 | Category SEO pages | `/marketplace?category=hoodies` gets unique meta title: "Hoodies — TradeFeed Marketplace" | ✅ Done | generateMetadata() with dynamic titles, OG, Twitter cards |
| M4.3 | JSON-LD `ItemList` | Structured data for Google Shopping potential | ✅ Done | ItemList + BreadcrumbList + WebPage schemas |
| M4.4 | Sitemap entries | Add `/marketplace` + each category page to sitemap.ts | ✅ Done | Top-level + subcategory pages included |
| M4.5 | Landing page "Browse" link | Add "Browse Marketplace" CTA to landing page navbar + hero | ✅ Done | Added in M3 — navbar + hero CTA |
| M4.6 | Catalog cross-link | "More from this seller" + "Browse more on TradeFeed Marketplace" links on catalog pages | ✅ Done | Cross-links on catalog + product detail pages |

---

### Phase M5 — Promoted Listings (Monetization) 💰 ✅

> Sellers pay to get their products shown first.

| # | Feature | Description | Status | Notes |
|---|---------|-------------|--------|-------|
| M5.1 | Promotion tiers & pricing | **Boost** R49/wk — mixed into feed with "Sponsored" label. **Featured** R149/wk — carousel + priority feed + "Featured" badge. **Spotlight** R399/wk — top of marketplace + carousel + "⭐ Spotlight" badge. | ✅ Done | lib/config/promotions.ts — centralised config with discount pricing for 2/4 weeks |
| M5.2 | Promotion purchase flow | Seller picks product → picks tier → picks duration (1/2/4 weeks) → PayFast checkout → ITN confirms → PromotedListing created → product appears in marketplace immediately. | ✅ Done | /dashboard/[slug]/promote — 3-step form with live price preview, PayFast redirect |
| M5.3 | PayFast promotion webhook | Extend existing ITN webhook to handle promotion payments (different `m_payment_id` prefix or custom field). | ✅ Done | "promo_" prefix routing in ITN handler, amount verification, auto PromotedListing creation |
| M5.4 | Promotion expiry cron/check | Check `expiresAt` on page load or via Vercel cron. Mark expired listings as EXPIRED. | ✅ Done | expirePromotedListings() on marketplace page load + promote dashboard load |
| M5.5 | "Sponsored" badge component | Reusable badge: amber for Boost, gold for Featured, gradient for Spotlight. | ✅ Done | Already existed in M3 (marketplace-product-card.tsx) — reused in promote dashboard |
| M5.6 | Impression & click tracking | Every time a promoted product is rendered → increment impressions. Every click → increment clicks. Both fire-and-forget. | ✅ Done | Already existed in M2 (trackPromotedImpressions/Click) — verified working with M5 |

---

### Phase M6 — Seller Promotion Dashboard ✅

> Sellers manage their promotions from the dashboard.

| # | Feature | Description | Status | Notes |
|---|---------|-------------|--------|-------|
| M6.1 | Route: `/dashboard/[slug]/promote` | New dashboard tab — "Promote" with megaphone icon | ✅ Done | Built in M5 |
| M6.2 | Active promotions list | Currently promoted products with: tier badge, impressions, clicks, CTR%, days remaining, status. | ✅ Done | Built in M5, enhanced with Active/History tabs |
| M6.3 | Promote a product | Product picker dropdown → tier selector (Boost/Featured/Spotlight) → duration selector (1/2/4 weeks) → price preview → "Pay & Promote" button → PayFast. | ✅ Done | Built in M5 |
| M6.4 | Performance stats | Per-promotion: impressions vs clicks chart. Comparison: "Your promoted products got 3x more views than organic." | ✅ Done | CSS bar chart per promotion, ComparisonBanner with multiplier |
| M6.5 | ROI indicator | "Your R149 Featured listing got 47 clicks → estimated 5–8 WhatsApp orders" | ✅ Done | Per-promo ROI micro-indicators + global ROI card with conversion rate |
| M6.6 | Promotion history | Past promotions with: product, tier, dates, total impressions/clicks, amount paid. | ✅ Done | Active/History tabbed view, date ranges, paid amounts |
| M6.7 | Dashboard nav update | Add "Promote" link to DashboardNav component | ✅ Done | Built in M5 |

---

### Phase M7 — Admin Marketplace Management ✅

> Platform admin controls for marketplace and promotions.

| # | Feature | Description | Status | Notes |
|---|---------|-------------|--------|-------|
| M7.1 | Admin global category CRUD | `/admin/categories` — create, edit, reorder, deactivate global categories. Tree view for parent/child. | ✅ Done | Full CRUD with modal form, slug auto-gen, reorder arrows, tree view |
| M7.2 | Admin featured shops | Toggle `isFeaturedShop` from admin shop list. Featured shops get free promotion on marketplace. | ✅ Done | Feature/Unfeature button + ⭐ badge on shop cards |
| M7.3 | Promotion revenue dashboard | Total promotion revenue: daily, weekly, monthly. Top spending sellers. Most promoted categories. | ✅ Done | `/admin/promotions` — 4 revenue cards, tier breakdown, top 8 spenders, category chart |
| M7.4 | Promotion moderation | Admin can cancel/pause a promotion if product violates guidelines. | ✅ Done | Cancel button on active promotions, status filter tabs, inline guideline badges |
| M7.5 | Marketplace analytics | Total marketplace views/day. Search terms (what are people looking for?). Category popularity. Geographic distribution. | ✅ Done | `/admin/analytics` — daily traffic chart, category popularity bars, province distribution, search terms placeholder |
| M7.6 | Content guidelines | Rules for what can be promoted. Automated check: product must have image, description, active variants. | ✅ Done | Automated scan on `/admin/promotions`, red violation cards with per-issue badges + cancel action |

---

### Phase M8 — Global Category Mapping (Seller Side)

> Sellers assign their products to platform-wide categories for discovery.

| # | Feature | Description | Status | Notes |
|---|---------|-------------|--------|-------|
| M8.1 | Global category picker on product form | Dropdown on create/edit product form: "Marketplace Category (optional)". Shows tree: Men's → Hoodies, Women's → Dresses, etc. | ✅ Done | GlobalCategoryPicker on create + edit forms |
| M8.2 | Bulk category mapping | Dashboard tool: "Map your products to marketplace categories" — list of unmapped products with quick-assign dropdown. | ✅ Done | /dashboard/[slug]/marketplace-categories bulk tool |
| M8.3 | Category suggestion | When seller types product name, suggest a global category. "Oversized Hoodie" → suggests "Men's → Hoodies & Sweaters". | ✅ Done | KEYWORD_MAP with 150+ keywords, auto-suggest in forms |
| M8.4 | "Improve discoverability" nudge | Dashboard banner: "12 of your products aren't in marketplace categories. Map them to get discovered!" | ✅ Done | Products page banner + badges + Quick Info display |

---

### Phase M9 — Advanced Discovery (Future)

> Longer-term features to make the marketplace smarter.

| # | Feature | Description | Status | Notes |
|---|---------|-------------|--------|-------|
| M9.1 | "Related products" | On product detail page: "You might also like" — products from other sellers in same category + price range. | ⬜ Todo | Cross-sell between sellers |
| M9.2 | "New arrivals" section | Products added in last 7 days, sorted by recency. Auto-updating. | ⬜ Todo | |
| M9.3 | "Popular near you" | If buyer shares location (GPS), show products from nearby sellers first. | ⬜ Todo | Uses shop lat/lng from Trust phase |
| M9.4 | Buyer saved/favorited products | Heart icon → save to "My Favorites" (requires buyer account or localStorage). | ⬜ Todo | |
| M9.5 | Price drop alerts | "This product was R250, now R199" — if variant prices change. | ⬜ Todo | |
| M9.6 | Seller "Shop of the Week" | Admin picks or algorithm selects a shop to feature prominently for a week. | ⬜ Todo | |
| M9.7 | Search autocomplete | As buyer types, suggest: product names, shop names, categories. | ⬜ Todo | |
| M9.8 | Browse by location | Map view or province filter: "Shops in Gauteng", "Shops in Cape Town". | ⬜ Todo | |

---

### Phase M10 — Generalization (Beyond Clothing) 🌍

> Expand TradeFeed from clothing-only to multi-category: electronics, beauty, food, auto parts, home goods.
> 95% of the platform is already industry-agnostic. The remaining 5% is variant labels, copy, categories, and presets.
> Builds on research audit: `docs/GENERALIZATION_RESEARCH.md`
>
> **Strategy:** 3 tiers. G1 = copy (1-2 days), G2 = variant system (5-7 days), G3 = category expansion (3-4 days).
> **Schema approach:** Option C (additive columns) — zero migration risk. Keep `size`/`color`, add `option1Label`/`option2Label` on Product.

#### Tier G1 — Copy & Metadata Generalization (1-2 days)

> Zero code logic changes. Broaden all clothing-specific language to inclusive copy.
> Non-clothing sellers can sign up without feeling excluded.

| # | Feature | Description | Status | Notes |
|---|---------|-------------|--------|-------|
| M10.1 | Root metadata | `app/layout.tsx` — site title, description, keywords. "SA Clothing Sellers" → "SA Wholesale & Retail". Remove clothing-only keywords, add generic ones. | ✅ Done | Title, desc, 9 keywords generalized |
| M10.2 | Landing page hero & copy | `app/page.tsx` — hero badge, H1, subheading, feature cards, how-it-works, testimonials, trust badge. "Structure Your Clothing Inventory" → "Structure Your Product Inventory". Add 1-2 non-clothing testimonials. Mock products → mix of industries. | ✅ Done | ~15 text replacements: badge, H1, features, how-it-works, social proof |
| M10.3 | Landing page mock data | `app/page.tsx` — category pills (Hoodies, Pants...), product grid (Oversized Hoodie...), phone mockup (Jeppe Fashion Hub). Replace with multi-industry mix. | ✅ Done | Multi-industry products: hoodie, earbuds, serum, denim, biltong, phone case |
| M10.4 | Create-shop & forms copy | `app/create-shop/page.tsx`, `create-shop-form.tsx`, `shop-settings-form.tsx` — "your clothing business" → "your business". Placeholders: "Urban Street Wear" → "e.g. SA Trade Supplies". Map presets: "Fashion District" stays + add generic. | ✅ Done | Create-shop page + form placeholders generalized |
| M10.5 | Create product form copy | `create-product-form.tsx` — placeholder "Oversized Cotton Hoodie" → "e.g. Your Product Name". Size/color references in hints. | ✅ Done | 16 clothing tiles → 16 multi-industry tiles (clothing + electronics + beauty + food + home) |
| M10.6 | Marketplace SEO metadata | `app/marketplace/layout.tsx`, `lib/marketplace/seo.ts`, `lib/marketplace/og.tsx` — meta descriptions, JSON-LD, OG image text. "clothing sellers" → "SA sellers". Add generic SEO keywords alongside existing clothing ones. | ✅ Done | Marketplace meta + JSON-LD + OG image all generalized |
| M10.7 | Legal pages copy | `app/legal/privacy/`, `app/legal/terms/` — "SA clothing wholesalers" → "SA wholesalers and retailers". | ✅ Done | Privacy + Terms pages updated |
| M10.8 | Schema & code comments | `prisma/schema.prisma` header, `lib/db/marketplace.ts` header, etc. "Multi-tenant SaaS for SA clothing wholesalers" → generic. | ✅ Done | Schema header comment generalized |

#### Tier G2 — Generic Variant System (5-7 days)

> The structural unlock. Makes the platform work for ANY product category.
> Schema: additive columns on Product (`option1Label`, `option2Label`) — defaults to "Size"/"Color".
> Variant creator: category-based presets (clothing=size/color, electronics=storage/color, food=weight/flavor, custom=seller-defined).
> Existing clothing data untouched — zero migration risk.

| # | Feature | Description | Status | Notes |
|---|---------|-------------|--------|-------|
| M10.9 | Schema: variant label columns | Add `option1Label String @default("Size")` and `option2Label String @default("Color")` to `Product` model. Migration: additive (no data change). All existing products auto-default to Size/Color. | ✅ Done | Option C from research — lowest risk |
| M10.10 | Smart Variant Creator rework | `smart-variant-creator.tsx` — detect product's `option1Label`/`option2Label`. Show category-based presets: Clothing (S-3XL + colors), Electronics (32-512GB + colors), Beauty (50-200ml + shades), Food (250g-1kg + flavors), Custom (seller names attributes). Matrix generation logic unchanged — just labels swap. | ✅ Done | Biggest UI change — keep clothing preset as default |
| M10.11 | Add Variant Form generalize | `add-variant-form.tsx` — field labels read from product's `option1Label`/`option2Label` instead of hardcoded "Size"/"Color". | ✅ Done | |
| M10.12 | Variant List/Grid generalize | `variant-list.tsx`, `variant-grid.tsx` — table headers read from product's option labels. Interface typed to `option1`/`option2` or kept as `size`/`color` with display labels from product. | ✅ Done | |
| M10.13 | Catalog product page display | `app/catalog/[slug]/products/[id]/page.tsx` — "Available Sizes" → "Available {option1Label}". "Colors" → "{option2Label}". Size chips + color swatches adapt to any attribute. | ✅ Done | Customer-facing — must look polished |
| M10.14 | Product actions refactor | `app/actions/product.ts` — `createProduct` accepts `option1Label`/`option2Label`. `generateVariantMatrix` stays same logic but writes labels. Server action reads labels for display. | ✅ Done | |
| M10.15 | Product type tiles dynamic | `create-product-form.tsx` — auto-fill option labels from category. Collapsible variant label editor. Category change triggers label update. | ✅ Done | |
| M10.16 | Category → variant preset map | `lib/config/category-variants.ts` — maps GlobalCategory slugs to default option labels + preset values for 11 category types. Includes `getVariantPreset()` and `getVariantLabels()` API. | ✅ Done | Central config — admin could manage later |

#### Tier G3 — Category Expansion & Industry Pages (3-4 days)

> Add non-clothing categories, expand keyword map, create industry entry points.

| # | Feature | Description | Status | Notes |
|---|---------|-------------|--------|-------|
| M10.17 | New global categories seed | Add 5 new top-level categories + subcategories: **Electronics** (Phones, Laptops, Accessories, Audio), **Beauty & Health** (Skincare, Haircare, Makeup, Fragrances), **Food & Beverages** (Snacks, Drinks, Fresh Produce, Spices), **Home & Garden** (Furniture, Decor, Kitchen, Tools), **Auto Parts** (Engine, Body, Electrical, Tyres). Admin can edit via M7 CRUD. | ⬜ Todo | 5 parents + ~20 children |
| M10.18 | Keyword map expansion | `lib/marketplace/keyword-map.ts` — add 50+ keywords for new industries. "iPhone" → Electronics/Phones. "Moisturizer" → Beauty/Skincare. "Brake pad" → Auto/Body. | ⬜ Todo | Powers auto-category suggestion on product form |
| M10.19 | Seed data for new categories | `prisma/seed-products.ts` — add 2-3 sample products per new category (for dev/demo). Electronics: "Wireless Earbuds", Beauty: "Vitamin C Serum", Food: "Bulk Biltong Pack". | ⬜ Todo | Dev/demo only |
| M10.20 | Multi-category shop support | Already works via Product → GlobalCategory FK. Verify: one shop can have products in Clothing + Electronics + Beauty. No code change needed — just documentation + test. | ⬜ Todo | Verify existing architecture |

---

## 💰 Monetization Summary

### Revenue Streams

| Stream | Current | After Marketplace |
|--------|---------|-------------------|
| **Subscriptions** | Free (10 products) / Pro R199/mo (unlimited) | Same — unchanged |
| **Promoted Listings** | ❌ None | Boost R49/wk, Featured R149/wk, Spotlight R399/wk |
| **Featured Shops** | ❌ None | Future: R999/mo for permanent featured placement |
| **Transaction fees** | ❌ None | Future: if we add in-app payments (not WhatsApp) |

### Promotion Tier Details

| Tier | Price | Duration | What Seller Gets |
|------|-------|----------|-----------------|
| **Boost** | R 49 / week | 7 days | Product mixed into marketplace feed with "Sponsored" label. Priority sort within organic results. |
| **Featured** | R 149 / week | 7 days | Featured carousel placement + priority feed + "Featured" amber badge. ~3x more visibility than Boost. |
| **Spotlight** | R 399 / week | 7 days | Top of marketplace, featured carousel, "⭐ Spotlight" badge, newsletter inclusion (future). ~8x more visibility. |

### Revenue Projections (After Generalization — Multi-Category)

| Metric | Month 1 | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|---------|----------|
| Active shops (clothing) | 50 | 200 | 500 | 1,000 |
| Active shops (electronics + beauty + other) | 10 | 80 | 300 | 800 |
| **Total active shops** | **60** | **280** | **800** | **1,800** |
| Shops promoting (% adoption) | 6 (10%) | 42 (15%) | 160 (20%) | 450 (25%) |
| Avg spend per promoter / month | R 100 | R 200 | R 300 | R 400 |
| **Promotion revenue** | **R 600** | **R 8,400** | **R 48,000** | **R 180,000** |
| Subscription revenue (Pro) | R 1,200 | R 11,200 | R 48,000 | **R 144,000** |
| **Total MRR** | **R 1,800** | **R 19,600** | **R 96,000** | **R 324,000** |

---

## 🗺️ Implementation Order

> Recommended build sequence. Each phase is independently shippable.

| Order | Phase | Effort | Revenue Impact | Status |
|-------|-------|--------|---------------|--------|
| **1st** | M1 — Schema & Global Categories | Medium | Foundation | ✅ Shipped |
| **2nd** | M2 — Marketplace Data Layer | Medium | Foundation | ✅ Shipped |
| **3rd** | M3 — Marketplace Page | Large | 🟢 Organic growth | ✅ Shipped |
| **4th** | M8 — Seller Category Mapping | Small | Discovery quality | ✅ Shipped |
| **5th** | M4 — SEO & Discovery | Small | 🟢 Organic traffic | ✅ Shipped |
| **6th** | M5 — Promoted Listings | Medium | 💰 Direct revenue | ✅ Shipped |
| **7th** | M6 — Seller Promotion Dashboard | Medium | Self-serve ads | ✅ Shipped |
| **8th** | M7 — Admin Management | Medium | Operations | ✅ Shipped |
| **9th** | M10 — Generalization (G1+G2+G3) | Medium | 🚀 5x market expansion | 🔄 Building now |
| **10th** | M9 — Advanced Discovery | Ongoing | Engagement | ⬜ After M10 |

---

## 🔧 Technical Notes

### Database Considerations
- All marketplace queries are **read-heavy, write-light** → candidate for read replicas later
- `getMarketplaceProducts()` will be the most-hit query → needs proper indexing on `isActive`, `globalCategoryId`, `createdAt`, `shopId`
- Promoted listing impressions/clicks can be batched (don't need real-time accuracy)

### Middleware Changes Needed
- Add `/marketplace(.*)` to public routes matcher
- Rate limit marketplace at 60 req/min (same as catalog)

### Caching Strategy
- Global categories: cache for 1 hour (rarely change)
- Marketplace product feed: ISR with 60-second revalidation, or on-demand
- Promoted listings: cache for 5 minutes
- Trending products: recalculate every 15 minutes

### Search Strategy (Progressive)
1. **V1:** PostgreSQL `ILIKE` with `%search%` — simple, works for < 10K products
2. **V2:** PostgreSQL `pg_trgm` extension — fuzzy matching, still in-DB
3. **V3:** Dedicated search (Meilisearch / Algolia) — when scale demands it

### Pricing Flexibility
- Promotion prices stored in config/env, not hardcoded
- Can adjust per-market or A/B test pricing
- Consider: first promotion free (trial) to drive adoption

---

## 📋 Pre-Build Checklist

Before starting implementation:

- [ ] Finalize global category taxonomy (what are the initial categories?)
- [ ] Decide on marketplace URL structure: `/marketplace` vs `/explore` vs `/browse`
- [ ] Decide promoted listing pricing (R49/R149/R399 or different?)
- [ ] Design marketplace page wireframe / layout
- [ ] Decide search strategy for V1 (ILIKE vs pg_trgm)
- [ ] Plan category mapping UX (how does seller assign global category?)

---

## ⚠️ Key Decisions to Make

| Decision | Options | Recommendation | Status |
|----------|---------|---------------|--------|
| Marketplace URL | `/marketplace`, `/explore`, `/browse` | `/marketplace` — clear intent | ⬜ Decide |
| Category URL structure | Query params (`?category=hoodies`) vs path (`/marketplace/hoodies`) | Path-based for SEO | ⬜ Decide |
| Promoted listing payment | One-time per-week vs recurring subscription add-on | One-time per-week — lower commitment | ⬜ Decide |
| Product detail from marketplace | Link to existing `/catalog/[slug]/products/[id]` or new marketplace product page? | Link to existing catalog — reuse, keeps shop branding | ⬜ Decide |
| Generalization timeline | Now vs later | **Later** — clothing-first, generalize when demand exists | ✅ Decided |
| First category set | Clothing-only vs multi-industry | Clothing-only initially, names kept generic | ✅ Decided |

---

## 📊 Success Metrics

| Metric | Target (Month 1) | Target (Month 3) |
|--------|------------------|------------------|
| Marketplace daily unique visitors | 100 | 1,000 |
| Products discoverable in marketplace | 200 | 2,000 |
| Click-through to seller catalog | 10% | 15% |
| Sellers with promoted listings | 5 | 30 |
| Promotion revenue | R 500 | R 6,000 |
| Marketplace → WhatsApp checkout conversion | 2% | 5% |

---

*This document is the single source of truth for marketplace features.
Update status fields as features are built. Nothing gets forgotten.*
