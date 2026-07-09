# TradeFeed — UX Research: What World-Class Products Do (and what to steal)

_Reference study for the redesign. "Steal the principle, never the pixels."_

## 1. The reference set

### Linear (SaaS dashboard discipline)
- **What works:** one typeface, one accent, ruthless density control; every surface obeys the
  same 8px rhythm; keyboard-first affordances signal "built by professionals."
- **For TradeFeed:** the seller dashboard should feel like a *tool*, not a brochure. Kill
  gradient-button confetti and emoji nudges in the shell; keep one emerald accent and let
  data (orders, revenue) be the color.

### Stripe (trust through restraint)
- **What works:** trust is typography + spacing + motion restraint, not badges. Dense
  documentation-grade tables next to editorial headlines.
- **For TradeFeed:** POPIA/SSL/PayFast trust markers should be quiet system-level furniture
  (footer, checkout), not pulsing gold rings. The TF "Counter-weight" motion spec already
  matches Stripe's philosophy — enforce it everywhere.

### Shopify (merchant empathy)
- **What works:** the admin speaks merchant language ("Orders to fulfill", "Payouts"), not
  platform language; empty states always teach the next action.
- **For TradeFeed:** dashboard nav should be jobs-to-be-done ("Products, Orders, Money,
  Customers, Grow"), and every empty state must end in one emerald action.

### WhatsApp (the aesthetic your users already trust)
- **What works:** flat surfaces, soft warm background, one green, instant feedback, zero
  loading theatrics. 30M+ South Africans have 10 000 hours inside this design language.
- **For TradeFeed:** the TF warm-stone + deep-emerald palette is exactly right. Buyer-facing
  flows (catalog → cart → wa.me) should feel like a natural *extension of a WhatsApp chat*,
  not a website interrupting one.

### Airbnb (marketplace card craft)
- **What works:** photography is the hero; cards have no borders, just shadow-on-hover and
  generous radius; location + trust signals in a strict hierarchy under the image.
- **For TradeFeed:** product cards should be image-first with price as the second-loudest
  element; verified tick and city as quiet metadata, exactly as `tf-product-card` does.

### Notion (approachable systems)
- **What works:** friendly illustration + serious typography — approachable without being toy-like.
- **For TradeFeed:** empty states and onboarding illustrations in a single warm-toned style
  (see Higgsfield concept round) instead of mixed emoji.

## 2. Mobile-first African commerce patterns (non-negotiables)

1. **Data cost is a design constraint.** Every KB matters on prepaid data. Ship system/two
   fonts max, AVIF/WebP images, no autoplaying video. (TF's transform-only motion is free; keep it.)
2. **Low-end Android is the median device.** The 1.6s motion failsafe in globals.css exists
   for a reason — never add JS-gated visibility without it.
3. **Thumb-reach bottom navigation.** Buyers browse one-handed in taxis; the bottom tab bar
   and sticky WhatsApp CTA are correct patterns — make them consistent across catalog and
   marketplace.
4. **Airtime-era trust signals.** Cash-on-delivery mentality: order tracking numbers
   (TF-20260224-0042), a human WhatsApp number, and "no app download" messaging do more
   than SSL padlocks.
5. **Language plurality.** en/af/zu/xh/st switching must survive the redesign (currently a
   TF-branch regression — see audit P4).

## 3. WhatsApp-commerce competitive scan

- **Take (SA marketplace):** strong logistics, weak seller identity — TradeFeed wins on
  seller-brand catalog pages; lean into shop identity (logo, city, verified).
- **WhatsApp Business Catalog (the incumbent):** free but flat product lists, no variants,
  no analytics, buried in chat. TradeFeed's pitch is *structure*: variants, stock, tracking,
  discovery. The landing page should demo this contrast visually (before/after chat chaos →
  structured catalog) — the existing section does this; keep it central.
- **Instagram-DM sellers:** the aesthetic bar buyers expect is editorial photography.
  Marketplace cards must make ordinary product photos look good (warm surface, consistent
  aspect ratio crop, no harsh borders).

## 4. Synthesis → design principles for TradeFeed

1. **One language: TF.** Warm stone, deep emerald, amber sparingly. Blue is banned.
2. **The catalog is the product.** Seller pride ("this looks like MY shop, and it looks
   expensive") drives sharing, which drives acquisition.
3. **Dashboard = calm tool. Marketplace = warm market. Landing = confident pitch.** Same
   tokens, three temperatures.
4. **Motion is trust.** 420/200/120ms, one easing, nothing bounces except the one-time
   verified-tick pop.
5. **Every screen ends in a next action** — usually WhatsApp-green.
