# TradeFeed — Live Site Reality Check (tradefeed.co.za)

**What this is:** I pulled the live marketplace and read the actual catalog. This grounds the growth plan in real numbers instead of code assumptions. Read this alongside `TRADEFEED_GROWTH_PLAN_1000_SELLERS.md`.
**Checked:** marketplace (default + popular sort), category counts, seller list, listing quality. Homepage couldn't be JS-rendered from here (see flag #7).

---

## The real numbers (as observed)

- **~195 products live.**
- **~16 identifiable sellers**, e.g. smiley fashion shop (Queenstown), MEN'S CORNERS (Joburg, 35 products), Trendy's Cosmetic store (Joburg), Urban Wrist (Brakpan), NLM Essentials Hub, omyfashions, Treasure trove, Malashe, ismaeel's, Olwethu's, Nompumelelo's, Jessica's Guides (Soweto), LUMA·luscious (Boksburg), snoma trading, rutbrand, yasin-ali.
- **Category spread:** Men's Clothing 49, Beauty & Health 27, Footwear 24, Other 15, Electronics 7, Accessories 7, Women's 6, the rest ≤4.

**Translation:** you're at roughly **1.5–2% of the 1,000-active-seller goal**, and "active" is generous here. This is a genuine cold-start — which is exactly the stage the growth plan is written for. Nothing below is discouraging; it's the map.

---

## Seven things the live site tells me (ranked by impact)

**1. You have an ICP drift — and the data says lean into it. (Highest strategic signal.)**
`VISION.md` targets **Jeppe Street clothing wholesalers**. The sellers who actually showed up are **small individual resellers, nationwide**: watches (Urban Wrist, Brakpan), perfumes & cosmetics (Trendy's), lip balm (LUMA, Boksburg), a study guide (Jessica's, Soweto), a generator (snoma), a PS5 and a drone (smiley). **Zero** look like CBD clothing wholesalers. Decision to make now: officially **pivot the ICP to "side-hustle resellers"** (who are clearly finding you) *or* run a deliberate Jeppe field push. My call: **lean into resellers** — they're self-serving onto the platform, the AI-listing tool fits them perfectly, and there are vastly more of them than Jeppe wholesalers. Re-point messaging, examples, and the recruit loop at them.

**2. Catalog is whale-dependent.** ~3 sellers (smiley, MEN'S CORNERS, Trendy's) carry roughly 40%+ of all products. If one leaves, the marketplace visibly thins. **Implication:** retention of your top 5 sellers is a board-level metric right now; treat them as accounts, not users — talk to them weekly.

**3. Your best feature (AI listings) isn't reaching the long tail.** The whales have rich AI-SEO titles ("Stylish Polo Shirt with Zigzag Design — Cotton Blend, S-XXL"). The long tail has bare titles — "Jacket," "Dress," "Charger," "Vlogging kit," "All four bowls," "Samsung s22 ultra." These convert worse *and* rank worse on Google. **The activation problem isn't just "list a product," it's "list a *good* product."** Push every seller through the photo→AI flow by default (this is already in the 30-day plan — the live data makes it urgent).

**4. Location data is mostly missing — which silently breaks your entire SEO city/province play.** Many products show "South Africa" with no city (smiley is in Queenstown but tagged generically; rutbrand, Malashe, ismaeel's, Olwethu's, Nompumelelo's, snoma all "South Africa"). Your province/city/category landing pages (a major SEO bet) **have almost nothing to index** because sellers never set a city. **Quick win:** make city required at signup (or infer from WhatsApp area/IP) — cheap, and it switches on a whole acquisition channel.

**5. "Popular sellers" row shows exactly ONE shop.** The curated trust row at the top of the marketplace renders a single seller (MEN'S CORNERS). Either the threshold to qualify is too high or it's a merchandising bug. On a cold-start marketplace, an almost-empty "popular sellers" rail *advertises* thinness to every buyer and prospective seller. Lower the bar and hand-curate it.

**6. Trust signals are present but hollow at the moment.** Verification badges and tiers (👑 Top Seller / 🚀 Rising / ⭐ Established) render nicely — good. But nearly every product shows "5.0 (1)" — single reviews, almost certainly seeded/self. Real buyers won't be fooled for long. Also at least one live product is "Image coming soon." **Fix:** prioritize getting genuine reviews from real orders (post-purchase WhatsApp review request) and block/penalize listings with no image from the marketplace feed.

**7. ⚠️ Verify: the homepage may not be server-rendering. (Flag, not a conclusion.)** The `/marketplace` page returned full SSR HTML, but `https://tradefeed.co.za/` and `/www` returned an **empty body** twice from a non-JS fetch. That pattern *suggests* the landing page is client-rendered with little/no server HTML — which would be a real problem because the homepage is your #1 acquisition and SEO page. I couldn't confirm (no JS browser available here). **Action:** check the homepage in Google Search Console (URL Inspection → "View crawled HTML") or run it through PageSpeed/Rich Results — if Googlebot sees an empty shell, that's a high-priority SEO fix.

---

## What this changes in the plan (it mostly *sharpens* it)

The live data doesn't contradict `TRADEFEED_GROWTH_PLAN_1000_SELLERS.md` — it makes three items more urgent and adds two:

| Adjustment | Why (from live data) | Slot |
|---|---|---|
| **Force the AI-listing flow as the default for every seller** | Long-tail listings are bare and won't convert or rank | Pull into **Week 2** (was implied) |
| **Make city required / inferred at signup** | "South Africa"-only sellers break the SEO city pages | Add to **Week 1** (tiny effort, big channel unlock) |
| **Treat top-5 sellers as managed accounts** | 3 whales = ~40% of catalog; churn risk is existential | Add to **Week 4** concierge |
| **Fix/curate "Popular sellers" rail; hide thin rails** | One-seller rail advertises cold-start to everyone | **Week 3** merchandising |
| **Verify homepage SSR; fix if shell** | #1 acquisition/SEO page may be invisible to Google | **Week 1** check |
| **Re-point ICP + messaging to resellers** | That's who actually signed up | Strategic, **Month 1** |

Everything else in the 30/90-day roadmap stands. The headline is unchanged: **the product works and real sellers are arriving on their own — now un-break activation messaging, drop the signup wall, force good listings, and build the recruit-a-seller loop.** The fact that ~16 sellers found you with essentially no growth engine is the most encouraging signal in this whole review: imagine the curve once the engine is on.

---

*Caveat: numbers are a point-in-time read of the public marketplace, not your database. For exact active-seller, activation, and order figures, pull from `OnboardingEvent` / `Order` — I can turn this into a quantified funnel if you connect or export that data.*
