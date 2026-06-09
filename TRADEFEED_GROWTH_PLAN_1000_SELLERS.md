# TradeFeed — Road to 1,000 Active Sellers

**From:** CTO / Head of Product / Head of Growth / Lead Engineer (one operator, one plan)
**Objective:** Reach **1,000 active sellers**. "Active" = listed ≥3 products AND shared their catalog AND got ≥1 buyer view in the last 30 days.
**Lens:** Growth, not technical perfection. Everything ranked by business impact.

---

## The One-Sentence Thesis

TradeFeed has already **built the product** for 1,000 sellers — what it hasn't built is the **acquisition loop and the activation guarantee**. The codebase is feature-rich (AI listings, marketplace, payments, reviews, lifecycle messaging, referrals). The gap to 1,000 sellers is almost entirely **top-of-funnel supply acquisition + making sure every seller who signs up reaches their first buyer**. Spend 80% of energy there.

A blunt reframe of the funnel math: to hold **1,000 active** sellers you likely need ~3,000–4,000 signups (typical 25–35% activation for this segment). So the two numbers that matter are **signups/week** and **signup→activated %**. Every item below is scored against those two.

---

## 1. Current Strengths (what's already working — protect it)

Ranked by how much leverage they give toward 1,000 sellers.

1. **Product-first onboarding that creates a shop + first product in one flow** (`actions/onboarding.ts`, `/get-started`). This is the single best growth asset in the codebase — it collapses the "empty shop" problem most marketplaces die on. A seller leaves with a live catalog URL.
2. **AI listing generation from a photo** (`/api/ai/generate-product`, GPT-4o-mini vision). This is the "magic moment" for a Jeppe trader who has 200 photos and no patience for forms. Genuine differentiator vs. building a Shopify store.
3. **WhatsApp-native everything** — orders, auto-reply, AI sales replies, product import, and an automated seller lifecycle sequence (Day 0/3/7/14 + weekly/monthly reports). Meets the audience where they live.
4. **Built-in viral/referral mechanics** — referral codes, `tf_ref` cookie capture at signup, free-month reward on referred upgrade. The loop exists; it's just under-fired (see weaknesses).
5. **Marketplace + SEO discovery engine** — cross-shop marketplace, location landing pages (province/city/category), product JSON-LD, Google Merchant feed. This is a **second, compounding acquisition channel** for buyers (and indirectly sellers via "I want a shop like that").
6. **Trust scaffolding already in place** — verified-seller badges, reviews, ratings, seller tiers/health scores, COD, custom domains, themes. Most pre-seed marketplaces lack all of this.
7. **Multiple revenue rails wired** — Free / Starter R99 / Pro R299 / Pro-AI R499, promoted listings (R49–R399/wk), shop boosts, and a R7.50 flat transaction fee. Monetization won't block growth; it's ready when you are.

**Takeaway:** the product is not the bottleneck. Do not add big new product surfaces. Pour fuel on what exists.

---

## 2. Current Weaknesses (what's quietly killing growth)

Ranked by likely damage to the signup→active funnel.

1. **The lifecycle nudges probably don't deliver.** `seller-sequences.ts` sends Day 3/7/14 nudges with `sendTextMessage` (the WhatsApp **24-hour customer-service window**). A seller who signed up 3 days ago is *outside* that window, so Meta silently drops the message unless it's a **pre-approved template**. The code comment even admits this. **Result:** the most important reactivation tool in the app is firing into the void. This is almost certainly the biggest single activation leak. (Critical.)
2. **Signup requires Clerk auth (email/password) before a shop exists.** `createShopOnboardingAction` calls `requireAuth()`; `/create-shop` gates on `auth()`. For a WhatsApp-first, low-friction audience, an email/password wall *before* they see value is brutal. The `MagicLink` / `/whatsapp-login` infrastructure exists but isn't the front door. (Critical.)
3. **No supply-acquisition channel exists in the product.** Everything assumes the seller already arrived. There's no "invite a seller you know," no WhatsApp-group share-to-recruit asset, no referral *prompt* surfaced at the moment of seller delight. Growth is currently dependent on whatever marketing happens outside the app. (Critical.)
4. **Marketplace liquidity is invisible and probably thin.** With few sellers, marketplace/category pages look empty, which kills both buyer trust and the "I want in" seller pull. There's no merchandising for a cold-start catalog (no "new this week," "near you," city-seeded curation surfaced as the hero).
5. **Activation isn't guaranteed — the seller is left to "go share your link."** The app tells sellers to share (nudge messages) but doesn't *do it for them*. No one-tap "post my catalog to my WhatsApp groups" asset, no auto-generated shareable product cards/flyer, no first-3-buyers concierge. The burden of getting the first buyer is entirely on a non-marketer.
6. **Buyer retention has no account hook.** Buyers order via WhatsApp anonymously. Wishlist + back-in-stock fields exist but there's no buyer reorder loop, no "follow this shop," no buyer notification of new drops. Repeat demand — the thing that makes sellers stay — isn't engineered.
7. **Revenue capture leaks.** The R7.50 transaction fee only triggers on PayFast online payment, but the default order path is a WhatsApp message (off-platform payment). So fee revenue rarely fires, and subscription conversion has no in-product trigger tied to *value delivered* (e.g. "you've made R5,000 in orders — upgrade to keep your store unlimited").

---

## 3. Biggest Growth Bottlenecks (the constraints, in order)

> A bottleneck is the thing that, if unblocked, moves the active-seller number the most. Fix strictly top-down.

**B1 — Supply acquisition has no engine.** You cannot reach 1,000 sellers without a repeatable way to add ~100–150 signups/week. Today there is none inside the product. **This is the #1 constraint.**

**B2 — Activation is leaky and unassisted.** Of the sellers you do get, too many never reach "first buyer view," and the tool meant to rescue them (WhatsApp nudges) is misconfigured (B1 of the weaknesses). **#2 constraint.**

**B3 — Signup friction (auth wall) throttles conversion of acquired interest.** Every percentage point of signup-completion lost here multiplies against B1. **#3.**

**B4 — Cold-start liquidity makes the marketplace channel and seller pull weak.** Without visible demand/inventory density, the compounding loops don't start. **#4.**

**B5 — Retention of buyers (and therefore sellers) isn't engineered**, so even activated sellers can churn for lack of repeat demand. **#5 — matters more after you're past ~300 sellers.**

Everything else (technical debt, perf, even monetization) is **below the line** for the 1,000-seller goal.

---

## 4. Highest-ROI Features / Moves (ranked by impact ÷ effort)

| Rank | Move | Bottleneck | Impact | Effort | Why it's high ROI |
|------|------|-----------|--------|--------|-------------------|
| 1 | **Fix WhatsApp lifecycle delivery — register approved message templates** for Day 3/7/14 nudges + weekly report | B2 | ★★★★★ | Low | Turns an already-built, currently-dead activation engine back on. Pure recovered value. |
| 2 | **WhatsApp OTP as the primary front door** (wire `MagicLink`/`whatsapp-login` into `/get-started`; email becomes optional) | B3 | ★★★★★ | Med | Removes the single biggest signup-completion killer for this audience. |
| 3 | **"Recruit a seller" referral, surfaced at the delight moment** + cash/free-month incentive, with a pre-written WhatsApp invite + auto-generated flyer | B1 | ★★★★★ | Med | Builds the supply engine *inside* the product using the referral plumbing that already exists. |
| 4 | **One-tap "Share my catalog / share this product" kit** — auto-generated branded image cards + pre-filled WhatsApp/Status/Facebook share, pushed right after first product | B2/B5 | ★★★★★ | Med | Does the seller's marketing *for* them → drives first buyer view → activation. Reuses the existing OG image route. |
| 5 | **Activation milestone tracker + concierge for first 50–100 sellers** ("Add 3 products → share → first 3 buyers") with a human (you) WhatsApping stuck sellers | B2 | ★★★★ | Low | Do things that don't scale. Hand-activate early sellers, learn the real drop-off, hard-code the fix. |
| 6 | **Cold-start marketplace merchandising** — seed/curate a "Featured this week" + city hero so category pages never look empty; `noindex` empty combos | B4 | ★★★★ | Med | Makes the buyer channel and seller FOMO real even at low density. |
| 7 | **Buyer "follow shop" + new-drop notify + one-tap reorder** (wishlist/`notifyPhone` fields already exist) | B5 | ★★★★ | Med | Manufactures repeat demand → sellers see orders → sellers stay. |
| 8 | **Value-triggered upgrade prompts** ("You've passed 20 products / R5k in orders — upgrade") instead of a static pricing page | Revenue | ★★★ | Low | Lifts conversion without touching growth; do once activation is flowing. |
| 9 | **Public, honest liquidity counters** ("142 sellers, 3,800 products, 12 cities") on landing + create-shop to replace fake "JM/TK/NZ" avatars | Trust/B1 | ★★★ | Low | Real social proof converts better than placeholder proof and avoids a trust own-goal. |

> Deliberately **not** on this list for the 1,000-seller window: new payment rails, deeper analytics, perf/caching, RLS. All worthwhile (see the architecture review) but none move active-seller count in the next 90 days.

---

## 5. 30-Day Roadmap — "Turn the engine on and prove the loop"

**Goal of the month:** every new seller reliably reaches first-buyer-view, and you have a working *manual* supply loop. Target a measurable activation rate, not a vanity signup number.

**Week 1 — Stop the bleeding (delivery + measurement)**
- Register and ship **WhatsApp message templates** for the Day 3/7/14 nudges and the weekly report; verify real delivery. *(ROI #1)*
- Stand up an **activation dashboard** off the existing `OnboardingEvent` funnel: signups → shop_created → product_created → catalog shared → first buyer view. You cannot fix what you can't see.
- Replace placeholder social proof on `/create-shop` and landing with **real live counters**. *(ROI #9)*

**Week 2 — Kill signup friction**
- Make **WhatsApp OTP the primary signup path** in `/get-started`; defer email to optional. Instrument completion rate before/after. *(ROI #2)*
- Add a **"first product in 60s" guarantee**: land sellers straight into the photo→AI listing flow immediately after shop creation (the nudge already promises this — make it the default path).

**Week 3 — Arm the seller to get buyers**
- Ship the **one-tap share kit**: auto-generated branded product/catalog cards (reuse `/api/og`) + pre-filled WhatsApp/Status/Facebook share, surfaced immediately after first product and in the dashboard. *(ROI #4)*
- Turn on **value-triggered share nudges** ("share to get your first 10 views").

**Week 4 — Manual supply loop + concierge**
- Launch **"Invite a seller you know"** with a real incentive (free month / small cash) + pre-written WhatsApp invite + flyer, surfaced at the delight moment (first order, or first 50 views). *(ROI #3)*
- **Hand-activate** every new seller personally (WhatsApp them, watch where they stall, fix the top-2 stalls in-product). *(ROI #5)*
- Go physically/digitally to **one dense seller cluster** (Jeppe St / a few large WhatsApp wholesale groups) and onboard 20–30 sellers by hand to seed liquidity in one geography.

**30-day exit criteria:** lifecycle messages provably delivering; WhatsApp signup live with measured lift; share kit shipped; ≥1 working referral/invite path; a single city/cluster seeded to visible density; activation rate baselined and trending up.

---

## 6. 90-Day Roadmap — "Make the loops compound"

**Month 2 — Liquidity & retention (turn manual loops into product loops)**
- **Cold-start marketplace merchandising**: "Featured this week," "New near you," city heroes; ensure no category/location page ever looks empty; `noindex` empty combinations. *(ROI #6)*
- **Buyer retention engine**: "follow shop," new-drop notifications, and **one-tap reorder** from order history (wishlist/`notifyPhone`/order data already exist). This is what converts a one-time buyer into recurring demand a seller can feel. *(ROI #7)*
- Double down on the **geographic cluster** strategy: pick 2–3 cities, get each to local liquidity density rather than spreading thin nationally. Density per city beats sparse national coverage for both buyer trust and word-of-mouth.

**Month 3 — Scale the supply engine & introduce monetization pressure**
- **Productize "Recruit a seller"** into a standing program with a leaderboard and tiered rewards; let your best sellers become your sales force. Supply growth should now be partly self-driven.
- **Value-triggered upgrade prompts** at product-limit (20) and revenue milestones; A/B the trial. Begin converting activated free sellers to Starter/Pro — *now* that they've felt value. *(ROI #8)*
- **SEO compounding pass**: trim keyword-stuffed metadata, ensure location/category pages have unique content, lean on the Merchant feed — so buyer acquisition (and indirect seller pull) compounds for free.
- **Light technical hardening that protects growth, not perfection**: cache the public marketplace/catalog pages (they'll be getting real traffic now) and back AI/rate limits with Upstash to control OpenAI cost as AI usage scales. (See architecture review — only the items that protect the growing funnel.)

**90-day exit criteria:** signups driven substantially by in-product referral + SEO (not just manual outreach); activation rate stable and healthy; ≥2–3 cities at visible liquidity; buyers returning (measurable reorder rate); first cohort of free→paid conversions; clear line of sight from current run-rate to 1,000 active sellers.

---

## Scorecard — What to Watch (and ignore)

**The 3 numbers that decide whether you hit 1,000:**
1. **Signups / week** (supply top-of-funnel)
2. **Signup → Activated %** (the activation guarantee)
3. **Activated → Retained @30d %** (driven by buyer repeat demand)

**Supporting:** catalog-share rate, first-buyer-view time, sellers per city, buyer reorder rate, referral-driven signup share.

**Explicitly de-prioritized for this goal:** subscription ARPU, transaction-fee revenue, perf/caching, test coverage, payment-rail breadth, schema cleanups. All real (the architecture review covers them) — but none of them are between you and 1,000 active sellers. Revisit once activation is reliably flowing.

---

### Final word
The hard part — a genuinely good, WhatsApp-native, AI-assisted seller product — is **already done**. The path to 1,000 sellers is not more features; it's (1) un-break the activation messaging, (2) tear down the signup wall, (3) build the recruit-a-seller loop, and (4) do the seller's marketing for them so they reach their first buyer. Concentrate density in a few cities, hand-activate the early cohort, then let referral + SEO compound. Ship the 30-day list in order and the rest follows.
