import type { Metadata } from "next";
import Link from "next/link";

import { SeoPageShell, SeoSection, SeoCta } from "@/components/seo/seo-page";
import { SeoFaq } from "@/components/seo/faq";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tradefeed.co.za";

export const metadata: Metadata = {
  title: "Sell Online in South Africa — Start Free, No Website Needed",
  description:
    "How to sell online in South Africa with just a phone: photo in, AI listing out, one shareable WhatsApp catalogue link. Free for 20 products. Step-by-step guide.",
  alternates: { canonical: `${APP_URL}/sell-online-south-africa` },
  openGraph: {
    title: "Sell Online in South Africa — Start Free, No Website Needed",
    description:
      "Everything you need to start selling online in SA: a phone, a product photo, and one link. Free to start.",
    url: `${APP_URL}/sell-online-south-africa`,
    siteName: "TradeFeed",
    type: "website",
  },
};

const FAQ = [
  { q: "What do I need to start selling online in South Africa?", a: "A smartphone, product photos, and somewhere buyers can browse and order. On TradeFeed that's a free online shop with one shareable link — no website, no coding, no app for your buyers to download." },
  { q: "How much does it cost to sell online?", a: "TradeFeed is free for your first 20 products, forever, including 10 AI-written listings a month. Paid plans start at R99/month when you outgrow that. No card needed to start." },
  { q: "Do I need to register a company to sell online in SA?", a: "No — you can start selling as an individual. Registering with CIPC becomes worth it as you grow (it helps with business banking and wholesale accounts), but it is not a requirement to open your shop." },
  { q: "How do I get paid safely?", a: "Most sellers confirm payment in the WhatsApp chat: EFT, PayFast, or cash on delivery for local orders. TradeFeed never holds your money — buyers pay you directly." },
  { q: "Can buyers trust a small online shop?", a: "That's exactly what TradeFeed is built for. Your shop shows a Verified Seller card — verification status, orders fulfilled, reply time, and location — so a small reseller looks as trustworthy as an established store." },
];

export default function SellOnlineSouthAfricaPage() {
  return (
    <SeoPageShell breadcrumb={{ name: "Sell online in South Africa", path: "/sell-online-south-africa" }}>
      <h1 className="font-tf-display text-4xl font-semibold leading-tight tracking-tight">
        Sell online in South Africa — with just your phone
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-tf-stone-600">
        You don&apos;t need a website, a developer, or a warehouse. If you have products and a
        phone, you can be taking orders today. Here&apos;s the honest version of how selling
        online works in SA — and the fastest way to start.
      </p>

      <SeoSection title="What you actually need (it's shorter than you think)">
        <p>
          Three things: <strong>product photos</strong>, <strong>a place buyers can browse</strong>,
          and <strong>a way to take orders</strong>. Most South African sellers already have the
          third one — WhatsApp. What they&apos;re missing is the middle piece: posts in groups get
          buried in minutes, and Instagram DMs turn every sale into twenty messages.
        </p>
        <p>
          A TradeFeed shop fills that gap. Your products live at one permanent link
          (<em>tradefeed.co.za/your-shop</em>), buyers browse and pick sizes themselves, and the
          order arrives in your WhatsApp pre-filled — product, variant, quantity, total.
        </p>
      </SeoSection>

      <SeoSection title="The WhatsApp-first way vs the website way">
        <p>
          A traditional online store (Shopify, Wix, WooCommerce) means monthly fees in dollars,
          payment gateway setup, and buyers who must trust an unknown website with their card.
          The WhatsApp-first way flips it: buyers order in the app they already use daily, you
          confirm payment and delivery in chat, and your catalogue link does the selling. For
          most small SA sellers, that&apos;s not the budget option — it&apos;s the better option.
          If you&apos;re weighing it up, read our{" "}
          <Link href="/compare/shopify-alternative-south-africa" className="text-tf-primary underline underline-offset-2">
            honest Shopify comparison
          </Link>.
        </p>
      </SeoSection>

      <SeoSection title="Three steps to your first order">
        <p>
          <strong>1. Snap a photo.</strong> Upload it and AI writes the title, description and
          tags in about 10 seconds. You check it and publish.{" "}
          <strong>2. Share one link.</strong> Post your catalogue link in WhatsApp groups, your
          status, Instagram bio — anywhere your buyers are. Already have a WhatsApp Business
          catalogue?{" "}
          <Link href="/import-whatsapp-catalogue" className="text-tf-primary underline underline-offset-2">
            Import it in one go
          </Link>
          . <strong>3. Take orders on WhatsApp.</strong> Buyers send a ready-made order message;
          you confirm payment and delivery. The full method is in our guide to{" "}
          <Link href="/sell-on-whatsapp" className="text-tf-primary underline underline-offset-2">
            selling on WhatsApp
          </Link>.
        </p>
      </SeoSection>

      <SeoSection title="What it costs">
        <p>
          R0 to start: 20 products free, forever, with 10 AI listings a month. Upgrade to
          Starter (R99/month) for unlimited products when the orders justify it. Full details on
          the{" "}
          <Link href="/pricing" className="text-tf-primary underline underline-offset-2">
            pricing page
          </Link>{" "}
          — prices in rand, cancel anytime, no card to start.
        </p>
      </SeoSection>

      <SeoSection title="Getting paid safely">
        <p>
          Confirm payment before you ship — EFT with proof, PayFast for card payments, or cash
          on delivery for local orders. Because the conversation happens on WhatsApp, you keep a
          written record of every agreement. Your number stays private on TradeFeed until a
          buyer actually places an order (POPIA-compliant by design).
        </p>
      </SeoSection>

      <SeoCta />
      <SeoFaq items={FAQ} />
    </SeoPageShell>
  );
}
