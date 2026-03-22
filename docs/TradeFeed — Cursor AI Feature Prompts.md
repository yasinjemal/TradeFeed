# TradeFeed — Cursor AI Feature Prompts

Copy-paste these prompts into Cursor AI Composer to build each feature. They are ordered by priority from the growth plan.

---

## PHASE 1: Trust & Friction (Next 30 Days)

### Prompt 1: Fix FAQ Page

```
Create a fully functional FAQ page at /faq for TradeFeed. Generate 20+ frequently asked questions relevant to South African sellers who sell via WhatsApp. Categories should include: Getting Started, Products & Catalog, WhatsApp Orders, Payments, Pricing & Plans, and Account & Security.

Use an accordion/collapsible component. Match the existing dark theme (#1A1A1A background, #25D366 accents, #F5F5F5 text). Make it publicly accessible — no auth required. Add proper SEO meta tags targeting "WhatsApp catalog South Africa FAQ". Mobile-first responsive layout.
```

### Prompt 2: Fix How It Works Page

```
Create a "How It Works" page at /how-it-works for TradeFeed. Show a clear 3-step process:

Step 1: "Snap a Photo" — Take a photo of your product, our AI creates the listing automatically
Step 2: "Share Your Link" — Get a professional catalog link to share on WhatsApp, Facebook, anywhere
Step 3: "Get Orders on WhatsApp" — Customers browse your catalog and order directly via WhatsApp

Use large icons or illustrations for each step. Include a CTA button "Start Selling Free" that links to /sign-up. Dark theme, emerald green accents. Publicly accessible, no auth required. Add SEO meta tags targeting "how to sell on WhatsApp South Africa".
```

### Prompt 3: WhatsApp Magic Link Login

```
Implement a WhatsApp-based passwordless login flow for TradeFeed. The flow should be:

1. User enters their phone number on the login page
2. System generates a 6-digit OTP and sends it via WhatsApp using the WhatsApp Business API (or a fallback SMS provider like Twilio/Africa's Talking)
3. User enters the OTP on the verification screen
4. If valid, create/authenticate the session

Keep the existing email/password login as a fallback option. Store phone numbers in the user profile. Use the dark theme UI. Handle edge cases: expired OTP (5 min timeout), rate limiting (max 3 attempts), resend cooldown (60 seconds).
```

### Prompt 4: Bulk Image Upload

```
Add a "Bulk Upload" feature to the seller dashboard. The flow:

1. Seller clicks "Bulk Upload" button on their dashboard
2. A dropzone/file picker appears allowing selection of up to 50 images at once
3. Images are uploaded to the CDN with a progress bar for each
4. After upload, each image is queued for AI processing — the AI generates a product title, description, and suggested price for each
5. Seller reviews all generated listings in a grid view, can edit any field, then clicks "Publish All"

Show a progress indicator for the AI processing queue. Handle errors gracefully (failed uploads, AI failures). Compress images client-side before upload to save data. Dark theme UI with green accents.
```

---

## PHASE 2: Conversion (Next 60 Days)

### Prompt 5: Inventory Alerts via WhatsApp

```
Add an inventory alert system for TradeFeed sellers:

1. Each product already has a stock count. Add a "Low Stock Threshold" field (default: 5) in product settings
2. When stock drops to or below the threshold after an order, trigger a WhatsApp notification to the seller
3. The WhatsApp message should say: "⚠️ Low Stock Alert: [Product Name] has only [X] left. Update stock: [link to product edit page]"
4. Add a toggle in seller settings: "Enable WhatsApp Stock Alerts" (on by default)
5. This feature should be available only for Starter and Pro plan users. Free users see the setting but get an upgrade prompt.

Use a background job/cron to check stock levels. Rate limit alerts to max 1 per product per day.
```

### Prompt 6: Buyer Reviews & Ratings

```
Add a buyer review and rating system for TradeFeed products:

1. After a seller marks an order as "Delivered", the buyer receives a WhatsApp message: "How was your order from [Shop Name]? Rate it here: [link]"
2. The link opens a simple review page (no login required) where the buyer can: select 1-5 stars, write an optional text review, and submit
3. Reviews appear on the product detail page with star rating, review text, and date
4. Show average rating on product cards in the marketplace
5. Sellers can respond to reviews from their dashboard
6. Only available for Starter and Pro plan sellers. Free plan sellers see "Upgrade to unlock buyer reviews"

Implement review moderation: flag reviews with profanity. Dark theme UI. Mobile-optimized review submission page.
```

### Prompt 7: First Sale Celebration & Upgrade Prompt

```
Implement a "First Sale" celebration flow:

1. When a seller receives their very first order through TradeFeed, trigger a special event
2. Show a full-screen celebration modal in the dashboard with confetti animation: "🎉 Congratulations! You just got your first order on TradeFeed!"
3. Send a WhatsApp message: "🎉 Amazing! You just received your first TradeFeed order! Want to grow even faster? Get 50% off Starter for 3 months: [upgrade link]"
4. The upgrade link should apply a coupon code "FIRSTSALE50" that gives 50% off Starter (R49.50/month) for 3 months
5. Track this event in analytics

Keep the celebration feel authentic and exciting. Dark theme with green confetti.
```

---

## PHASE 3: Professional (Next 90 Days)

### Prompt 8: Printable QR Code Generator

```
Add a "Print QR Code" feature for TradeFeed sellers:

1. Add a "Get QR Code" button on the seller dashboard
2. When clicked, generate a styled QR code that links to the seller's catalog page
3. The QR code should be embedded in a professionally designed printable template (A5 size) that includes:
   - The QR code (large, centered)
   - "Scan to Shop" text
   - The seller's shop name
   - TradeFeed branding (small, bottom)
   - The catalog URL in text below the QR
4. Allow download as PDF and PNG
5. Offer 3 template styles: Dark (black bg, green accents), Light (white bg), and Colorful (gradient)

Use a library like qrcode.react for generation. The PDF should be print-ready at 300 DPI. Available for all plans (good for viral growth).
```

### Prompt 9: Custom Domain for Pro Users

```
Implement custom domain support for Pro plan sellers on TradeFeed (hosted on Vercel):

1. In the Pro seller dashboard settings, add a "Custom Domain" section
2. Seller enters their domain (e.g., myshop.co.za)
3. Show them DNS instructions: "Add a CNAME record pointing to cname.vercel-dns.com"
4. Add a "Verify Domain" button that checks DNS propagation
5. Once verified, use Vercel's API to add the domain to the project
6. The seller's catalog is now accessible at their custom domain
7. Show domain status: Pending, Verified, Active, Error

Only available for Pro plan users. Starter and Free users see this as an upgrade incentive. Handle edge cases: domain already taken, DNS not propagated yet (show "checking..." with retry), SSL certificate provisioning.
```

---

## PHASE 4: Scale (Q3 & Q4)

### Prompt 10: Weekly WhatsApp Sales Report

```
Implement an automated weekly sales report sent via WhatsApp every Monday at 9am SAST:

1. Calculate for each active seller (last 7 days):
   - Total catalog views
   - Total orders received
   - Top 3 most viewed products
   - Revenue total (if order values are tracked)
   - Comparison vs previous week (up/down arrows)
2. Format as a clean WhatsApp message:
   "📊 Your Weekly TradeFeed Report (Mar 15-22)
   👀 Views: 450 (+12%)
   🛒 Orders: 8 (+3)
   🔥 Top Product: [Name]
   💰 Revenue: R4,200
   Keep it up! Share your catalog to grow: [link]"
3. Only send to sellers who had at least 1 view that week
4. Add a toggle in settings: "Weekly Report" on/off

Use a cron job (Vercel Cron or similar). Batch WhatsApp messages to avoid rate limits.
```

### Prompt 11: Multi-Staff Accounts

```
Add team/staff account support for Pro plan sellers:

1. In Pro seller settings, add "Team Members" section
2. Owner can invite up to 3 team members by phone number or email
3. Roles: Owner (full access), Manager (edit products, view orders, no billing), Staff (view orders only)
4. Invited user receives a WhatsApp/email invite link
5. Team members see the shared shop dashboard with their role permissions
6. Activity log showing who made what changes

Only for Pro plan. Show as upgrade incentive for Starter users. Handle: removing team members, transferring ownership, team member already has their own shop.
```

---

## BONUS: SEO & Marketing Prompts

### Prompt 12: Dynamic Sitemap

```
Create a dynamic sitemap.xml for TradeFeed that auto-generates and includes:
- All public pages (homepage, marketplace, pricing, FAQ, how-it-works, terms, privacy)
- All active seller shop/catalog pages
- All published product pages
- Update frequency hints and last modified dates

Serve at /sitemap.xml. Update automatically when new shops or products are added. Also create a robots.txt at /robots.txt that allows all crawlers and points to the sitemap.
```

### Prompt 13: SEO Meta Tags

```
Add comprehensive SEO meta tags to all public pages on TradeFeed:

- Homepage: title "TradeFeed — Sell Your Products on WhatsApp | Free Catalog for SA Sellers", description targeting "WhatsApp catalog South Africa, sell online South Africa, product catalog WhatsApp"
- Each product page: dynamic title "[Product Name] — [Shop Name] | TradeFeed", description from product description, Open Graph image from product image
- Each shop page: dynamic title "[Shop Name] — WhatsApp Catalog | TradeFeed", description from shop bio
- Marketplace: "TradeFeed Marketplace — Browse Products from South African Sellers"

Include Open Graph tags (og:title, og:description, og:image, og:url) and Twitter Card tags for all pages. Use Next.js metadata API.
```
