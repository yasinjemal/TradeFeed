import type { Metadata } from "next";
import Link from "next/link";

import { SeoPageShell, SeoSection, SeoCta } from "@/components/seo/seo-page";
import { SeoFaq } from "@/components/seo/faq";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tradefeed.co.za";

export const metadata: Metadata = {
  title: "Shopify Alternative for South Africa — The Honest Comparison",
  description:
    "Shopify is excellent — and often the wrong tool for small SA sellers. The real rand cost compared, who should still pick Shopify, and the WhatsApp-first alternative.",
  alternates: { canonical: `${APP_URL}/compare/shopify-alternative-south-africa` },
  openGraph: {
    title: "Shopify Alternative for South Africa — The Honest Comparison",
    description: "Real rand costs, honest trade-offs, and who each platform actually fits.",
    url: `${APP_URL}/compare/shopify-alternative-south-africa`,
    siteName: "TradeFeed",
    type: "article",
  },
};

const FAQ = [
  { q: "Is TradeFeed a full Shopify replacement?", a: "No — and it doesn't try to be. Shopify is a complete ecommerce engine with themes, apps, and checkout. TradeFeed is a WhatsApp-first shop for SA sellers whose buyers live in WhatsApp. Different jobs; this page helps you pick the right one." },
  { q: "What does Shopify actually cost in rand?", a: "Shopify bills in USD, so the rand cost moves with the exchange rate — typically several hundred rand monthly on the entry plan before apps, a theme, and payment gateway fees. Check shopify.com for current pricing; we deliberately don't quote a number that will go stale." },
  { q: "Can I start on TradeFeed and move to Shopify later?", a: "Yes. Your product photos, names, and prices are yours. Many sellers start WhatsApp-first and add a full website when volume and margins justify it." },
  { q: "Does TradeFeed take transaction fees like marketplaces do?", a: "No — buyers pay you directly (EFT, PayFast, COD). The platform is a subscription, free for your first 20 products." },
];

export default function ShopifyAlternativePage() {
  return (
    <SeoPageShell breadcrumb={{ name: "Shopify alternative for South Africa", path: "/compare/shopify-alternative-south-africa" }}>
      <h1 className="font-tf-display text-4xl font-semibold leading-tight tracking-tight">
        Shopify alternative for South Africa — the honest comparison
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-tf-stone-600">
        Shopify is a world-class product. It&apos;s also priced in dollars, built for buyers who
        check out on websites, and heavier than most small SA sellers need. Here&apos;s the
        comparison we&apos;d want if we were choosing — including when Shopify is the right
        answer.
      </p>

      <SeoSection title="The real cost, in rand">
        <p>
          Shopify&apos;s subscription is billed in USD, so your rand price moves with the
          exchange rate — and the subscription is only the start. A presentable theme, a couple
          of apps, and payment gateway fees are part of the honest total. TradeFeed is priced in
          rand: <strong>free for 20 products</strong>, then{" "}
          <Link href="/pricing" className="text-tf-primary underline underline-offset-2">
            R99–R499/month
          </Link>{" "}
          with no transaction fees. We don&apos;t quote Shopify&apos;s current numbers here
          because they change — check their pricing page and do the rand maths for the full
          stack, not just the subscription. (Comparison reviewed quarterly.)
        </p>
      </SeoSection>

      <SeoSection title="Where your buyers actually are">
        <p>
          The deeper difference isn&apos;t price — it&apos;s the buyer. Shopify assumes buyers
          who browse a website and pay at a card checkout. Most small SA sellers&apos; buyers
          are in WhatsApp groups, pay by EFT or cash on delivery, and trust conversations more
          than checkouts. TradeFeed is built around that reality: one catalogue link, pre-filled
          WhatsApp orders, payment agreed in chat, and a{" "}
          <strong>Verified Seller card</strong> doing the trust work a brand website normally
          does.
        </p>
      </SeoSection>

      <SeoSection title="Who should still pick Shopify">
        <p>
          Honestly: pick Shopify if you need a branded website with online card checkout as the
          primary flow, you&apos;re selling beyond WhatsApp-native audiences (including
          internationally), and the monthly stack cost is comfortably covered by margins. Pick
          TradeFeed if your sales already happen in chats and your bottleneck is buried posts,
          price questions, and trust — the problems described in{" "}
          <Link href="/sell-on-whatsapp" className="text-tf-primary underline underline-offset-2">
            how to sell on WhatsApp
          </Link>.
        </p>
      </SeoSection>

      <SeoSection title="Side by side">
        <p>
          <strong>Setup:</strong> Shopify — hours to days (theme, apps, gateway). TradeFeed —
          minutes (photo → AI listing → link). <strong>Skills needed:</strong> Shopify — some
          web confidence. TradeFeed — if you can WhatsApp, you can run it.{" "}
          <strong>Ordering:</strong> Shopify — website checkout. TradeFeed — pre-filled WhatsApp
          orders with tracking numbers. <strong>Marketplace exposure:</strong> Shopify — none
          built in. TradeFeed — your products also appear on the TradeFeed marketplace.{" "}
          <strong>Best for:</strong> Shopify — established brands. TradeFeed — WhatsApp-first SA
          sellers, from side hustle to wholesale. Start with{" "}
          <Link href="/create-online-shop" className="text-tf-primary underline underline-offset-2">
            a free shop
          </Link>{" "}
          and test it against your own numbers.
        </p>
      </SeoSection>

      <SeoCta label="Try the WhatsApp-first way — free" />
      <SeoFaq items={FAQ} />
      <p className="mt-6 text-xs text-tf-stone-400">
        Shopify is a trademark of Shopify Inc. This page makes factual comparisons only and is
        reviewed quarterly. Last reviewed: June 2026.
      </p>
    </SeoPageShell>
  );
}
