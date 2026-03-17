# SEO Marketplace Strategy — TradeFeed

**Date**: 2026-03-17  
**Scope**: Search engine optimization architecture for marketplace growth  
**Goal**: 100K organic sessions/month within 12 months

---

## 1. Current SEO Foundation Assessment

### What's Already Built (✅ Strong)
- **JSON-LD structured data**: Product, LocalBusiness, Organization, BreadcrumbList, ItemList, FAQPage, WebPage
- **Dynamic sitemap**: Chunked at 10K URLs, covers shops + products + categories + locations
- **Location pages**: 9 provinces × 3-6 cities = 50+ geo-targeted landing pages
- **Dynamic OG images**: Per-shop, per-product, per-category via `/api/og`
- **Canonical URLs**: Category redirect logic, alternates management
- **Google Merchant Center**: XML product feed at `/api/feeds/merchant-feed`
- **ISR caching**: 5-min for marketplace, 60-sec for catalogs
- **Multi-language meta tags**: 5 South African languages
- **Product schema**: Individual variant offers, AggregateRating, Reviews, shipping details

### What Needs Improvement (🟡 Gaps)
- No clean `/store/{slug}` or `/product/{slug}` URL structure
- Category pages use query params (`?category=slug`) — not SEO-optimal
- No dedicated `/city/{city}` top-level pages
- No blog/content hub for informational SEO
- No FAQ pages per category
- No "hub and spoke" internal linking strategy
- Limited backlink strategy
- No Google Search Console integration guidance
- Product slugs sometimes fall back to IDs

---

## 2. Recommended URL Architecture

### Current vs. Proposed URLs

| Page Type | Current URL | Proposed URL | SEO Impact |
|-----------|-------------|-------------|------------|
| **Store** | `/catalog/{slug}` | `/store/{slug}` | ⭐⭐ "store" is more semantic, matches user intent |
| **Product** | `/catalog/{slug}/products/{id}` | `/product/{product-slug}` | ⭐⭐⭐ Flat URL = higher authority, slug over ID |
| **Category** | `/marketplace?category={slug}` | `/category/{slug}` | ⭐⭐⭐ Clean path vs query param = crawlable |
| **Subcategory** | `/marketplace/category/{slug}` | `/category/{parent}/{slug}` | ⭐⭐ Hierarchical breadcrumb alignment |
| **Province** | `/marketplace/{province}` | `/province/{province}` | ⭐⭐ Clearer intent separation |
| **City** | `/marketplace/{province}/{city}` | `/city/{city}` | ⭐⭐⭐ City-level is primary search intent |
| **City+Category** | (doesn't exist) | `/city/{city}/{category}` | ⭐⭐⭐ Ultra-targeted: "shoes in johannesburg" |
| **Search** | `/marketplace?search=...` | `/search?q=...` | ⭐ Standard convention |
| **Blog** | (doesn't exist) | `/blog/{slug}` | ⭐⭐⭐ Informational traffic funnel |

### Migration Strategy
1. Keep current URLs working (backward compatibility)
2. Add new clean URLs as canonical targets
3. 301 redirect old patterns → new patterns
4. Update sitemap to emit new URLs
5. Update internal links progressively

### Implementation Priority
- **Phase 1** (now): `/category/{slug}` pages (redirect from `?category=`)
- **Phase 2**: `/city/{city}` top-level pages (new)
- **Phase 3**: `/product/{slug}` flat URLs (requires slug uniqueness across shops)
- **Phase 4**: `/store/{slug}` rename (lower impact, can wait)

---

## 3. Structured Data Improvements

### 3.1 Current Coverage (Good)

```
✅ Product (with Offer, AggregateRating, Review, ShippingDetails, MerchantReturnPolicy)
✅ LocalBusiness (shop pages)
✅ Organization + WebSite (root)
✅ BreadcrumbList (all major page types)
✅ ItemList (marketplace, categories)
✅ FAQPage (landing page)
✅ WebPage (location pages)
```

### 3.2 Missing Schemas to Add

#### CollectionPage (Category Pages)
```json
{
  "@type": "CollectionPage",
  "name": "Women's Clothing — TradeFeed",
  "description": "Browse women's clothing from verified SA sellers",
  "url": "https://tradefeed.co.za/category/womens-clothing",
  "mainEntity": {
    "@type": "ItemList",
    "numberOfItems": 450,
    "itemListElement": [...]
  }
}
```

#### Offer Catalog (Store Pages)
```json
{
  "@type": "OfferCatalog",
  "name": "{Shop Name} Product Catalog",
  "itemListElement": [
    { "@type": "OfferCatalog", "name": "Dresses", "itemListElement": [...] }
  ]
}
```

#### HowTo (Import WhatsApp Catalogue Page)
```json
{
  "@type": "HowTo",
  "name": "How to Import Your WhatsApp Catalogue to TradeFeed",
  "step": [
    { "@type": "HowToStep", "name": "Sign Up", "text": "Create your free TradeFeed account..." },
    { "@type": "HowToStep", "name": "Upload Products", "text": "..." }
  ]
}
```

#### VideoObject (When product videos are added)
```json
{
  "@type": "VideoObject",
  "name": "{Product Name} — Product Video",
  "thumbnailUrl": "...",
  "uploadDate": "...",
  "contentUrl": "..."
}
```

#### SpeakableSpecification (For voice search optimization)
```json
{
  "@type": "WebPage",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".product-name", ".product-price", ".product-description"]
  }
}
```

### 3.3 Google Merchant Center Enhancements

Current feed is good. Enhance with:
- **Product availability**: Real-time stock status (`InStock/OutOfStock/PreOrder`)
- **Sale price**: When promotions are active
- **Product condition**: New/Used/Refurbished
- **GTIN/MPN**: When available (future barcode scanning feature)
- **Shipping weight**: For accurate shipping estimates
- **Product highlights**: Key features as structured list
- **Product details**: Fabric type, care instructions (for fashion)

---

## 4. Page-Level SEO Strategy

### 4.1 Store Pages (`/store/{slug}`)

**Title Pattern**: `{Shop Name} — {City}, {Province} | Buy Online at TradeFeed`  
**Meta Description**: `Shop {product count}+ products from {Shop Name} in {City}. {Top categories}. Order via WhatsApp. Free delivery on selected items.`

**On-Page Elements**:
- H1: Shop name
- H2: Category sections ("Dresses", "Shoes", etc.)
- Product count visible in meta
- Location prominently displayed
- Shop bio content (200-500 words) for unique content signal
- Internal links to category pages

**Structured Data**: LocalBusiness + OfferCatalog + BreadcrumbList

### 4.2 Product Pages (`/product/{slug}`)

**Title Pattern**: `{Product Name} — {Category} | From R{price} | TradeFeed SA`  
**Meta Description**: `{Product name}. Sizes: {sizes}. Colors: {colors}. From R{min price}. Order via WhatsApp from {Shop Name} in {City}. Free returns.`

**On-Page Elements**:
- H1: Product name
- Price range (min-max for variants)
- Size/color availability table
- Description (AI-generated, 150+ words)
- Review section with ratings
- "Similar products" section (internal linking)
- "From the same seller" section
- Breadcrumb: Home > Category > Subcategory > Product

**Structured Data**: Product + BreadcrumbList + AggregateRating + Review + ShippingDetails

### 4.3 Category Pages (`/category/{slug}`)

**Title Pattern**: `{Category} — Buy Online from SA Sellers | TradeFeed Marketplace`  
**Meta Description**: `Browse {count}+ {category} products from verified South African sellers. Compare prices, read reviews, order via WhatsApp. New arrivals daily.`

**On-Page Elements**:
- H1: Category name
- Category description (200-400 words, unique content)
- Subcategory links (internal linking)
- Product grid with pagination
- Filter sidebar (price range, location, rating)
- "Popular in {category}" section
- FAQ accordion (3-5 category-specific questions)

**Structured Data**: CollectionPage + ItemList + BreadcrumbList + FAQPage

### 4.4 City Pages (`/city/{city}`)

**Title Pattern**: `{City} Wholesale & Retail — Clothing, Fashion & More | TradeFeed`  
**Meta Description**: `Find {count}+ shops and {product count}+ products in {City}, {Province}. Buy wholesale and retail from verified sellers. Order via WhatsApp.`

**On-Page Elements**:
- H1: "Shops in {City}"
- City description (200-300 words, unique)
- Featured/verified shops in city
- Popular categories in city
- Recent products from city sellers
- Map embed (OpenStreetMap)
- Related cities ("Also browse: {nearby cities}")

**Structured Data**: WebPage + ItemList + BreadcrumbList

### 4.5 City + Category Pages (`/city/{city}/{category}`)

**Title Pattern**: `{Category} in {City} — Buy from Local Sellers | TradeFeed`  
**Meta Description**: `Buy {category} in {City}. {count}+ products from verified sellers. Compare prices & styles. Order via WhatsApp. Same-day collection available.`

**SEO Value**: Very high — captures "[product] in [city]" queries (high purchase intent, low competition)

---

## 5. Content & Informational SEO Strategy

### 5.1 Blog Content Hub (`/blog`)

Create content targeting **informational queries** that funnel into marketplace:

#### Content Pillars

**Pillar 1: Seller Education**
- "How to Start Selling on WhatsApp in South Africa"
- "10 Tips for WhatsApp Business Success"
- "How to Price Your Products for Wholesale"
- "Photography Tips for Product Listings"
- "How to Grow Your WhatsApp Broadcast List"

**Pillar 2: Buyer Guides**
- "Where to Buy Wholesale Clothing in Johannesburg"
- "Best Online Shopping Sites in South Africa 2026"
- "How to Buy Wholesale from WhatsApp Sellers"
- "Guide to South African Fashion Trends 2026"

**Pillar 3: Industry Reports**
- "State of WhatsApp Commerce in South Africa 2026"
- "Most Popular Products to Sell in SA"
- "South African E-commerce Statistics"
- "African Small Business Digital Report"

**Pillar 4: City Guides**
- "Best Wholesale Markets in Johannesburg"
- "Where to Shop in Cape Town for Fashion"
- "Durban's Top Online Sellers"
- "What to Buy in Pretoria's Fashion District"

#### Content Calendar
- 2 articles per week (Year 1 target: 100+ articles)
- Updated quarterly for freshness signals
- Each article links to 3-5 relevant category/city/product pages

### 5.2 FAQ Pages Per Category

Create FAQ content for each major category:
- "What sizes are available in {category}?"
- "How to order {category} on TradeFeed?"
- "Can I buy {category} wholesale?"
- "What is the average price for {category} in SA?"
- "How long does delivery take for {category}?"

Each FAQ page gets:
- FAQPage schema
- 5-10 questions with detailed answers
- Internal links to products and stores
- "Shop Now" CTA

---

## 6. Technical SEO Improvements

### 6.1 Core Web Vitals

| Metric | Target | Strategy |
|--------|--------|----------|
| LCP | < 2.5s | Image optimization, ISR, edge caching |
| FID/INP | < 200ms | Server Components default, minimal client JS |
| CLS | < 0.1 | Skeleton loaders, image dimensions, font-display: swap |

### 6.2 Crawl Budget Optimization

- **robots.txt**: Already blocks `/dashboard/`, `/admin/`, `/api/` — good
- **noindex tags**: Add to paginated pages beyond page 3 (long tail diminishing returns)
- **Canonical tags**: Ensure every page has self-referencing canonical
- **Hreflang**: Add for 5 language variants (currently using lang attribute)
- **XML sitemap**: Split by type (shops, products, categories, locations) for better monitoring

### 6.3 Internal Linking Strategy ("Hub and Spoke")

```
                    Homepage (Hub)
                        |
            ┌───────────┼───────────┐
            ▼           ▼           ▼
        Categories    Cities      Stores
        (Spokes)    (Spokes)    (Spokes)
            |           |           |
        ┌───┼───┐   ┌──┼──┐       |
        ▼   ▼   ▼   ▼  ▼  ▼       ▼
      Products   City+Cat     Products
      (Leaves)   (Leaves)     (Leaves)
```

**Rules**:
- Every product links to its category page
- Every product links to its city page
- Every category page links to city variations
- Every city page links to category variations
- Related products section on every product page (3-6 links)
- "Also from this seller" section (2-4 links)
- Breadcrumb navigation on every page

### 6.4 Mobile SEO

- Already mobile-first responsive (✅)
- AMP not needed (Google no longer prioritizes AMP)
- Mobile page speed: Target < 3s on 3G (key for SA data costs)
- Touch targets: Minimum 48x48px (important for WhatsApp shoppers)

---

## 7. Organic Traffic Strategy

### 7.1 Keyword Targeting by Intent

#### Transactional (Bottom Funnel — Direct Conversion)
- "buy [product] online south africa"
- "[product] for sale near me"
- "wholesale [product] johannesburg"
- "cheap [product] south africa"

**Target pages**: Product pages, category pages

#### Commercial Investigation (Mid Funnel — Comparison)
- "best online stores south africa"
- "[product] price comparison SA"
- "where to buy [category] wholesale"
- "top fashion sellers [city]"

**Target pages**: Category pages, city pages, marketplace

#### Informational (Top Funnel — Awareness)
- "how to sell on whatsapp"
- "start online business south africa"
- "[category] trends 2026"
- "wholesale vs retail pricing guide"

**Target pages**: Blog articles, educational landing pages

### 7.2 Long-Tail Keyword Opportunities

High-volume, low-competition keywords TradeFeed can dominate:

| Keyword Pattern | Monthly Volume (estimated) | Competition |
|----------------|---------------------------|-------------|
| "buy {product} online south africa" | 1K-10K per product | Low |
| "wholesale {product} {city}" | 500-5K per combo | Very Low |
| "{product} for sale {city}" | 1K-10K per combo | Low |
| "whatsapp {product} seller" | 100-1K per product | Very Low |
| "cheap {product} south africa" | 1K-5K per product | Medium |
| "online shop south africa {category}" | 500-2K | Medium |

### 7.3 Search Traffic Projections

| Month | Organic Sessions | Strategy Phase |
|-------|-----------------|----------------|
| 1-3 | 5K-15K/mo | Product indexing + category pages |
| 4-6 | 15K-40K/mo | City pages + blog content + Google Merchant |
| 7-9 | 40K-75K/mo | City+category combos + backlinks + content velocity |
| 10-12 | 75K-100K+/mo | Domain authority growth + long-tail compounding |

---

## 8. Google Merchant Center Strategy

### 8.1 Product Feed Optimization

Current feed at `/api/feeds/merchant-feed` — enhance with:

```xml
<item>
  <g:id>{product_id}</g:id>
  <g:title>{Brand} {Product Name} — {Category}</g:title>
  <g:description>{150-word SEO description}</g:description>
  <g:link>https://tradefeed.co.za/product/{slug}</g:link>
  <g:image_link>{high-res product image}</g:image_link>
  <g:additional_image_link>{gallery images}</g:additional_image_link>
  <g:availability>in_stock</g:availability>
  <g:price>{price} ZAR</g:price>
  <g:sale_price>{sale_price} ZAR</g:sale_price>
  <g:brand>{shop_name}</g:brand>
  <g:condition>new</g:condition>
  <g:product_type>{category} > {subcategory}</g:product_type>
  <g:custom_label_0>{city}</g:custom_label_0>
  <g:custom_label_1>{province}</g:custom_label_1>
  <g:shipping>
    <g:country>ZA</g:country>
    <g:price>0 ZAR</g:price>
  </g:shipping>
</item>
```

### 8.2 Free Listings (Google Shopping Tab)
- Enable free listings in Merchant Center (no ad spend required)
- Products appear in Google Shopping tab
- High intent traffic at zero cost
- Estimated: 10-30% of total organic traffic

### 8.3 Performance Max Campaigns (Paid — Future)
- Once free listings prove ROI, enable paid campaigns
- Target ROAS of 5x for promoted listing sellers
- Budget: Start at R5K/mo, scale with seller revenue

---

## 9. Backlink Strategy

### 9.1 Natural Link Building
- **SA Business Directories**: Register on BusinessTech, MyBroadband, Hello Peter
- **Tech Media**: Pitch to TechCentral, Ventureburn, Disrupt Africa
- **Entrepreneur Resources**: SA Small Business Hub, DESA, SEDA
- **Fashion Media**: SA Fashion Week, StyleScoop, ZAlebs

### 9.2 Seller-Generated Backlinks
- Every seller shares their TradeFeed store link on social media
- Store links in WhatsApp bios, Instagram bios, Facebook pages
- Provide sellers with "Shop on TradeFeed" badge/widget

### 9.3 Content-Earned Links
- Industry reports (e.g., "State of WhatsApp Commerce in SA")
- Data-driven articles (product trends, pricing insights)
- Free tools (shipping cost calculator, profit margin calculator)

---

## 10. Implementation Roadmap

### Phase 1: Quick Wins (Week 1-2)
- [ ] Add `/category/{slug}` clean URL pages (redirect from `?category=`)
- [ ] Add CollectionPage schema to category pages
- [ ] Add FAQPage schema to each category
- [ ] Create hreflang tags for all 5 languages
- [ ] Split sitemap by content type (shops, products, categories, locations)
- [ ] Ensure all product pages use slugs (not IDs)

### Phase 2: Location SEO (Week 3-4)
- [ ] Create `/city/{city}` top-level landing pages
- [ ] Create `/city/{city}/{category}` combination pages
- [ ] Add city-specific meta descriptions and content
- [ ] Add OpenStreetMap embeds with shop markers
- [ ] Internal linking: city ↔ category cross-links

### Phase 3: Content Engine (Month 2-3)
- [ ] Set up `/blog` with headless CMS or MDX
- [ ] Publish 4 seller education articles
- [ ] Publish 4 city guide articles
- [ ] Publish first industry report
- [ ] Add content links from category/city pages

### Phase 4: Google Merchant (Month 2)
- [ ] Enhance product feed with all recommended fields
- [ ] Enable free listings in Merchant Center
- [ ] Monitor Shopping tab impressions/clicks
- [ ] A/B test product titles in feed

### Phase 5: Authority Building (Month 3-6)
- [ ] Register in SA business directories (20+ listings)
- [ ] Pitch to 5 SA tech/business media outlets
- [ ] Launch "Shop on TradeFeed" badge program for sellers
- [ ] Create shareable industry report for backlinks
- [ ] Build internal linking automation (related products, cross-category)
