# TradeFeed Product Audit

**Date**: 2026-03-17  
**Version**: 1.0  
**Scope**: Full platform analysis — architecture, features, scalability, gaps

---

## 1. Platform Overview

TradeFeed is a multi-tenant WhatsApp-commerce marketplace built on Next.js 16 (App Router), PostgreSQL (Prisma ORM), and Clerk authentication. It enables South African small businesses to create online catalogs from WhatsApp selling and receive structured orders.

**Core Value Proposition**: "Shopify for WhatsApp sellers in Africa"

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript 5.9.3 (strict mode) |
| Database | PostgreSQL (Prisma 6.19.2, row-level tenant isolation) |
| Auth | Clerk 6.38.2 (webhook sync, JWT sessions) |
| Payments | PayFast (REST API, ITN webhooks) |
| Storage | Uploadthing 7.7.4 (CDN image hosting) |
| AI | OpenAI GPT-4o-mini (product descriptions, seller sequences) |
| i18n | next-intl (en, zu, xh, af, st) |
| Monitoring | Sentry 10.40.0, Vercel Analytics |
| Rate Limiting | Upstash Redis (distributed, edge-compatible) |

### Architecture
- **31 Prisma models** organized around shops, products, orders, marketplace, analytics
- **Multi-tenant**: Every query scoped by `shopId` — zero cross-shop leakage
- **24 server action modules** for business logic
- **5 South African languages** supported
- **Service Worker** for offline catalog browsing

---

## 2. Strengths

### 2.1 Multi-Tenant Architecture (⭐ Strong)
- Row-level isolation via `shopId` enforced at data access layer
- Every DB function requires `shopId` — no exceptions
- Soft deletes on orders for recovery without data loss
- ShopUser join table supports OWNER/MANAGER/STAFF roles

### 2.2 Marketplace Discovery Engine (⭐ Strong)
- Full product discovery with category/price/province filtering
- Promoted listing interleaving (Boost R49/wk, Featured R149/wk, Spotlight R399/wk)
- Trending rankings, featured shops carousel
- Global category tree (hierarchical, admin-managed)

### 2.3 WhatsApp-Native Commerce (⭐ Core Differentiator)
- Pre-filled WhatsApp order messages
- No app download required for buyers
- Short links (/s/[shortlink]) for WhatsApp-friendly sharing
- AI Sales Assistant (GPT-4o-mini) for automated buyer conversations
- Seller sequence automation (welcome, nudges, monthly summaries)

### 2.4 Revenue Model (⭐ Diversified)
6 monetization channels already built:
1. **Subscriptions** — Free/Pro/Business tiers
2. **Promoted Listings** — 3 tiers with impression/click tracking
3. **Transaction Fees** — R7.50 flat per buyer payment
4. **Seller Sequences** — Automated WhatsApp marketing
5. **Theme Customization** — Pro-only feature gate
6. **Wholesale Features** — B2B pricing tiers

### 2.5 SEO Foundation (⭐ Good)
- Dynamic sitemap (shops + products + categories)
- JSON-LD structured data (Product, BreadcrumbList, ItemList, FAQPage, Organization)
- Dynamic OG images per shop/product
- Canonical URL management
- Google Merchant Center XML feed

### 2.6 Compliance & Security (⭐ Good)
- POPIA-compliant (data retention automation, PII handling)
- CSP headers with per-request nonces
- Rate limiting (Upstash Redis)
- Clerk webhook signature verification (Svix)
- Cookie consent banner

### 2.7 Internationalization (⭐ Unique for Africa)
- 5 South African languages (English, isiZulu, isiXhosa, Afrikaans, Sesotho)
- 500+ translations per locale
- Cookie-based locale persistence
- Language-aware meta tags

---

## 3. Weaknesses

### 3.1 Vertical Lock-In (🔴 Critical)
- Product variants hardcoded to **Size/Color** (clothing-specific)
- Schema supports generic option1Label/option2Label but UX is clothing-focused
- Expanding to food, electronics, beauty requires UX generalization
- Category system tied to fashion taxonomy

### 3.2 No CI/CD Pipeline (🔴 Critical)
- No automated testing in GitHub Actions
- Manual QA only — regression risk is high
- No type-check or lint enforcement on push
- Unit test coverage is minimal

### 3.3 Limited Seller Onboarding (🟡 Medium)
- Shop creation is one-step but requires desktop-style form
- No guided wizard or progressive onboarding
- No WhatsApp-based shop creation flow
- Product creation requires manual data entry (no import from WhatsApp)

### 3.4 Payment Limitations (🟡 Medium)
- PayFast only — no mobile money (M-Pesa, Airtel Money)
- No cash-on-delivery option
- No installment payments (SnapScan, Payflex)
- ZAR currency only — no multi-currency support

### 3.5 Analytics Gaps (🟡 Medium)
- Marketplace analytics has shopId/slug mismatch bug (PLAN.md P0)
- No cohort analysis or retention metrics
- No seller benchmarking against category averages
- Real-time dashboard not available

### 3.6 Search Limitations (🟡 Medium)
- PostgreSQL `ILIKE` for search — no fuzzy matching
- No autocomplete/suggestions
- tsvector planned but not fully utilized
- No spelling correction or synonym support

### 3.7 Social Features Missing (🟡 Medium)
- No buyer accounts/profiles (guest-only ordering)
- No social proof beyond reviews (no "X people viewing this")
- No buyer-to-buyer recommendations
- No community features (forums, groups)

### 3.8 Middleware Deprecation (🟡 Technical Debt)
- Next.js 16 deprecates middleware.ts → needs proxy.ts migration
- Dead dev auth module still in repo

---

## 4. Scalability Concerns

### 4.1 Database
| Concern | Risk | Mitigation |
|---------|------|-----------|
| Single PostgreSQL instance | 🟡 Medium | Neon/Supabase pooling helps; may need read replicas at 10K+ shops |
| No table partitioning | 🟡 Medium | AnalyticsEvent and Order tables will grow large; partition by date |
| Row-level isolation (no schema separation) | 🟢 Low | Works well up to 100K+ shops; consider read replicas before sharding |

### 4.2 Search
| Concern | Risk | Mitigation |
|---------|------|-----------|
| PostgreSQL ILIKE for full-text | 🟡 Medium | Migrate to tsvector (already indexed) or Meilisearch |
| No search index service | 🔴 High at scale | At 50K+ products, need dedicated search (Algolia/Typesense) |

### 4.3 Media
| Concern | Risk | Mitigation |
|---------|------|-----------|
| Uploadthing CDN dependency | 🟢 Low | Reliable CDN; consider self-hosted S3 backup |
| No image compression pipeline | 🟡 Medium | Next.js image optimization handles runtime; need pre-upload compression |
| No video support | 🟡 Medium | Product videos increasingly expected; needs CDN + compression strategy |

### 4.4 Real-time
| Concern | Risk | Mitigation |
|---------|------|-----------|
| No WebSocket/SSE for live updates | 🟡 Medium | Order status, stock changes need real-time at scale |
| Polling-based analytics refresh | 🟢 Low | Acceptable for MVP; SSE for dashboard at scale |

---

## 5. Missing Marketplace Features

### 5.1 Buyer Experience
- [ ] **Buyer accounts** — Login, order history, saved addresses, wishlists
- [ ] **Product comparison** — Side-by-side feature/price comparison
- [ ] **Recently viewed** — Persistent browsing history (partially built in lib/recently-viewed/)
- [ ] **Price alerts** — Notify buyer when price drops
- [ ] **Bulk buying** — Multi-seller cart (currently per-shop only)
- [ ] **Buyer protection** — Escrow, dispute resolution

### 5.2 Seller Tools
- [ ] **WhatsApp product import** — Create products by sending photo + price via WhatsApp
- [ ] **AI product builder** — Auto-generate name, description, tags from photo
- [ ] **Inventory sync** — Auto-deduct stock from WhatsApp sales
- [ ] **Multi-channel selling** — Sync to Facebook Shop, Instagram, TikTok
- [ ] **Competitor pricing** — See similar products' price ranges
- [ ] **CRM** — Customer database, purchase history, segments
- [ ] **Invoicing** — Auto-generate PDF invoices from orders
- [ ] **Delivery management** — In-app courier booking, label printing

### 5.3 Platform Features
- [ ] **Seller verification tiers** — Bronze/Silver/Gold based on activity + reviews
- [ ] **Dispute resolution** — Buyer-seller mediation workflow
- [ ] **Marketplace chat** — In-app messaging (not just WhatsApp redirect)
- [ ] **Flash sales/events** — Time-limited marketplace-wide sales
- [ ] **Location-based discovery** — /city/{city-name} pages with local shops
- [ ] **Affiliate program** — Earn commission by referring buyers to products
- [ ] **Seller leaderboard** — Gamification for top sellers
- [ ] **API for integrators** — Public REST API for third-party integrations

---

## 6. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    BUYER EXPERIENCE                      │
│  Landing → Marketplace → Shop Catalog → Product → Cart  │
│                    ↓ WhatsApp Order ↓                    │
└───────┬─────────────────────────────────────┬───────────┘
        │                                     │
┌───────▼──────────┐            ┌─────────────▼──────────┐
│   SELLER TOOLS   │            │     ADMIN PANEL        │
│  Dashboard       │            │  Shops / Categories    │
│  Products CRUD   │            │  Promotions Revenue    │
│  Orders          │            │  Users / Analytics     │
│  Analytics       │            │  Content Moderation    │
│  Billing         │            │  Wholesale Approvals   │
│  Promotions      │            └────────────────────────┘
│  Wholesale       │
│  AI Chats        │
└───────┬──────────┘
        │
┌───────▼─────────────────────────────────────────────────┐
│                    PLATFORM SERVICES                     │
│                                                         │
│  Auth (Clerk) │ Payments (PayFast) │ Storage (UT)       │
│  AI (OpenAI)  │ Email (Resend)     │ SMS (WhatsApp API) │
│  Search (PG)  │ Cache (Upstash)    │ CDN (UT/Cloudinary)│
│  Monitoring (Sentry) │ Analytics (Vercel)               │
│                                                         │
└───────┬─────────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL + Prisma)              │
│  31 Models │ Row-level tenant isolation │ Strategic idx  │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Key Metrics to Track

| Metric | Current State | Target |
|--------|--------------|--------|
| Active Sellers | Early stage | 10,000 in 12 months |
| Products Listed | Growing | 500,000+ |
| Monthly GMV | Tracking | R10M+ |
| Buyer Conversion Rate | Unknown | 3-5% |
| Seller Retention (30d) | Unknown | 70%+ |
| Average Order Value | Unknown | R250+ |
| Marketplace Traffic (organic) | Growing | 100K sessions/month |
| Promoted Listing Revenue | Active | R500K/month |

---

## 8. Recommendations Summary

### Immediate (Week 1-2)
1. Fix marketplace analytics bug (P0)
2. Set up CI/CD pipeline
3. Migrate middleware.ts → proxy.ts

### Short-term (Month 1-2)
4. Build WhatsApp Product Import (killer feature for onboarding)
5. Add AI product builder
6. Implement location-based discovery pages
7. Launch seller referral program

### Medium-term (Month 3-6)
8. Generalize beyond clothing (variant system flexibility)
9. Add mobile money payments (expansion readiness)
10. Build buyer accounts and order history
11. Implement full-text search (Meilisearch/Typesense)
12. Launch affiliate program

### Long-term (Month 6-12)
13. Multi-currency support for Pan-African expansion
14. Public API for third-party integrations
15. Marketplace chat (reduce WhatsApp dependency)
16. Seller verification tiers and gamification
17. Flash sales and marketplace events
