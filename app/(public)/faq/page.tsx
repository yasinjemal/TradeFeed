import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { SeoCta, SeoPageShell } from "@/components/seo/seo-page";
import { JsonLdScript } from "@/components/tf/site/json-ld-script";
import { TfHeroFont } from "@/components/tf/tf-fonts";
import { generateFaqJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  // The root layout appends the brand — don't repeat it here.
  title: "FAQ — Frequently Asked Questions",
  description:
    "Get answers to common questions about selling on TradeFeed. Learn how to create your WhatsApp catalog, accept orders, manage products, and grow your South African business online.",
  keywords: [
    "TradeFeed FAQ",
    "WhatsApp catalog South Africa FAQ",
    "sell online South Africa help",
    "how to sell on WhatsApp",
    "online shop FAQ South Africa",
    "TradeFeed help",
    "WhatsApp business catalog questions",
    "sell products online South Africa",
    "create online shop South Africa",
    "PayFast payment questions",
  ],
  alternates: {
    canonical: "https://tradefeed.co.za/faq",
  },
  openGraph: {
    type: "website",
    title: "FAQ — Frequently Asked Questions | TradeFeed",
    description:
      "Answers to common questions about selling on TradeFeed — South Africa's WhatsApp-first online marketplace.",
    url: "https://tradefeed.co.za/faq",
    images: [
      {
        url: "/api/og?title=Frequently+Asked+Questions&subtitle=Everything+you+need+to+know+about+TradeFeed",
        width: 1200,
        height: 630,
        alt: "TradeFeed FAQ",
      },
    ],
    locale: "en_ZA",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — Frequently Asked Questions | TradeFeed",
    description:
      "Answers to common questions about selling on TradeFeed — South Africa's WhatsApp-first online marketplace.",
  },
};

// Categorised FAQ data — also used for JSON-LD structured data
const FAQ_CATEGORIES = [
  {
    title: "Getting Started",
    items: [
      {
        q: "What is TradeFeed?",
        a: "TradeFeed is South Africa's WhatsApp-first online marketplace. You create a professional product catalog, share the link on WhatsApp, social media, or anywhere — and customers browse and send you structured orders directly on WhatsApp. No app download needed for you or your buyers.",
      },
      {
        q: "How do I create my online shop?",
        a: "Sign up for free, enter your shop name and WhatsApp number, and you're live. You can start adding products immediately — upload a photo, set a price, and publish. Your catalog gets its own unique link you can share anywhere.",
      },
      {
        q: "Do I need any technical skills?",
        a: "Not at all. If you can post a photo on WhatsApp, you can use TradeFeed. Upload a product photo, type a name and price, hit save. That's it. We even have AI that writes your product title and description for you automatically.",
      },
      {
        q: "How does the AI product listing work?",
        a: "Upload a product photo and our AI (powered by GPT-4 Vision) generates the title, description, category, and SEO tags in about 10 seconds. You get 10 free AI generations every month on the Free plan. Just review, tweak if needed, and publish.",
      },
      {
        q: "Do my customers need to download an app?",
        a: "No. Your customers just tap your catalog link — it opens in their phone browser. No app download, no sign-up, no registration. They browse products, add to cart, and order via WhatsApp. Works on any smartphone.",
      },
      {
        q: "Who is TradeFeed for?",
        a: "Any seller who uses WhatsApp to sell products — whether you're a Jeppe Street wholesaler, a boutique reseller, or selling from home. If your customers DM you for prices and stock, TradeFeed replaces that back-and-forth with a professional catalog link. Works great for clothing, shoes, electronics, beauty products, accessories, and any physical goods.",
      },
    ],
  },
  {
    title: "Products & Catalog",
    items: [
      {
        q: "How many products can I list?",
        a: "The Free plan supports up to 20 products. Starter (R99/month) and above give you unlimited products. Most small sellers start free and upgrade once they outgrow 20 listings.",
      },
      {
        q: "Can I add sizes, colours, and other options?",
        a: "Yes. Every product supports variants — sizes (S, M, L, XL…), colours, materials, or any custom option. Customers pick exactly what they want from your catalog before ordering, so you don't get \"which size?\" messages anymore.",
      },
      {
        q: "Can I update stock and prices easily?",
        a: "Yes. Log into your dashboard from any device, edit any product, change prices, add new sizes or colours, upload new photos, or mark items as sold out. Changes appear on your catalog link instantly.",
      },
      {
        q: "Can I upload products in bulk?",
        a: "Absolutely. You can use our bulk image upload to drop up to 50 photos at once — AI processes them in the background and generates listings for each. You can also import from a CSV spreadsheet if you have existing product data.",
      },
      {
        q: "What happens to my product photos?",
        a: "Your images are hosted on a fast CDN (content delivery network) optimised for South African mobile users. We compress them for quick loading — even on 3G — while keeping them crystal clear. No extra cost for image hosting.",
      },
      {
        q: "Can I organise my products into categories?",
        a: "Yes. You can create categories and subcategories to keep your catalog tidy. Buyers can filter by category when browsing your shop, making it easier to find what they're looking for.",
      },
    ],
  },
  {
    title: "WhatsApp Orders",
    items: [
      {
        q: "How do orders work on TradeFeed?",
        a: "When a buyer taps \"Order on WhatsApp\" in your catalog, it opens their WhatsApp with a pre-filled message containing their selected products, sizes, colours, quantities, and total. You receive a clean, structured order — no manual back-and-forth.",
      },
      {
        q: "How is this different from posting in WhatsApp groups?",
        a: "WhatsApp posts get buried in 10 minutes. With TradeFeed, your products live on a permanent, searchable, shareable catalog page. Customers can browse anytime, filter by category, sort by price, and send you organized orders with exact sizes, colours, and quantities.",
      },
      {
        q: "How is my WhatsApp number used?",
        a: "Use a business WhatsApp number. TradeFeed places it in order links so buyers can contact you directly, which means it may be visible to buyers and automated tools. We do not sell it or use it for unrelated marketing. See our privacy policy for full details.",
      },
      {
        q: "Can buyers track their orders?",
        a: "Orders placed through the cart get a unique tracking number (e.g. TF-20260224-0042). Direct WhatsApp enquiries do not create tracked orders. You update the order status from your dashboard — Pending → Confirmed → Shipped → Delivered — and buyers can check their order status anytime using their tracking number.",
      },
    ],
  },
  {
    title: "Payments & Pricing",
    items: [
      {
        q: "How much does TradeFeed cost?",
        a: "Free to start with up to 20 products — forever. Starter is R99/month (unlimited products, 25 AI generations, buyer reviews). Pro is R299/month (unlimited AI, team accounts, advanced analytics). Pro AI is R499/month (full AI automation). No hidden fees. Cancel anytime.",
      },
      {
        q: "How do I accept payments from my customers?",
        a: "TradeFeed facilitates the order via WhatsApp — you and your buyer agree on payment directly, the same way you do now (EFT, cash on delivery, e-wallet, etc.). We don't process customer payments or take a commission on your sales.",
      },
      {
        q: "How do I pay for my TradeFeed subscription?",
        a: "Subscription payments are processed securely through PayFast — South Africa's most trusted payment gateway. You can pay with credit/debit card, EFT, or any PayFast-supported method. All prices are in ZAR and include VAT.",
      },
      {
        q: "Can I cancel my subscription anytime?",
        a: "Yes. You can downgrade or cancel from your dashboard at any time. If you cancel a paid plan, you keep access until the end of your billing period, then you're moved to the Free plan. Your products and data are never deleted.",
      },
    ],
  },
  {
    title: "Growth & Marketing",
    items: [
      {
        q: "How do I get more customers to my catalog?",
        a: "Share your catalog link everywhere — WhatsApp status, groups, Facebook, Instagram bio, TikTok. Your products also appear on the TradeFeed marketplace where new buyers discover sellers daily. Starter and above get promoted listings for extra visibility.",
      },
      {
        q: "What is the TradeFeed Marketplace?",
        a: "The marketplace is a public directory where buyers browse products from TradeFeed sellers. Eligible active listings can appear there, giving buyers another way to discover your catalogue.",
      },
      {
        q: "Can my buyers leave reviews?",
        a: "Yes, on the Starter plan and above. After you mark an order as delivered, the buyer can leave a star rating and optional text review. Reviews appear on your product pages and help build trust with new customers.",
      },
      {
        q: "What is the Verified Seller badge?",
        a: "The Verified badge shows buyers that your business has been confirmed by TradeFeed. It builds trust and can increase your conversion rate. Verification is available for active sellers who meet our quality criteria.",
      },
    ],
  },
  {
    title: "Account & Security",
    items: [
      {
        q: "Is my data safe on TradeFeed?",
        a: "Yes. We use industry-standard encryption (SSL) for all data in transit, secure authentication via Clerk, and we're fully POPIA compliant. We never share your personal information or customer data with third parties without consent.",
      },
      {
        q: "Can I have multiple staff on my account?",
        a: "Yes, on the Pro plan. You can invite up to 3 team members with different roles — Manager (edit products, view orders) or Staff (view orders only). Great for wholesalers with multiple salespeople.",
      },
      {
        q: "What if I need help?",
        a: "Free users can reach us via the contact page. Starter users get email support. Pro and Pro AI users get priority WhatsApp support — message us directly and we'll respond within hours. We also have a growing FAQ and help documentation.",
      },
    ],
  },
] as const satisfies readonly { title: string; items: readonly { q: string; a: string }[] }[];

const ALL_FAQ_ITEMS = FAQ_CATEGORIES.flatMap((cat) => [...cat.items]);

export default async function FaqPage() {
  const tLanding = await getTranslations("landing");

  return (
    // Same header, footer and breadcrumb schema as /pricing and the money pages.
    <SeoPageShell breadcrumb={{ name: "FAQ", path: "/faq" }}>
      <TfHeroFont />
      {/* FAQPage rich-results schema — mirrors the visible questions below */}
      <JsonLdScript
        data={generateFaqJsonLd(ALL_FAQ_ITEMS.map((f) => ({ question: f.q, answer: f.a })))}
      />

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-tf-primary">
        Help centre
      </p>
      <h1
        className="mt-2 font-tf-hero font-semibold text-tf-ink"
        style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", lineHeight: "1.05", letterSpacing: "-0.035em" }}
      >
        {tLanding("faq.title")}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-tf-stone-600">
        {tLanding("faq.subtitle")}
      </p>

      <div className="mt-10 space-y-12">
        {FAQ_CATEGORIES.map((category) => (
          <section key={category.title} aria-label={category.title}>
            <h2 className="font-tf-display text-2xl font-semibold tracking-tight text-tf-ink">
              {category.title}
            </h2>
            <div className="mt-4 space-y-3">
              {category.items.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-tf-stone-200 bg-tf-raised open:shadow-tf-sm"
                >
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-tf-ink outline-none focus-visible:ring-2 focus-visible:ring-tf-primary [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <ChevronDown
                      aria-hidden="true"
                      className="size-4 shrink-0 text-tf-stone-500 transition-transform duration-200 motion-reduce:transition-none group-open:rotate-180"
                    />
                  </summary>
                  <p className="px-5 pb-4 text-sm leading-relaxed text-tf-stone-600">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-12 text-[15px] leading-relaxed text-tf-stone-600">
        Still have a question?{" "}
        <Link href="/contact" className="text-tf-primary underline underline-offset-2">
          Contact us
        </Link>{" "}
        by email or WhatsApp and a person will answer.
      </p>

      <SeoCta />
    </SeoPageShell>
  );
}
