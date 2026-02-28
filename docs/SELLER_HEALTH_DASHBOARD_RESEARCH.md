# Seller Performance Scoring & Health Dashboard Research

> **Research Date:** March 2026
> **Purpose:** Inform TradeFeed's seller health dashboard design
> **Status:** RESEARCH ONLY — no code changes

---

## 1. Shopify — Store Performance & Analytics Dashboard

### Metrics Used
| Category | Metrics |
|---|---|
| **Sales** | Average Order Value (AOV), Units Per Transaction (UPT), Year-over-Year growth, Sales per Employee, Sales per Square Foot |
| **Inventory** | Inventory Turnover Ratio, Sell-Through Rate, GMROI (Gross Margin Return on Investment) |
| **Customers** | Customer Lifetime Value (CLV), Sessions & Visitors, Conversion Rate |
| **Operational** | Foot Traffic, Sales by Channel, Sales by Staff at Register |

### How They Surface Insights
- **Customizable card-based dashboard** — merchants drag/drop metric cards, resize them, and organize into named sections
- **Metrics Library sidebar** — every report has a corresponding dashboard card; merchants pick what matters to them
- **Comparison mode** — date-range picker with "Compare to: Previous year/period" toggle shows % change overlays
- **Sparkline graphs on each card** — small trend visualizations inline with the number
- **Rolling & fixed date ranges** — down to 1-minute granularity for live events (e.g. flash sales)
- **Auto-refresh** (every 60 seconds) when today is in the selected range
- **Data disruption icons** — ⚠️ warning / ❗ critical badges on cards when data is incomplete or delayed

### What They Avoid
- **No single "health score"** — Shopify never reduces the store to one number; they present a dashboard of independent KPIs
- **No punitive thresholds** — metrics are presented as information, not pass/fail gates
- **No prescriptive actions inline** — the dashboard is data-first; advice lives in the Seller Handbook, not the dashboard itself
- **No overwhelming defaults** — the default dashboard is curated; the full metrics library is opt-in

### UX Patterns
- Metric cards (number + sparkline + % change)
- Drag-and-drop customization
- Collapsible sections with custom labels
- Date range picker with presets (Today, Last 7 days, BFCM, etc.)
- Comparison overlays (previous period shading)
- Mobile-responsive (customization is desktop-only, but layout renders on mobile)

---

## 2. Amazon — Seller Account Health Dashboard

### Metrics Used
| Metric | Target | Consequence |
|---|---|---|
| **Order Defect Rate (ODR)** | < 1% | Account deactivation |
| **Cancellation Rate (CR)** | < 2.5% | Account deactivation |
| **Late Dispatch Rate (LDR)** | < 4% | Warning or deactivation |
| **On-Time Delivery Rate (OTDR)** | > 97% | Advisory (no penalty yet) |
| **Valid Tracking Rate (VTR)** | High % | Policy compliance |
| **Return Dissatisfaction Rate (RDR)** | < 10% | Advisory |
| **Invoice Defect Rate (IDR)** | Low % | Business customer compliance |

### Account Health Rating (AHR)
- **Single composite rating** with three statuses: **Good**, **At Risk**, **Critical**
- Based on adherence to Amazon's selling policies plus unresolved policy violations
- Available only to Professional sellers

### How They Surface Insights
- **Traffic-light system** — Green (Good) / Yellow (At Risk) / Red (Critical) at the top of the Account Health page
- **Per-metric breakdown** — each metric shown with current value, target threshold, and status icon
- **Time-window context** — ODR measured over 60 days, CR over 7 days, LDR over 10 and 30 days
- **Policy violations list** — unresolved violations displayed with deadlines to respond
- **Alerts** — notifications when metrics approach or breach thresholds

### What They Avoid
- **No vanity metrics** — only metrics that directly affect account standing are shown
- **No customization** — the dashboard is fixed; Amazon decides what matters
- **No positive reinforcement** — there's no "great job" badge or reward for exceeding targets (it's purely compliance-driven)
- **No gradual degradation** — you're either in compliance or you're not

### UX Patterns
- Status badge at top (Good / At Risk / Critical)
- Threshold bars (current value vs. target line)
- Color-coded status per metric (green/yellow/red)
- Violation cards with countdown timers
- Rigid, non-customizable layout
- Deep drill-down into individual orders that caused defects

---

## 3. Etsy — Star Seller Program & Shop Dashboard

### Metrics Used
| Criteria | Threshold | Period |
|---|---|---|
| **Message Response Rate** | ≥ 95% replied within 24 hours | Rolling 90 days |
| **Average Review Rating** | ≥ 4.8 out of 5.0 | Rolling 90 days |
| **On-Time Shipping & Tracking** | ≥ 95% shipped on time with tracking | Rolling 90 days |
| **Minimum Sales** | ≥ 5 orders AND ≥ $300 in revenue | Rolling 90 days |

### How They Surface Insights
- **Star Seller Badge** — visible on shop page and individual listings; acts as social proof to buyers
- **Progress dashboard in Shop Manager** — shows each criterion with current % and whether it's met
- **Rolling 90-day evaluation** — e.g., August badge based on May 1 – July 31 performance
- **Sub-badges for partial achievement** — "Smooth Shipping", "Rave Reviews", "Speedy Replies" badges for sellers who excel in one area but not all
- **Monthly re-evaluation** — badge can be earned or lost each month

### What They Avoid
- **No composite score** — it's pass/fail on 4 independent criteria, not a blended number
- **No search ranking boost** — Etsy explicitly states Star Seller doesn't directly affect search ranking (reduces gaming incentive)
- **No penalty for missing** — losing the badge is the only consequence; no account suspension
- **No complexity** — only 4 metrics, all simple to understand

### UX Patterns
- Binary badge system (you have it or you don't)
- Progress bars per criterion (✅ met / ❌ not met)
- Percentage displays with clear thresholds
- Visual badge on storefront (buyer-facing trust signal)
- Sub-badges as incremental rewards
- Simple, mobile-friendly dashboard
- Tips and links to Seller Handbook for improvement

---

## 4. Stripe — Radar, Sigma & Business Insights

### Metrics Used (Business Intelligence)
| Category | Metrics |
|---|---|
| **Revenue** | Charge volume, Monthly Recurring Revenue (MRR), ARPU, cash flow changes |
| **Customers** | Active customers, customer count by region, unpaid invoices |
| **Risk** | Fraud rate, dispute rate, risk scores per transaction |
| **Operations** | Payout reconciliation, payment method distribution, subscription plan popularity |

### Radar (Fraud & Risk)
- **AI risk score on every transaction** — 0-100 score combining hundreds of signals
- **Network-level intelligence** — trained on $1.4T+ in annual payment volume; 92% of cards have been seen before on Stripe's network
- **Multi-layer signals** — device fingerprints, historical snapshots, proxy detection, checkout behavior, card network data
- **Fraud reduced by 38% on average** with Radar enabled

### How They Surface Insights
- **Sigma: SQL + AI query interface** — ask questions in natural language ("What was our charge volume in February?") and get instant reports
- **Prebuilt report templates** — ARPU, churn, payment method breakdown, dispute analysis
- **Dynamic chart visualization** — transform any query into charts
- **Risk score badge on every payment** — fraud teams see the score inline
- **Custom rules engine** — write rules to flag, block, or 3DS specific transactions
- **Dispute prevention dashboard** — alerts for potential chargebacks before they're filed
- **Collaborative features** — save, share, and schedule queries; publish reports to dashboard

### What They Avoid
- **No single "business health score"** — Stripe surfaces data and lets you build your own view
- **No prescriptive business advice** — they give you the data tools, not the strategy
- **No lock-in to specific views** — everything is customizable via SQL or AI prompts
- **No overwhelming defaults** — Radar works automatically with zero configuration; Sigma is opt-in for power users

### UX Patterns
- AI-powered natural language to SQL
- Risk score badges (per transaction)
- Custom rules editor with LLM assistant
- Prebuilt query templates
- Collaborative query sharing (Slack-like links)
- Scheduled report delivery to email
- Schema browser sidebar for data exploration
- Dashboard publishing (pin queries to dashboard)

---

## 5. SaaS Health Scoring Patterns (Custify, Gainsight)

### Metrics Used
| Category | Example Health Scores |
|---|---|
| **Product Engagement** | Feature usage frequency (60%), Active days (30%), User logins (10%) |
| **Support** | Open tickets (20%), Time to resolution (50%), CSAT (30%) |
| **Financial** | Payment history (30%), Invoice issues (40%), Renewal rate (30%) |
| **Sentiment** | NPS (30%), CSAT surveys (50%), Social media mentions (20%) |
| **Relationship** | Executive sponsor activity, advocacy participation, engagement call attendance |
| **Value** | Business outcomes achieved, onboarding progress |

### The Global Health Score (GHS) Model
- Individual scores (1-100) per category, **color-coded** (Red / Yellow / Green)
- Each score has a **configurable weight/impact** on the Global Health Score
- **Clustered scores** — scores can depend on sub-scores (e.g., "Product Engagement" = Feature Usage + Active Days + Logins)
- **Grading scale**: A (90-100) → F (0-29) with mapped actions:

| Score | Grade | Status | Action |
|---|---|---|---|
| 90-100 | A | Excellent | Monitor for upsell |
| 75-89 | B | Good | Maintain, consider engagement boosts |
| 50-74 | C | At Risk | Increase touchpoints |
| 30-49 | D | High Risk | Immediate intervention |
| 0-29 | F | Critical | Urgent escalation |

### How They Surface Insights
- **Dashboard with multiple health score cards** — each score visible at a glance with trend arrows (↗ ↘)
- **Signals/Triggers** — automated alerts when a score crosses a threshold (e.g., drops below 50)
- **Playbook automation** — when a signal fires, auto-assign tasks, send messages, notify CSMs
- **Trend tables over time** — monthly tracking of each score + GHS per customer
- **Segmentation** — group customers by health score criteria for targeted action
- **CSM override** — a manual rating that can supersede automated scores (because the human always knows best)

### What They Avoid
- **No single-score-only approach** — the industry has moved firmly toward multiple scores. A single GHS "reveals very little in terms of explanations"
- **No fixed formulas** — every business defines its own score weights and thresholds
- **No vanity metrics** — logins alone are explicitly called out as a poor health indicator
- **No set-and-forget** — scores evolve as the business matures; new dimensions are added over time

### UX Patterns
- Color-coded score cards (red/yellow/green)
- Weighted score composition (pie/bar showing impact)
- Trend arrows and sparklines
- Threshold-based signals/alerts
- Automation playbooks triggered by score changes
- Segment views (filter by health status)
- Drill-down from GHS → individual scores → underlying metrics
- Manual override toggle for CSM judgment

---

## 6. Cross-Platform Pattern Summary

### Common Patterns Across All Platforms

| Pattern | Shopify | Amazon | Etsy | Stripe | SaaS |
|---|---|---|---|---|---|
| **Card-based layout** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Color coding (R/Y/G)** | ⚠️ (% change) | ✅ | ✅ | ✅ (risk scores) | ✅ |
| **Threshold/target lines** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Trend indicators** | ✅ (sparklines) | ❌ | ❌ | ✅ (charts) | ✅ (arrows) |
| **Time period selection** | ✅ (flexible) | Fixed windows | Rolling 90 days | ✅ (flexible) | ✅ (monthly) |
| **Actionable next steps** | ❌ (separate) | ❌ (punitive) | ✅ (tips) | ❌ (tools) | ✅ (playbooks) |
| **Badge/reward system** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Alerts/notifications** | ✅ (data issues) | ✅ (violations) | ❌ | ✅ (fraud) | ✅ (signals) |
| **Mobile-friendly** | ✅ | ✅ | ✅ | Partial | Partial |
| **Customizable** | ✅ (high) | ❌ (none) | ❌ (none) | ✅ (high) | ✅ (high) |

### Universal Design Principles Observed
1. **Show, don't overwhelm** — every platform starts with a curated default view
2. **Context over raw numbers** — comparison to previous period, targets, or benchmarks
3. **Progressive disclosure** — summary first, drill-down available
4. **Separate "health" from "analytics"** — health = am I in trouble? Analytics = how do I grow?
5. **Time windows matter** — rolling periods feel fairer than point-in-time snapshots
6. **Action proximity** — the closer a suggestion is to the metric, the more likely it's acted upon

---

## 7. What TradeFeed Can Do BETTER

### Context: TradeFeed's Unique Position
- **South African wholesalers** — mobile-first, often on mid-range Android devices with inconsistent connectivity
- **WhatsApp-based commerce** — orders flow through chat, not shopping carts
- **Wholesaler relationships** — repeat B2B buyers, not one-time consumers
- **Simpler operations** — fewer SKUs, higher-value orders, manual fulfillment

### Opportunity 1: The "Shop Pulse" — A Single Glanceable Score (Done Right)

**What others get wrong:** Amazon reduces everything to Good/At Risk/Critical (too punitive). SaaS tools use complex weighted formulas (too technical). Shopify avoids a score entirely (no quick signal).

**What TradeFeed should do:**
- A single **Shop Pulse score (0-100)** displayed as a large, colored circle at the top of the dashboard
- BUT immediately below, show **3-4 contributing factor bars** so the seller instantly sees *why*
- Factors for wholesalers:
  - **Response Speed** — how fast you reply on WhatsApp (target: < 30 min during business hours)
  - **Order Fulfillment** — % of orders confirmed and shipped on time
  - **Buyer Satisfaction** — repeat order rate + ratings (if available)
  - **Catalog Freshness** — are your prices and stock updated recently?
- Each factor shows a **simple progress bar** with a thumbs-up or warning icon
- Tap any factor to see **one specific, actionable tip** (not a page of advice)

**Why it's better:** Combines Amazon's simplicity with SaaS's transparency. One glance tells the wholesaler their status AND what to fix.

### Opportunity 2: WhatsApp-Native Nudges (No Dashboard Required)

**What others miss:** Every platform above requires the seller to *visit* a dashboard. South African wholesalers live in WhatsApp, not web apps.

**What TradeFeed should do:**
- **Weekly WhatsApp summary message** — a formatted message with:
  - Shop Pulse score (emoji-based: 🟢 85/100)
  - Top metric that improved: "📈 Your response time improved to 22 min!"
  - One action item: "⚠️ 3 products haven't been updated in 30 days. Tap to update."
  - Link to full dashboard for those who want more
- **Threshold alerts via WhatsApp** — "Your fulfillment rate dropped below 80%. This may affect your shop visibility."
- **Celebration messages** — "🎉 You've been a top seller in Gauteng this week!"

**Why it's better:** Meets the seller where they already are. No app-switching. Works on any phone.

### Opportunity 3: Badges That Drive Wholesale Trust (Etsy-Inspired, B2B-Adapted)

**What Etsy does well:** Simple badge → trust signal → more sales.
**What Etsy gets wrong for B2B:** Star Seller is consumer-focused; wholesalers care about reliability and pricing.

**What TradeFeed should do:**
- **"Trusted Supplier" badge** — earned by maintaining:
  - ≥ 90% on-time fulfillment
  - ≥ 80% response rate within 1 hour
  - Active for 90+ days
  - No unresolved disputes
- **"Price Leader" badge** — for competitive pricing in their category
- **"Fast Responder" badge** — replies to WhatsApp inquiries within 15 minutes on average
- Badges visible on **shop profile in marketplace** and in **WhatsApp catalog links**
- Sub-badges for partial achievement (like Etsy's Smooth Shipping / Rave Reviews)

**Why it's better:** B2B trust signals that actually matter to wholesale buyers. Visible where transactions happen (WhatsApp + marketplace).

### Opportunity 4: Simplicity-First Dashboard (Anti-Shopify Approach)

**What Shopify does well:** Power and customization for sophisticated merchants.
**What's wrong for TradeFeed:** SA wholesalers don't need 50 metric cards and drag-and-drop customization.

**What TradeFeed should do:**
- **Fixed, opinionated dashboard** with exactly 5 sections:
  1. **Shop Pulse** — score + factor bars (see Opportunity 1)
  2. **This Week's Orders** — count, total value, pending vs. fulfilled
  3. **Top Products** — your 3 best-selling items with quick restock/update action
  4. **Buyer Activity** — new inquiries, repeat buyers, messages awaiting reply
  5. **One Thing to Improve** — a single, rotating AI-generated suggestion
- **No customization needed** — one layout that works for everyone
- **Works on mobile screens** — vertical scroll, large tap targets, minimal text
- **Offline-capable** — last-known data cached; syncs when connectivity returns

**Why it's better:** Removes decision fatigue. The seller opens the dashboard and knows exactly what to look at. Designed for a 4.5" phone screen, not a 27" monitor.

### Opportunity 5: Actionable Intelligence Without Complexity (Anti-Stripe Approach)

**What Stripe does well:** Deep data analysis for power users.
**What's wrong for TradeFeed:** SQL queries and custom reports are irrelevant for a wholesaler in Soweto.

**What TradeFeed should do:**
- **Pre-computed insights delivered as plain-language cards:**
  - "📊 Your rice sales peak on Fridays. Consider restocking by Thursday."
  - "👥 12 of your buyers haven't ordered in 3 weeks. Send them a WhatsApp catalog update."
  - "💰 Your average order is R2,400 — 15% higher than similar shops. Nice!"
  - "⚠️ 2 of your products are priced 20% above market average."
- **No charts unless tapped** — show the insight first, chart second
- **Insights refresh weekly** — not real-time (reduces server cost, reduces noise)
- **AI-generated but human-reviewed** — template-based insights that feel personal

**Why it's better:** The seller gets the *conclusion*, not the raw data. No literacy in analytics required.

---

## 8. Recommended Implementation Priority

| Priority | Feature | Effort | Impact |
|---|---|---|---|
| **P0** | Shop Pulse score with 4 factor bars | Medium | High — immediate seller engagement |
| **P0** | Weekly WhatsApp health summary | Low | High — meets sellers where they are |
| **P1** | Trusted Supplier / Fast Responder badges | Medium | High — buyer trust, marketplace differentiation |
| **P1** | Fixed 5-section mobile dashboard | Medium | High — replaces vague "analytics" page |
| **P2** | Plain-language insight cards | Medium | Medium — requires data pipeline |
| **P2** | Threshold alerts via WhatsApp | Low | Medium — proactive churn prevention |
| **P3** | Sub-badges for partial achievement | Low | Low — nice-to-have gamification |
| **P3** | AI-generated weekly suggestions | High | Medium — requires ML/heuristics |

---

## 9. Key Takeaways

1. **Don't copy Amazon's punitive model** — wholesalers are partners, not policy violators. Use encouragement, not threats.
2. **Don't copy Shopify's complexity** — TradeFeed sellers need a 10-second dashboard glance, not a customizable BI tool.
3. **Do copy Etsy's badge simplicity** — a visible trust badge drives behavior more than a hidden score.
4. **Do copy SaaS's action-orientation** — every metric should have a "so what?" attached to it.
5. **Innovate on channel** — WhatsApp-native health summaries are something NO platform above offers. This is TradeFeed's unfair advantage.
6. **Design for the 4.5" screen** — every decision should pass the "can a wholesaler in a taxi understand this?" test.
7. **Offline-first data** — cache aggressively; South African connectivity is intermittent.

---

*This research document should inform the design of TradeFeed's Seller Health Dashboard. No code should be written until the UX wireframes are reviewed and approved.*
