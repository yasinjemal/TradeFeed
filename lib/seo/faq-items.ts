// ============================================================
// Homepage FAQ — single source for BOTH the rendered accordion
// (legacy landing and TF landing) and the FAQPage JSON-LD.
// Keeping copy and schema in one place means Google rich results
// always match what users actually see on the page.
// ============================================================

export const FAQ_ITEMS = [
  { q: "Do my customers need to download an app?", a: "No! Your customers just tap your catalog link — it opens in their phone browser. No app download, no sign-up, no registration. They browse products, add to cart, and order via WhatsApp. Works on any smartphone." },
  { q: "Can I update stock and prices easily?", a: "Yes. Log into your dashboard from any device, edit any product, change prices, add new sizes or colors, upload new photos, or mark items as sold out. Changes appear on your catalog link instantly." },
  { q: "How is my WhatsApp number used?", a: "Use a business WhatsApp number. TradeFeed places it in order links so buyers can contact you directly, which means it may be visible to buyers and automated tools. We do not sell it or use it for unrelated marketing. See our privacy policy for full details." },
  { q: "How much does it cost?", a: "Free to start with up to 20 products — forever. When you're ready to scale, upgrade to Starter for R99/month (unlimited products), Pro for R299/month (unlimited AI + team accounts), or Pro AI for R499/month (full AI automation). No hidden fees. Cancel anytime." },
  { q: "How is this different from posting in WhatsApp groups?", a: "WhatsApp posts get buried in 10 minutes. With TradeFeed, your products live on a permanent, searchable, shareable catalog page. Customers can browse anytime, filter by category, sort by price, and send you organized orders with exact sizes, colors, and quantities — no back-and-forth." },
  { q: "Who is TradeFeed for?", a: "Any seller who uses WhatsApp to sell products — whether you're a Jeppe Street wholesaler, a boutique reseller, or selling from home. If your customers DM you for prices and stock — TradeFeed replaces that back-and-forth with a professional catalog link. Works great for clothing, shoes, electronics, beauty products, accessories, and any physical goods." },
  { q: "Can I use this if I'm not tech-savvy?", a: "If you can post a photo on WhatsApp, you can use TradeFeed. Upload a photo, type a name and price, hit save. That's it. No coding, no design skills needed. We even have a bulk import if you have a spreadsheet of products." },
  { q: "Do you support PayFast for payments?", a: "Yes! Subscription payments are processed securely through PayFast — South Africa's most trusted payment gateway. Pay with card, EFT, or any PayFast-supported method. We also use PayFast for promoted listing purchases." },
  { q: "Can buyers track their orders?", a: "Yes. Every order gets a unique tracking number (e.g. TF-20260224-0042). Sellers update the order status from their dashboard (Pending → Confirmed → Shipped → Delivered), and buyers can enquire via WhatsApp using their order number." },
] as const;
