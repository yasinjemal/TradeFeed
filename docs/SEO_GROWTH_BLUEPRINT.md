# TradeFeed SEO Growth Blueprint
**tradefeed.co.za · South Africa · 6–12 month domination plan**
*Prepared as an execution document, not a thought piece. Grounded in the actual codebase: real routes, real metadata, real inventory constraints (~74 live sellers at time of writing).*

---

## What TradeFeed really is in SEO terms

A **SaaS demand-capture site wrapped around a UGC marketplace**. The SaaS side (seller acquisition) is where the money is and where intent is winnable today. The marketplace side (storefronts, products, provinces) is a compounding long-tail index that is currently **too thin to win buyer head terms** but perfect for owning the "WhatsApp seller in South Africa" identity. You are not Takealot, and you should not pretend to be. You are the place where a WhatsApp seller becomes a real shop — and Google should be told exactly that, on every page.

## What it should dominate first

**WhatsApp commerce in South Africa.** "Sell on WhatsApp", "WhatsApp catalog for business", "import WhatsApp catalogue", "WhatsApp shop link" — these queries have real volume in SA, weak competition (mostly Meta help docs and Indian SaaS blogs), perfect product fit, and nobody local owns them. Second: the seller-intent cluster ("sell online South Africa", "create online shop South Africa free"). These two clusters convert directly to signups. Everything else supports them.

## What not to waste time on

- **Buyer head terms** ("online marketplace South Africa", "buy online South Africa") — Takealot, Bob Shop, Facebook Marketplace, and Gumtree own these. With ~74 sellers you cannot satisfy the intent; ranking attempts waste crawl budget and credibility.
- **Mass city × category programmatic pages now** — with current inventory, 90% would be empty. Build the template, gate indexation on inventory.
- **Generic ecommerce blog content** ("top 10 ecommerce trends 2026") — zero links, zero conversions, zero local relevance.
- **Multilingual SEO** (zu/xh/af listing translations exist in product) — search demand in SA commerce queries is overwhelmingly English; revisit at 1,000+ sellers.
- **Any link buying.** A young SA domain with manipulated links gets flattened. The link plan below is earned-only.

---

## 1. Executive Diagnosis

### The opportunity in plain English
There are hundreds of thousands of South Africans selling clothing, beauty, electronics, and wholesale goods through WhatsApp groups, Instagram DMs, and Facebook Marketplace. They lose sales to buried posts, "how much?" back-and-forth, and zero trust signals. When they finally search for a fix, they type things like *"how to sell on WhatsApp"*, *"create online shop South Africa free"*, *"WhatsApp catalog link"*. Nobody locally has built the definitive search presence for that moment. Shopify is too expensive and global; Takealot is gate-kept; WordPress is too technical. TradeFeed is the exact answer — it just hasn't built the pages that say so.

### Five biggest growth levers
1. **Own the WhatsApp-commerce keyword space in SA** — low difficulty, perfect fit, high conversion. The `/import-whatsapp-catalogue` page already exists; it needs siblings and authority.
2. **Split the homepage's six narratives into dedicated money pages** — today one page tries to rank for sell-online + shop-builder + WhatsApp + wholesale + marketplace + AI. Six focused pages will outrank one diluted one.
3. **Province/city seller-acquisition pages** ("sell online in Gauteng") — local intent, near-zero competition, and the routes (`/marketplace/[province]`, `/marketplace/[province]/[city]`) already exist for the buyer side; the seller side is greenfield.
4. **Marketplace long-tail via real inventory** — every product page is a lottery ticket for "buy [specific item] [city]" queries. Product schema already ships; quality gating decides whether this compounds or rots.
5. **Brand demand flywheel** — every seller who shares a `tradefeed.co.za/catalog/...` link into WhatsApp groups is distributing branded URLs to thousands of buyers. That's free brand-query growth no competitor can copy. Protect and amplify it (link previews, OG images — already implemented — plus "powered by TradeFeed" on free-tier storefronts).

### Five biggest weaknesses/risks (observed in the actual code)
1. **Keyword-stuffed metadata** — the homepage and marketplace pages carry 30+ item `keywords` arrays and long, comma-spliced descriptions. Google ignores the meta keywords tag; the stuffing mindset is leaking into titles/descriptions and diluting them. Strip and sharpen.
2. **Inconsistent trust numbers** — "Join 100+ sellers" in metadata vs ~74 live sellers vs `Math.max(shopCount, 50)` inflation in the old hero. Google's quality raters and your buyers both notice. (The flagged redesign already fixes this on-page; fix metadata too.)
3. **One page, six intents** — the homepage cannibalizes itself. No dedicated `/sell-online-south-africa`, `/whatsapp-catalog`, `/online-shop-builder` pages exist. *Assumption labeled: confirmed by route inspection.*
4. **Thin programmatic surface already live** — province and city marketplace pages render regardless of inventory. Empty "wholesale in Northern Cape" pages are index poison. Needs inventory-gated indexation.
5. **Custom-domain duplicate content** — paid sellers get custom domains serving the same catalog as `/catalog/[slug]`. Without cross-domain canonicals, sellers' own domains will compete with (or duplicate) yours. Decide the canonical policy now, before scale.

### Business model implications
- **SaaS SEO** (seller acquisition) = editorial money pages + comparisons + content engine. High effort per page, highest revenue per visitor. **This is 70% of the next 6 months.**
- **Marketplace SEO** (buyer demand) = programmatic, inventory-dependent, compounding. **20% now, growing as sellers grow.** It also feeds SaaS: buyers become sellers.
- **Local SEO** = a thin but valuable layer over both: province seller-acquisition pages (SaaS) and province discovery pages (marketplace). **10%.**
The trap to avoid: letting the marketplace's thin pages drag down the domain that the SaaS pages depend on. Index quality is a shared resource.

---

## 2. SEO Positioning Strategy

### The clearest search-market position
**"The WhatsApp-first way to sell online in South Africa."** One sentence Google and users can both file: TradeFeed turns WhatsApp sellers into real online shops.

### Narrative hierarchy
| Narrative | Role | Why |
|---|---|---|
| **WhatsApp selling tool** | **Primary** | Least competition, strongest product-market fit, most defensible. No global player localizes this for SA. Wins fastest. |
| **Online shop builder (SA)** | **Co-primary** | Higher volume ("create online store South Africa"), moderate competition (Shopify/Wix SEO is global, not local-intent-tuned). The WhatsApp angle is the differentiator inside these pages, not the headline. |
| **AI listing tool** | Supporting | Great differentiator and demo content, weak standalone search volume in SA. Feature page + proof in content; not a pillar. |
| **Marketplace** | Supporting (buyer side), deferred (head terms) | Keep building the programmatic substrate and win long-tail product/location queries, but do not chase "online marketplace South Africa" until inventory can satisfy it. |

### How to avoid confusing Google and users
- **One intent per URL.** Homepage = brand + "sell online in South Africa" umbrella. Each narrative gets its own money page with its own title/H1, interlinked but never sharing target keywords.
- **Consistent entity signals:** Organization schema sitewide says "TradeFeed — South African WhatsApp commerce platform & marketplace"; same description in GBP, LinkedIn, directories, press boilerplate.
- **Buyer vs seller split at the nav level:** `/marketplace/...` is buyer-world, everything else is seller-world. Don't put seller CTAs as the primary intent on buyer pages (a soft "sell on TradeFeed" footer module is fine — the storefront recruitment CTA already does this well).
- **Kill keyword-array metadata.** One target phrase + one supporting phrase per title. Stop hedging.

---

## 3. Keyword Universe (South Africa)

*Volumes are directional estimates for SA (no reliable public ZA volume data — labeled assumption). Difficulty: 1–10 against the actual SERPs. Priority: P1 = build this quarter.*

### 3.1 Seller-intent transactional
| Keyword examples | Intent | Funnel | Page | Priority | Diff | Value |
|---|---|---|---|---|---|---|
| sell online south africa, how to sell online in south africa | Start selling | BOFU/MOFU | `/sell-online-south-africa` | **P1** | 6 | Very high |
| create online shop south africa, create online store south africa free | Build a shop | BOFU | `/create-online-shop` | **P1** | 5 | Very high |
| free online store south africa, free online shop builder | Free tool | BOFU | `/create-online-shop` (free angle section) + pricing | **P1** | 5 | Very high |
| online catalog maker, product catalogue app south africa | Tool seeking | BOFU | `/online-catalogue-maker` | P2 | 4 | High |

### 3.2 WhatsApp commerce (the moat)
| Keyword examples | Intent | Funnel | Page | Priority | Diff | Value |
|---|---|---|---|---|---|---|
| sell on whatsapp, how to sell on whatsapp south africa | Method | MOFU/BOFU | `/sell-on-whatsapp` | **P1** | 3 | Very high |
| whatsapp catalog south africa, whatsapp catalogue for business | Tool | BOFU | `/whatsapp-catalog` | **P1** | 3 | Very high |
| import whatsapp catalogue, move whatsapp catalog to website | Migration | BOFU | `/import-whatsapp-catalogue` (exists — expand) | **P1** | 2 | Very high |
| whatsapp shop link, whatsapp store link for business | Tool | BOFU | `/whatsapp-catalog` section | P1 | 3 | High |
| whatsapp business catalogue limit, whatsapp catalog tips | Problem | TOFU | Blog → links to money pages | P2 | 2 | Medium |

### 3.3 Commercial investigation / comparison
| Keyword examples | Intent | Funnel | Page | Priority | Diff | Value |
|---|---|---|---|---|---|---|
| shopify alternative south africa, cheaper than shopify | Compare | MOFU | `/compare/shopify-alternative-south-africa` | **P1** | 4 | Very high |
| best ecommerce platform south africa for small business | Compare | MOFU | `/ecommerce-for-small-business` + listicle blog | P1 | 6 | High |
| takealot seller fees vs, sell without takealot | Compare | MOFU | Blog comparison | P2 | 4 | High |
| wix vs shopify south africa | Compare | MOFU | Blog (capture, redirect intent to TradeFeed) | P3 | 5 | Medium |

### 3.4 Marketplace / buyer keywords
| Keyword examples | Intent | Funnel | Page | Priority | Diff | Value |
|---|---|---|---|---|---|---|
| clothing wholesale south africa, jeppe street wholesalers online | Buy bulk | BOFU (buyer) | `/marketplace/category/clothing` + wholesale hub | P2 | 6 | High (feeds GMV + seller proof) |
| buy [category] online [city] | Buy | BOFU (buyer) | category × city pages (inventory-gated) | P2–P3 | 4–7 | Medium |
| [specific product] price south africa | Buy | BOFU | product pages (programmatic) | P2 | varies | Medium, compounding |
| online marketplace south africa | Browse | TOFU (buyer) | `/marketplace` — **do not chase yet** | P4 | 9 | Low today |

### 3.5 Local / province / city
| Keyword examples | Intent | Funnel | Page | Priority | Diff | Value |
|---|---|---|---|---|---|---|
| sell online gauteng / cape town / durban | Start selling, local | BOFU | `/sell-online/[province-or-city]` (new) | **P1** | 2 | High |
| wholesale suppliers johannesburg / durban | Buy bulk local | BOFU (buyer) | `/marketplace/[province]/[city]` (exists — gate + enrich) | P2 | 5 | High |
| online shops in [province] | Browse local | MOFU | `/marketplace/[province]` (exists — enrich) | P2 | 3 | Medium |

### 3.6 AI listing / product description
| Keyword examples | Intent | Funnel | Page | Priority | Diff | Value |
|---|---|---|---|---|---|---|
| ai product description generator, product listing from photo | Tool | MOFU | `/ai-product-listings` | P2 | 5 (global comp) | Medium-high |
| how to write product descriptions that sell | Learn | TOFU | Blog → AI feature page | P3 | 4 | Medium |

### 3.7 Informational long-tail (content engine fuel)
how to price resale clothing in SA · how to get paid safely selling online SA · payfast vs eft for small sellers · how to register a small business in south africa · how to avoid scams selling on facebook marketplace · how to take product photos with a phone — **TOFU, blog, P2**, each must funnel into a money page.

### 3.8 Branded & brand-adjacent
tradefeed, tradefeed south africa, tradefeed reviews, tradefeed pricing, is tradefeed legit, tradefeed vs shopify — **P1 to own completely**: pricing page, reviews/testimonials page, comparison pages. "Is tradefeed legit" deserves its own answer via a trust/about page + FAQ schema. Brand SERP real estate is conversion insurance.

---

## 4. Site Architecture

```
tradefeed.co.za/
├── /                          Homepage — brand + umbrella intent
├── /pricing                   (promote out of #pricing anchor → real URL)
├── /sell-online-south-africa  Money page (editorial)
├── /create-online-shop        Money page (editorial)
├── /sell-on-whatsapp          Money page (editorial)
├── /whatsapp-catalog          Money page (editorial)
├── /import-whatsapp-catalogue Money page (exists; expand)
├── /ai-product-listings       Feature money page
├── /custom-domain             Feature money page
├── /ecommerce-for-small-business  Money page
├── /sell-online/[province]    Programmatic seller-acquisition (9 pages, hybrid)
├── /compare/[competitor-or-method]  Comparison pages (editorial)
├── /blog/[slug]               Content engine (editorial)
├── /sellers/[story-slug]      Case studies / success stories (editorial)
├── /marketplace               Buyer hub
│   ├── /category/[slug]       Category pages (template + editorial intro)
│   ├── /[province]            Province discovery (exists; gate)
│   └── /[province]/[city]     City discovery (exists; gate)
├── /catalog/[slug]            Seller storefronts (UGC template)
│   └── /products/[id]         Product pages (UGC template)
├── /track/[orderNumber]       noindex
└── /dashboard, /orders, /pay  noindex, disallow
```

| Page family | Search intent | SEO purpose | Conversion purpose | Linking role | Type |
|---|---|---|---|---|---|
| Homepage | Brand + "sell online SA" umbrella | Entity definition, authority distribution | Signup | Hub: links to every money page + marketplace | Editorial |
| Pricing | "tradefeed pricing", free-plan queries | Brand SERP, free-intent capture | Upgrade/signup | Receives from all money pages | Editorial |
| Money pages (8) | One transactional cluster each | Rank #1 for cluster | Signup | Receive from home, blog, comparisons; link to pricing + signup | Editorial |
| Province seller pages | "sell online [place]" | Local seller capture | Signup | Receive from money pages footer; link to city marketplace pages | Hybrid (template + unique local data) |
| Comparison pages | Alternative/vs queries | Capture switchers | Signup | Receive from blog; link to pricing | Editorial |
| Blog | Informational | Topical authority, links | Email/signup assist | Feed money pages (every post links to ≥2) | Editorial |
| Case studies | Brand-adjacent, proof | E-E-A-T, links | Signup (social proof) | Linked from money pages' trust sections | Editorial |
| Marketplace hub | Buyer browse | Crawl gateway to UGC | Buyer activation | Links to categories, provinces, featured shops | Template |
| Category pages | "buy [category] online SA" | Long-tail buyer capture | GMV | Link to products, province×category, top sellers | Template + editorial intro |
| Province/city (buyer) | "wholesale [city]" | Local buyer capture | GMV | Link to local shops + categories | Programmatic, gated |
| Seller storefronts | Brand searches for the shop, "[shop name]" | Long-tail + seller vanity SEO (a selling point!) | GMV + seller retention | Receive from categories/provinces; link to products + marketplace | UGC template |
| Product pages | "[product] price SA" | Deepest long-tail | GMV | Link up to storefront, category, related | UGC template |
| Help/guides | "how to" product queries | Support brand SERP, deflect support | Retention | Link from dashboard + footer | Editorial |

**Cannibalization rule:** `/sell-online-south-africa` owns the head term; the homepage targets the brand + a softer umbrella title. `/sell-on-whatsapp` (method) and `/whatsapp-catalog` (tool) are distinct intents — method page covers "how", tool page covers "what/which app". Audit titles quarterly for drift.

---

## 5. Programmatic SEO Strategy

**Governing rule: no page enters the index unless it would deserve to rank if a human built it by hand.** Inventory thresholds are enforced in code (the storefront already has a quality gate pattern — ≥3 active products for homepage features; extend that thinking everywhere).

### 5.1 Province marketplace pages — `/marketplace/[province]` (exists)
- **Template:** "{Province} online shops & wholesale suppliers" — intro (unique, 100–150 words of real local commerce context), top categories in province, verified seller cards, recent products, FAQ.
- **Unique data required:** live seller count, product count, top cities, top categories, featured verified sellers — all queryable today.
- **Duplicate risk:** medium — nine near-identical templates. Mitigate with per-province data density + genuinely local intro copy (Jeppe Street for Gauteng, Durban's Warwick wholesale culture, etc.).
- **Quality threshold / indexation:** **index only if ≥5 active sellers AND ≥30 active products** in the province. Below: render but `noindex,follow`.
- **Internal links:** from `/marketplace` hub + footer; out to city pages, category pages, top storefronts.
- **Schema:** `CollectionPage` + `ItemList` of shops; `BreadcrumbList`.

### 5.2 City pages — `/marketplace/[province]/[city]` (exists)
Same template, stricter gate: **≥3 sellers AND ≥15 products**, else `noindex,follow`. Today that's probably JHB, Durban, Cape Town, maybe Pretoria. Four good pages beat forty empty ones.

### 5.3 Category × province — `/marketplace/[province]/category/[slug]` (new, later)
- **Worth building only at scale.** Gate: ≥8 products in the combo. Launch with the 5–10 combos that pass (e.g., clothing × Gauteng). Everything else: don't generate the URL at all (don't even render a noindexed shell — link equity and crawl budget are wasted on it).
- **Schema:** `CollectionPage` + `ItemList` + `BreadcrumbList`.

### 5.4 Seller storefronts — `/catalog/[slug]` (exists)
- **Unique data:** shop description/about, products, reviews, location, trust stats — already rendered.
- **Risk:** thin/abandoned shops. **Gate: index if ≥3 active products AND owner-written description ≥40 words; else `noindex,follow`.** Re-evaluate on each ISR pass.
- **Schema:** `LocalBusiness`/`Store` (already generating shop JSON-LD) + `AggregateRating` when ≥1 approved review.
- **Linking:** category and province pages link to qualifying storefronts; storefront links to its products and back to marketplace category.

### 5.5 Product pages — `/catalog/[slug]/products/[id]` (exists)
- **Unique data:** seller photos, AI-generated-but-seller-edited descriptions, variants, price, reviews, sold counts. Product + Offer schema already implemented — good.
- **Risks:** (a) AI-boilerplate descriptions duplicated across similar listings; (b) resellers listing identical goods. Mitigations: nudge sellers to edit AI output (dashboard prompt: "listings with custom details get more views"); **index gate: has image + description ≥30 words + in stock at least once**; canonical each product to itself (no cross-seller canonical — they're genuinely different offers).
- **Out of stock:** keep indexed 30 days with "sold out — more from this seller" module, then `noindex` if still dead; never 404 while inbound links exist.

### 5.6 "Sell [category] online in South Africa" — `/sell-online/[category]` (new)
- **Template:** "Sell {clothing} online in South Africa" — category-specific pains (sizing chats on WhatsApp), pricing norms, 2–3 real seller examples from that category, AI listing demo for that category, FAQ.
- This is **seller-side programmatic** and only viable as **hybrid**: template skeleton + 200+ words of genuinely category-specific copy each. Launch 6 (clothing, shoes, beauty, electronics, accessories, food) — hand-written. Do not generate 50.
- **Index:** yes, all (they're hand-finished). Schema: `WebPage` + `FAQPage`.

### 5.7 "Shops in [location]" and "buy [category] in [city]"
Covered by 5.1–5.3 — **do not create a parallel URL family for the same intent** (cannibalization + crawl waste). One URL per intent, forever.

### 5.8 Comparison template pages
Not programmatic. Each comparison is editorial (Section 10). Auto-generated "TradeFeed vs X" shells are exactly the AI-slop pattern Google's spam policies now name. Hard no.

---

## 6. Homepage Strategy

**Current state (from code):** title "Sell Online South Africa — Create Your Shop & WhatsApp Catalog in 2 Minutes | TradeFeed"; 30+ meta keywords; description stuffed with five intents; inconsistent seller counts. It's trying to be every money page at once.

**Recommended role:** brand home + umbrella. Once `/sell-online-south-africa` exists, the homepage stops competing for the head term and starts converting brand traffic.

- **Primary keyword:** `tradefeed` (brand) + umbrella "sell online in South Africa" (secondary signal, not the title's job once the money page ranks)
- **Secondary:** whatsapp shop south africa, online shop builder south africa
- **Title (≤60 chars):** `TradeFeed — Sell Online in South Africa via WhatsApp`
- **Meta description (≤155):** `Turn your WhatsApp business into a real online shop. Photo in, AI listing out, one shareable catalogue link. Free for your first 20 products.`
- **H1:** `One photo. One link. Orders on WhatsApp.` *(the redesigned hero — keep it; it's distinctive and on-thesis)*
- **H2 structure:** How it works (3 steps) → Buyers see who they're buying from (Verified Seller card) → Real shops live right now → Honest pricing in Rand → Sell anywhere in South Africa (province links) → FAQ → Final CTA
- **Missing trust elements:** consistent real numbers everywhere (fix metadata's "100+ sellers"); a named founder/company line in the footer; visible support contact; link to a real reviews/testimonials page.
- **Missing conversion elements:** the redesign already adds sticky CTA + honest reassurance line. Add: 30-second product demo video (also a linkable asset), and one real seller quote with name + city.
- **Missing internal links:** homepage currently links to marketplace + anchors. Add a footer "For sellers" block linking ALL money pages, and a "Sell in your province" block (9 links). These two blocks are the authority spine of the whole site.
- **Messaging hierarchy:** 1) what it does (photo→link→orders), 2) why trust it (verified sellers, real numbers, POPIA), 3) what it costs (transparent ZAR), 4) where it works (provinces), 5) act (free, no card).

---

## 7. Money Pages (build in this order)

*All editorial, all with `WebPage` + `FAQPage` schema (+ noted extras), all linked from homepage footer + nav, all linking to `/pricing` and signup. Trust block on every one: real seller count, PayFast + POPIA line, one named testimonial, Verified Seller card visual.*

### 7.1 `/sell-online-south-africa` — P1
- **Intent:** "I want to start selling online" (SA). **Keywords:** sell online south africa; how to sell online in south africa; start selling online.
- **H2s:** What you need to sell online in SA (spoiler: a phone) → The WhatsApp-first way vs the website way → Step 1 photo, Step 2 AI listing, Step 3 share your link → What it costs (R0 to start) → Where your buyers are (provinces) → Getting paid safely (PayFast, EFT, COD) → FAQ.
- **CTA:** "Create your free shop" after every major section + sticky. **Links in:** home, blog posts, province pages. **Links out:** create-online-shop, sell-on-whatsapp, pricing, 2–3 case studies.

### 7.2 `/sell-on-whatsapp` — P1
- **Intent:** method/how-to with tool intent underneath. **Keywords:** sell on whatsapp; how to sell on whatsapp south africa; whatsapp business selling.
- **H2s:** Why WhatsApp selling stalls (buried posts, price questions, no trust) → The catalogue-link method → Setting up in 3 minutes → Taking orders without back-and-forth → Getting paid → Real sellers doing it (cases) → FAQ.
- **Schema extra:** `HowTo`. **Links:** ↔ whatsapp-catalog, → import page, → pricing.

### 7.3 `/whatsapp-catalog` — P1
- **Intent:** tool-seeking. **Keywords:** whatsapp catalog south africa; whatsapp catalogue for business; whatsapp shop link.
- **H2s:** WhatsApp's built-in catalogue vs a real one (limits: discoverability, search, trust) → What a TradeFeed catalogue adds (link, search, verified badge, tracking) → Import your existing WhatsApp catalogue → Pricing → FAQ.
- **Links:** ↔ sell-on-whatsapp, → import-whatsapp-catalogue (primary CTA for existing catalogue owners), → pricing.

### 7.4 `/import-whatsapp-catalogue` — P1 (exists; expand)
- **Intent:** migration, highest-intent page on the site. **Keywords:** import whatsapp catalogue; transfer whatsapp catalog.
- **H2s:** What gets imported (photos, names, prices) → 3-step import → Before/after (group post vs storefront) → What your buyers see → FAQ. **Schema extra:** `HowTo`. Keep URL; it's earning age.

### 7.5 `/create-online-shop` — P1
- **Intent:** shop-builder seekers. **Keywords:** create online shop south africa; create online store south africa free; free online store south africa.
- **H2s:** Shop live in under 3 minutes → No coding, no app, no monthly fees to start → Your own link (and custom domain on Pro) → What the shop includes → vs website builders (teaser → comparison page) → Pricing → FAQ.

### 7.6 `/online-marketplace-south-africa` → **do not build as a money page yet.** `/marketplace` serves buyer intent; a thin SEO page targeting the head term against Takealot wastes effort. Revisit at 500+ sellers. *(Direct answer to the brief: this is the one requested page I'm vetoing for now.)*

### 7.7 `/custom-domain` — P2
- **Intent:** branding-conscious sellers (upgrade revenue). **Keywords:** custom domain online shop south africa; co.za domain for my shop.
- **H2s:** Your shop on your own .co.za → How it works (DNS handled / guided) → SEO benefits for your shop → Plan requirements → FAQ.

### 7.8 `/ai-product-listings` — P2
- **Intent:** AI-tool curiosity → seller conversion. **Keywords:** ai product description generator; product listing from photo.
- **H2s:** Photo in, listing out (live demo/video) → What the AI writes (title, description, tags, price suggestion) → You stay in control (edit before publish) → 10 free listings monthly → FAQ. **Schema extra:** `SoftwareApplication` + `VideoObject`.

### 7.9 `/ecommerce-for-small-business` — P2
- **Intent:** broader platform evaluation. **Keywords:** ecommerce for small business south africa; best ecommerce platform south africa.
- **H2s:** What small SA businesses actually need (mobile buyers, WhatsApp, ZAR pricing, no dev) → The real cost comparison table (TradeFeed/Shopify/Wix/marketplace fees) → Who TradeFeed fits (and who it doesn't — honesty ranks and converts) → Cases → FAQ.

---

## 8. Marketplace SEO Strategy

- **Category architecture:** keep one canonical category URL: `/marketplace/category/[slug]` (the code already canonicalizes `?category=` to it — correct; ensure those param URLs also carry the canonical when rendered). Two-level max (category → subcategory). Each category page gets a 100-word human intro + FAQ.
- **Geographic discovery:** province/city pages per Section 5 gates. Provinces link down to cities, cities to shops. Breadcrumbs everywhere (`BreadcrumbList`).
- **Indexation rules:** index = marketplace hub, qualifying categories, gated province/city, qualifying storefronts, qualifying products. Noindex = filtered/sorted/paginated-param URLs (`?sort=`, `?verified=`, `?minPrice=`, `?page=` → canonical to clean URL), search results, `/track/*`, wholesale-register, empty anything.
- **Faceted navigation:** filters are URL params today — good. Keep them `rel=canonical`→ clean category URL, and block crawl of param combinations in robots.txt (`Disallow: /marketplace?*sort=` etc.) only after confirming canonicals work; prefer canonicals over robots so equity consolidates.
- **Seller pages:** the quality gate (5.4) is the core defense. Add seller-editable "about" prompts at onboarding to push pages over the threshold. The Verified Seller card + trust stats are genuine ranking-relevant content — unique numbers per page.
- **Product pages:** per 5.5. Also: stable slugs (already slug-or-id routing — prefer slugs, 301 id→slug), `Offer` with `priceCurrency: ZAR`, `availability` live (already in meta), review schema once approved reviews exist.
- **Out of stock:** in-stock signal in schema flips immediately (ISR 60s — fine); page stays up with alternatives module; noindex after 30 days dead; 410 only if seller deletes.
- **Duplicate seller/product content:** AI listing generator is the systemic risk — same prompt, similar outputs. Add variation seeds (seller name, location, category register) to generation, and reward edited listings in marketplace "quality" sort (the sort exists — feed listing-uniqueness into it).
- **Reviews/ratings:** "from confirmed orders" reviews are a moat — UGC Google can't get elsewhere. Surface review snippets on category pages (unique content), `AggregateRating` on storefronts + products that qualify. Never seed fake reviews — one detected pattern poisons the whole marketplace's trust.
- **Trust signals:** verified-seller program page explaining what verification checks (links from every Verified badge — make the badge clickable to it). This page becomes the citation target for "is X on tradefeed legit".

---

## 9. Content Engine

**Operating model:** 2 posts/week max, every post written for one keyword, every post linking to ≥2 money pages and ≥1 marketplace page. No post ships without a named author and a real SA example. Quality over cadence — 50 excellent posts in 6 months beats 200 thin ones.

### 50 ideas by cluster (★ = P1 by value × winnability)

**Cluster A — WhatsApp selling (→ /sell-on-whatsapp, /whatsapp-catalog):**
1.★ How to sell on WhatsApp in South Africa (2026 playbook) 2.★ WhatsApp Business catalogue limits — and how to outgrow them 3.★ How to move your WhatsApp catalogue online in 10 minutes 4. WhatsApp Status selling: what works in SA 5. How to stop answering "how much?" 100 times a day 6. WhatsApp group selling etiquette that gets you unmuted 7. Broadcast lists vs groups vs catalogue links 8. How to take orders on WhatsApp without losing track 9.★ WhatsApp Business vs WhatsApp Business API for SA sellers 10. Auto-replies that sell while you sleep

**Cluster B — Start selling online (→ /sell-online-south-africa, /create-online-shop):**
11.★ How to start selling online in SA with R0 12.★ How to create an online shop in South Africa (free, step-by-step) 13. What to sell online in SA: 25 products that move 14. Side hustle to real business: registering with CIPC 15. How to price products for SA buyers 16.★ Getting paid safely: PayFast, EFT, COD compared 17. How to handle delivery: courier vs PUDO vs collection 18. Online selling and SARS: what small sellers must know 19. From Instagram DMs to your own shop link 20. Selling from home in SA: licences, logistics, sanity

**Cluster C — Comparisons (→ /compare/*, /ecommerce-for-small-business):**
21.★ Shopify alternatives for South Africa (honest comparison) 22.★ TradeFeed vs posting in WhatsApp groups 23. Takealot seller fees explained — and the alternative 24. Wix vs Shopify vs TradeFeed for SA small business 25. Facebook Marketplace vs your own shop link 26. Free vs paid online stores: what free actually gets you 27. Website builder vs catalogue link: which do you need? 28. Instagram shop vs WhatsApp shop in SA

**Cluster D — Category playbooks (→ /sell-online/[category]):**
29.★ How to sell clothing online in SA 30. How to sell sneakers online without getting burned 31. Selling beauty products online in SA: regulations + trust 32. How to sell electronics online (and prove they're legit) 33. Selling baked goods / food on WhatsApp legally 34. Thrift & vintage reselling in SA: sourcing to selling

**Cluster E — Wholesale (→ marketplace wholesale + category pages):**
35.★ Jeppe Street wholesale: the online buyer's guide 36. How to find legit wholesale suppliers in SA 37. Durban wholesale district guide 38. How resellers price wholesale-to-retail 39. Bulk buying scams in SA and how to avoid them

**Cluster F — Trust & safety (→ verified-seller page, marketplace):**
40.★ How to spot online shopping scams in SA 41. What "verified seller" actually means on TradeFeed 42. How POPIA protects you when you shop via WhatsApp 43. Safe payment methods for buying from small sellers

**Cluster G — Local (→ province pages):**
44.★ Selling online in Gauteng: the complete local guide 45. Cape Town's online seller scene 46. Durban: from Warwick to WhatsApp 47. Selling online from a small town in SA

**Cluster H — Product craft (→ /ai-product-listings):**
48.★ Phone product photography that sells (SA light, SA budgets) 49. Product descriptions that sell — and how AI drafts them 50. Background removal: why clean photos outsell busy ones

### 12 content briefs (compact, execution-ready)

| # | Title / URL | Target keyword | Intent | H2 outline | Links to | CTA |
|---|---|---|---|---|---|---|
| 1 | How to sell on WhatsApp in SA — `/blog/how-to-sell-on-whatsapp` | how to sell on whatsapp | MOFU | Why WhatsApp selling stalls · The catalogue-link method · Setup (HowTo schema) · Taking orders · Getting paid · Mistakes · FAQ | /sell-on-whatsapp, /whatsapp-catalog, /import-whatsapp-catalogue | Create free shop |
| 2 | Move your WhatsApp catalogue online — `/blog/move-whatsapp-catalogue-online` | import whatsapp catalogue | BOFU | What transfers · 10-min walkthrough · Before/after · What buyers see · FAQ | /import-whatsapp-catalogue (primary) | Import now |
| 3 | Start selling online with R0 — `/blog/start-selling-online-free-south-africa` | start selling online south africa | MOFU | The R0 stack · Photo→listing→link · First 10 customers · Getting paid · Scaling signals | /sell-online-south-africa, /create-online-shop, pricing | Free shop |
| 4 | Shopify alternatives for SA — `/blog/shopify-alternatives-south-africa` | shopify alternative south africa | MOFU | What Shopify costs in rand (real total) · What SA sellers actually need · 5 alternatives compared (honest, incl. non-TradeFeed) · Who should still pick Shopify · FAQ | /compare/shopify-alternative-south-africa, /ecommerce-for-small-business | Try free |
| 5 | Getting paid safely — `/blog/get-paid-safely-selling-online-sa` | how to get paid selling online south africa | TOFU | Payment options compared · PayFast walkthrough · COD rules of thumb · Scam patterns · FAQ | /sell-online-south-africa, trust page | Free shop |
| 6 | Jeppe Street online guide — `/blog/jeppe-street-wholesale-online` | jeppe street wholesale | BOFU(buyer) | History 1-para · How to buy without going (verified sellers) · Top categories · Spotting legit wholesalers · FAQ | /marketplace/gauteng, clothing category | Browse Gauteng shops |
| 7 | Sell clothing online in SA — `/blog/sell-clothing-online-south-africa` | sell clothes online south africa | MOFU | Sourcing · Sizing over WhatsApp (kill the back-and-forth) · Photos · Pricing · Real seller case | /sell-online/clothing, /sell-online-south-africa | Free shop |
| 8 | Phone product photography — `/blog/product-photos-with-your-phone` | product photography phone | TOFU | Light · Backgrounds (and auto-removal) · Angles per category · Editing free apps · Before/after gallery | /ai-product-listings | Try AI listings |
| 9 | TradeFeed vs WhatsApp groups — `/blog/tradefeed-vs-whatsapp-groups` | selling in whatsapp groups | MOFU | What groups are great at · Where sales die · Side-by-side (post vs storefront) · Keep groups, add a link · FAQ | /compare/whatsapp-groups, /sell-on-whatsapp | Get your link |
| 10 | Verified seller explained — `/blog/what-verified-seller-means` | tradefeed verified seller | Brand | What we check · What the badge shows buyers · How to get verified · Buyer protection reality | verified program page, marketplace | Browse verified |
| 11 | Selling online in Gauteng — `/blog/selling-online-gauteng` | sell online gauteng | MOFU | Gauteng's buyer market · Local delivery options · Wholesale sourcing nearby · Local seller cases | /sell-online/gauteng, /marketplace/gauteng | Free shop |
| 12 | Takealot fees vs alternatives — `/blog/takealot-seller-fees-alternatives` | takealot seller fees | MOFU | Fee structure explained (sourced, current) · Margin math example · When Takealot wins · When your own link wins · FAQ | /ecommerce-for-small-business, pricing | Compare free |

---

## 10. Comparison SEO

| Page | Worth it? | Intent | Conversion value | Caution | Structure |
|---|---|---|---|---|---|
| `/compare/shopify-alternative-south-africa` | **Yes, P1** | High (switchers/price-shocked) | Very high | Name Shopify factually; cite their public ZAR/USD pricing with dates; no disparagement, only verifiable comparisons | Cost table in rand · feature fit for SA · migration path · who should still use Shopify (honesty = trust = rankings) |
| `/compare/whatsapp-groups` (vs posting in groups) | **Yes, P1** | High — your actual #1 competitor is the status quo | Very high | None — it's a method, not a brand | Day-in-the-life split: group seller vs link seller · buried-post math · trust gap · "keep your groups, add a link" |
| `/compare/social-only-selling` (Instagram/Facebook-only) | Yes, P2 | Medium-high | High | Factual platform limits only | Algorithm dependence · no search presence · checkout friction · hybrid playbook |
| Manual catalogue selling (PDF/screenshot catalogues) | Yes, P2 — fold into whatsapp-catalog page or standalone | Medium | High | None | Stale-PDF problem · update-once vs resend-always |
| Shopify alternative SA (blog listicle, idea #21) | Yes — pairs with the compare page; listicle catches "alternatives" plural | Medium | Medium-high | Include real competitors honestly or the page won't earn links | 5 options, TradeFeed positioned for the WhatsApp-first segment |
| Wix/WordPress comparisons | Blog-only, P3 | Medium | Medium | Same factual-claims rule | Capture and segue |
| Takealot comparison | Blog-only (brief #12), P2 | High | Medium-high (different model — complement, not substitute) | Fees change; date-stamp and review quarterly | Fees math + "own your customer" angle |

**Legal/brand rules for all:** nominative use of competitor names only, no logos without permission, every claim sourced and dated, update quarterly, `Article` schema not `Product`.

---

## 11. Technical SEO Blueprint

| Item | Action (specific to this codebase) | Priority |
|---|---|---|
| Indexation guards | `noindex` via metadata API on: `/dashboard/*`, `/admin/*`, `/orders`, `/pay/*`, `/track/*`, `/sign-in`, `/sign-up`, `/create-shop`, wholesale-register, all `?sort/?verified/?minPrice/?page` states (canonical to clean URL) | **Critical** |
| Inventory-gated noindex | Implement the §5 gates (province/city/storefront/product thresholds) as a shared `shouldIndex()` helper used in `generateMetadata` | **Critical** |
| robots.txt | Allow all public; `Disallow: /dashboard, /admin, /api` (except `/api/og`, `/api/img` — image proxy must stay crawlable for Google Images); declare sitemap | **Critical** |
| XML sitemaps | Split: `sitemap-pages.xml` (money/editorial), `sitemap-marketplace.xml` (categories, gated geo), `sitemap-shops.xml`, `sitemap-products.xml` (only index-qualifying, `lastmod` from `updatedAt`); regenerate on ISR cadence | **Critical** |
| Canonicals | Already partial (category param → clean URL). Extend to: all filtered marketplace states, product slug-vs-id (301 id→slug), and **custom domains: seller custom domain becomes canonical for that shop, `/catalog/[slug]` canonicals to it** (sellers paid for their brand; you keep marketplace links pointing at them = partnership, and you avoid duplicate-content dilution). If business prefers keeping equity, invert — but pick ONE policy globally | **Critical** |
| Search Console | Verify domain property; submit sitemaps; monitor Page Indexing weekly for "Crawled — not indexed" (early thin-content alarm); set up regex filters for /catalog/ vs money pages | **Critical** |
| Structured data | Have: Product/Offer, shop JSON-LD, FAQ (landing), marketplace ItemList. Add: `Organization` sitewide (logo, sameAs, contactPoint), `BreadcrumbList` everywhere, `HowTo` on import + sell-on-whatsapp, `AggregateRating` where review thresholds met. Validate in Rich Results Test per template | **High** |
| Core Web Vitals | Next.js + ISR is solid. Watch: framer-motion on old shells (flag swap removes it), Fontshare request (already gated by flag + `display=swap`), hero image priority flags (done in TF kit). Budget: LCP <2.5s on mid-range Android over 3G — test with WebPageTest Mzansi profiles | **High** |
| JS rendering risk | App Router SSR/ISR means content is server-rendered — low risk. Keep money pages fully server-rendered (TF components already are); never gate primary content behind client-only fetches | **High** |
| Image SEO | Descriptive alt from product `altText` (wired); meaningful filenames in upload pipeline if possible; `/api/img` proxy already enables Googlebot-Image — keep it; product image sitemaps inside sitemap-products | **High** |
| Pagination | Marketplace infinite scroll: ensure `?page=N` URLs exist server-rendered for crawlers (load-more is client action) with self-canonical + `noindex,follow` beyond page 1, or canonical-to-page-1 — pick one, document it | **High** |
| Redirect rules | 301 id-based product URLs → slug; 301 dead shops → category page (not home); preserve `/import-whatsapp-catalogue` forever | **High** |
| Duplicate templates | Province/city/category intros must differ in data AND prose (§5); run quarterly near-duplicate audit (Screaming Frog content similarity) | **Medium** |
| Empty categories | Category with 0 products: `noindex,follow` + "be the first seller" module (seller-acquisition CTA turns a dead end into a lead) | **Medium** |
| Faceted filters | Already param-based; after canonicals proven in GSC, add robots disallow for the noisiest combos only if crawl stats show waste | **Medium** |
| Mobile UX | TF redesign covers 44px targets/viewport; verify no interstitials block content (cookie consent must be dismissible, small) | **Medium** |
| Multilingual | next-intl exists; keep UI translations out of indexable URL space until demand proven (no /zu/ URLs yet); `hreflang` deferred | **Low** |
| Custom-domain hygiene | Seller domains: auto-provision SSL, generate per-domain sitemap + robots, inject canonical per policy above, block staging | **Medium** |

---

## 12. Internal Linking Plan

**Model: hub-and-spine.** Homepage is the hub; the footer "For sellers" + "Browse by province" blocks are the spine reaching every money and geo page from every URL on the site (footer = sitewide, including all UGC pages — thousands of storefront/product pages all voting for the 8 money pages).

```
Homepage ──► all 8 money pages ──► pricing ──► signup
   │              ▲    ▲
   │              │    └── every blog post (≥2 links/post, in-body, descriptive anchors)
   │              └────── comparison pages
   ├──► /marketplace ──► categories ──► storefronts ──► products
   │         │              ▲              │
   │         └─► provinces ─┘              └─► related products, back to category
   └──► case studies ──► money pages
```

Rules:
- **Money pages link laterally** to each other where intent genuinely adjoins (sell-on-whatsapp ↔ whatsapp-catalog ↔ import) — 2–4 lateral links each, no more.
- **Blog → money:** every post body links ≥2 money pages with keyword-relevant anchors ("create a free online shop", not "click here").
- **Marketplace → SaaS bridge:** storefront recruitment module (exists in redesign) + empty-category "be the first seller" + product-page footer "Sell items like this" → category seller page. This converts buyer traffic into seller pipeline — the highest-leverage links on the site.
- **Geo cross-links:** province seller page ↔ province buyer page (one link each way), city → parent province.
- **Authority pushing:** when a blog post earns external links, add/update its in-body links to the money page you most want lifted that quarter. Review link flow quarterly in GSC's internal links report; the top 8 internally-linked pages should BE the money pages — if a utility page outranks them, fix the template.

---

## 13. E-E-A-T and Trust Strategy

- **Company credibility:** real About page — who built TradeFeed, why, where (city), company registration number. SA buyers check. Founder LinkedIn linked via `sameAs`.
- **Contact/support:** visible contact page with response-time promise; support email + WhatsApp line in footer sitewide.
- **POPIA/security:** keep POPIA + SSL signals (already in footer); add a plain-English privacy summary atop the legal text; "your number is never shown publicly" promise on seller pages — it's a differentiator, say it loudly.
- **Testimonials/success stories:** `/sellers/[story]` — named sellers, city, photo, numbers ("orders went from 4/week in groups to 31/week"). One per month minimum. These are simultaneously E-E-A-T, money-page trust blocks, and digital-PR ammunition.
- **Proof of growth:** live, honest counters (the redesign removed inflation — keep it that way). Publish a quarterly "TradeFeed seller index" (see §14) — public data = institutional trust.
- **Marketplace legitimacy:** verified-seller program page (what's checked, what the badge means, how to report a seller); reviews "from confirmed orders" labeling (already in redesign copy); visible dispute/report flow.
- **Editorial standards:** /editorial-policy once blog scales — how content is researched, updated, by whom; date-stamped posts with change logs on comparison pages.
- **Author profiles:** every post gets a real author page (name, role, LinkedIn). No "Admin", no fake personas — that's the AI-slop tell.
- **SA-specific:** prices always in ZAR, examples always local (PayFast, PUDO, Jeppe, CIPC, SARS), provinces named correctly, en-ZA spelling ("catalogue" buyer-facing — note the site mixes catalog/catalogue; standardize buyer-facing to SA English, keep US spelling only in code).

---

## 14. Link Earning Strategy

1. **Quarterly data study — "The South African WhatsApp Commerce Report":** anonymized marketplace data (top categories by province, average order values, reply-time vs sales correlation, COD vs PayFast splits). Nobody has this data. Pitch to BusinessTech, MyBroadband, Daily Investor, News24 Business, Ventureburn, Memeburn — these outlets cover SA tech/SME data hungrily. One report = 10–30 quality SA links/quarter. **The single highest-ROI link asset available to you.**
2. **Founder-led startup story:** "why we built a WhatsApp-first answer to Shopify for SA" — pitch Ventureburn, Disrupt Africa, TechCabal (SA angle), 702/CapeTalk SME slots.
3. **Seller success PR:** local angle per story — a Soweto sneaker seller's growth story pitched to Sowetan/local titles; township-economy media love these and they link.
4. **SME ecosystem partnerships:** NSBC, SEDA-adjacent content, Heavy Chef, SME South Africa — guest expertise on WhatsApp commerce (bylined, not paid).
5. **Linkable tools:** free markup/pricing calculator for resellers; "WhatsApp catalogue limit checker"; product-photo background remover lite. Tools earn passive links for years.
6. **Directories/citations (foundation, not strategy):** Google Business Profile, Bing Places, SA startup directories (StartupList Africa, etc.), Clutch-style SaaS listings, chamber memberships (JCCI). One-time sweep, NAP-consistent.
7. **Education partnerships:** free "sell online" workshop materials for entrepreneur programmes (Raymond Ackerman Academy-type orgs) — .org/.ac.za links.
8. **HARO-equivalent / journalist requests:** founder answers SA ecommerce queries (#journorequest ZA Twitter/X, Qwoted) — steady DR trickle.

No directories-for-links spam, no guest-post marketplaces, no link exchanges, no sponsored-post networks. A young .co.za domain survives on earned links only.

---

## 15. Local SEO Layer

- **Province hubs (buyer):** exist — gate + enrich per §5.1.
- **Province seller-acquisition pages:** `/sell-online/[province]` ×9 — "Sell online in Gauteng": local buyer stats from your data, delivery/courier realities, local seller stories, local wholesale sourcing pointer. Hybrid pages, hand-finished. P1 for Gauteng/WC/KZN; rest follow.
- **City pages:** buyer side gated (§5.2); seller side only for JHB, CPT, DBN, PTA initially — beyond that, intent merges with province.
- **Local trust/citations:** GBP for TradeFeed HQ (category: software company / e-commerce service); encourage verified sellers to mention their TradeFeed shop link in their own GBP listings (their citations carry your URL).
- **Location content:** clusters E + G (§9) — Jeppe Street, Durban wholesale, Gauteng seller guide — give the geo pages something to be linked FROM, which empty templates never earn.

---

## 16. 90-Day Execution Plan

*Roles: F = founder, D = developer, C = content writer/freelance, S = SEO lead (can be F+agency-of-one). Lean team assumed.*

### Days 1–14 — Stop the leaks, claim the base
| Action | Impact | Owner | Effort |
|---|---|---|---|
| Indexation guards: noindex private/param/thin routes; robots.txt; split sitemaps; GSC verified + submitted | Protects everything else; crawl budget to real pages | D | M |
| Strip keyword-stuffed metadata; rewrite homepage + marketplace titles/descriptions per §6 | Immediate CTR + relevance | S | S |
| Fix number inconsistencies in metadata (100+ → real) | Trust integrity | D | S |
| Implement `shouldIndex()` inventory gates on province/city/storefront/product | Kills thin-page risk at the root | D | M |
| Organization + Breadcrumb schema sitewide | Entity clarity | D | S |
*Why now: nothing built later compounds on a polluted index.*

### Days 15–30 — Money pages, wave 1
| Action | Impact | Owner | Effort |
|---|---|---|---|
| Ship `/sell-on-whatsapp`, `/whatsapp-catalog`; expand `/import-whatsapp-catalogue` | Claims the moat cluster | C+S, D template | L |
| Ship `/sell-online-south-africa`, `/create-online-shop` | Claims the head cluster | C+S | L |
| Homepage footer spine (money links + province links) sitewide | Authority distribution from day one | D | S |
| Promote `/pricing` to real URL with FAQ schema | Brand SERP + free-intent | D | S |
| First 2 blog posts (briefs 1, 3) | Feeds money pages | C | M |
*Dependency: Days 1–14 metadata hygiene done, so new pages launch clean.*

### Days 31–60 — Comparisons, proof, local
| Action | Impact | Owner | Effort |
|---|---|---|---|
| `/compare/shopify-alternative-south-africa` + `/compare/whatsapp-groups` | Switcher capture | C+S | M |
| 3 seller success stories `/sellers/*` + About page + author pages | E-E-A-T foundation | F+C | M |
| `/sell-online/gauteng`, `/western-cape`, `/kwazulu-natal` | Local seller capture | C | M |
| Enrich the 3–4 province/city buyer pages that pass gates | Local buyer capture | C+D | M |
| Blog cadence: briefs 2, 4, 5, 9 | Cluster depth | C | M |
| Citations sweep + GBP | Foundation links | S | S |
*Why now: money pages need trust blocks (stories) and link targets before PR starts.*

### Days 61–90 — Authority + marketplace depth
| Action | Impact | Owner | Effort |
|---|---|---|---|
| WhatsApp Commerce Report #1 (data study) + media pitch round | First real links; brand searches | F+S | L |
| `/ai-product-listings` + `/custom-domain` + `/ecommerce-for-small-business` | Complete money set | C+S | M |
| Category page intros + FAQs (top 6 categories) | Marketplace relevance | C | M |
| Remaining 6 province seller pages; `/sell-online/[category]` ×6 | Programmatic-hybrid expansion | C | L |
| Blog briefs 6, 7, 8, 10–12 | Full cluster coverage | C | M |
| GSC review: prune/fix "crawled-not-indexed"; quarterly duplicate audit | Compounding hygiene | S | S |
*Exit position at day 90: clean index, 8 money pages live, 2 comparison pages, ~12 posts, first PR links, gated programmatic base — the compounding machine assembled.*

---

## 17. Final Prioritization Table

| Priority | Initiative | Page/Area | SEO Impact | Revenue Impact | Effort | Speed to Value | Why This Matters |
|---|---|---|---|---|---|---|---|
| 1 | Indexation guards + sitemaps + GSC | Sitewide technical | Very high | Indirect-high | M | Days | Everything compounds on index quality; thin UGC is the #1 existential SEO risk |
| 2 | WhatsApp money pages (sell-on-whatsapp, whatsapp-catalog, import) | 3 pages | Very high | Very high | M | 2–6 wks | Winnable now, perfect fit, zero local competition — the moat |
| 3 | Sell-online + create-shop money pages | 2 pages | Very high | Very high | M | 4–8 wks | Highest-volume seller intent; ends homepage cannibalization |
| 4 | Metadata de-stuffing + honest numbers | Home, marketplace | High | Medium | S | Days | CTR + trust; removes spam-pattern signals |
| 5 | Footer linking spine | Sitewide | High | Indirect | S | Days | Thousands of UGC pages start voting for money pages |
| 6 | Shopify-alternative + vs-groups comparisons | 2 pages | High | Very high | M | 4–8 wks | Switchers are the cheapest conversions in SEO |
| 7 | Seller stories + About + authors | Trust layer | Medium-high | High | M | 2–4 wks | E-E-A-T floor for money pages + PR ammunition |
| 8 | Province seller pages (top 3) | /sell-online/[province] | High | High | M | 4–6 wks | Near-zero competition local intent |
| 9 | Inventory-gated geo/storefront/product indexation | Marketplace UGC | High | Medium | M | Days–wks | Turns programmatic from liability into compounding asset |
| 10 | Quarterly data study + digital PR | Off-page | Very high (links) | Medium | L | 8–12 wks | The only scalable white-hat authority source for a young .co.za |
| 11 | Blog engine (2/wk, brief-driven) | /blog | Medium-high | Medium | Ongoing | 6–12 wks | Feeds every money page; builds topical authority in WhatsApp commerce |
| 12 | AI listings + custom domain + SMB pages | 3 feature pages | Medium | Medium-high (upgrades) | M | 6–10 wks | Completes commercial coverage; supports paid-tier revenue |
| 13 | Category intros + marketplace enrichment | /marketplace/category/* | Medium | Medium (GMV) | M | 6–10 wks | Buyer long-tail; converts buyers into seller pipeline |
| 14 | Custom-domain canonical policy | Seller domains | Medium | Medium | S–M | Before scale | Prevents a duplicate-content mess that's expensive to unwind later |
| 15 | Linkable tools (calculators) | /tools | Medium (passive links) | Low-medium | M | 3–6 mo | Evergreen link equity with zero outreach cost |

---

*Operating cadence: GSC indexing review weekly, content shipping weekly, link/PR push quarterly around the data study, full technical + duplicate audit quarterly. Revisit the "do not chase" list (buyer head terms, multilingual, mass programmatic) at 500 and 1,000 active sellers — those numbers, not the calendar, unlock the next phase.*
