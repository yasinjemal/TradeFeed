import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FaqItem } from "@/components/landing/animated-stats";
import { FadeIn } from "@/components/landing/fade-in";
import { generateFaqJsonLd } from "@/lib/seo/json-ld";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "FAQ — Frequently Asked Questions | TradeFeed",
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
        q: "Is my WhatsApp number safe?",
        a: "Absolutely. Your WhatsApp number is only used to receive orders. When a customer taps the order button, it opens their WhatsApp with a pre-filled message. We never share your number with third parties, and it's protected by our POPIA-compliant privacy policy.",
      },
      {
        q: "Can buyers track their orders?",
        a: "Yes. Every order gets a unique tracking number (e.g. TF-20260224-0042). You update the order status from your dashboard — Pending → Confirmed → Shipped → Delivered — and buyers can check their order status anytime using their tracking number.",
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
        a: "The marketplace is a public directory where buyers from across all 9 South African provinces browse and discover products from TradeFeed sellers. Your listed products appear there automatically, giving you free exposure to new customers 24/7.",
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
    <div className="min-h-screen bg-white text-slate-900">
      {/* FAQ JSON-LD for Google rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateFaqJsonLd(
              ALL_FAQ_ITEMS.map((f) => ({ question: f.q, answer: f.a }))
            )
          ),
        }}
      />
      {/* Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "TradeFeed",
                item: "https://tradefeed.co.za",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "FAQ",
                item: "https://tradefeed.co.za/faq",
              },
            ],
          }),
        }}
      />

      {/* Header */}
      <div className="pt-32 pb-16 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full mb-6">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
              Help Centre
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              {tLanding("faq.title")}
            </h1>
            <p className="mt-3 text-slate-500 text-sm max-w-xl mx-auto">
              {tLanding("faq.subtitle")}
            </p>
          </FadeIn>
        </div>
      </div>

      {/* FAQ sections by category */}
      <div className="pb-24 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-16">
          {FAQ_CATEGORIES.map((category, catIdx) => (
            <section key={category.title}>
              <FadeIn delay={catIdx * 0.05}>
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {catIdx + 1}
                  </span>
                  {category.title}
                </h2>
              </FadeIn>
              <div className="space-y-3">
                {category.items.map((faq, i) => (
                  <FadeIn key={faq.q} delay={catIdx * 0.05 + i * 0.03}>
                    <FaqItem question={faq.q} answer={faq.a} />
                  </FadeIn>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <FadeIn>
          <div className="max-w-3xl mx-auto mt-20 text-center">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Still have questions?
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                We&apos;re here to help. Reach out and we&apos;ll get back to you as soon as possible.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Contact Us
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all"
                >
                  Start Selling Free →
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
