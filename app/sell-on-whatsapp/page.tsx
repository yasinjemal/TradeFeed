import type { Metadata } from "next";
import Link from "next/link";

import { SeoPageShell, SeoSection, SeoCta } from "@/components/seo/seo-page";
import { SeoFaq } from "@/components/seo/faq";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tradefeed.co.za";

export const metadata: Metadata = {
  title: "How to Sell on WhatsApp in South Africa (The Catalogue-Link Method)",
  description:
    "Stop losing sales to buried group posts and 'how much?' messages. The catalogue-link method: one shareable shop link, pre-filled orders, payment confirmed in chat.",
  alternates: { canonical: `${APP_URL}/sell-on-whatsapp` },
  openGraph: {
    title: "How to Sell on WhatsApp in South Africa",
    description: "The catalogue-link method that turns WhatsApp chats into organised orders.",
    url: `${APP_URL}/sell-on-whatsapp`,
    siteName: "TradeFeed",
    type: "website",
  },
};

const HOWTO_LD = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to sell on WhatsApp with a catalogue link",
  description: "Turn WhatsApp selling into organised orders with one shareable catalogue link.",
  step: [
    { "@type": "HowToStep", name: "Create your free shop", text: "Sign up on TradeFeed and upload product photos. AI writes each listing in about 10 seconds." },
    { "@type": "HowToStep", name: "Share your catalogue link", text: "Post your single shop link in WhatsApp groups, your status, and your Instagram bio." },
    { "@type": "HowToStep", name: "Receive pre-filled orders", text: "Buyers browse, pick a size and quantity, and tap Order on WhatsApp — the order message arrives ready-made in your chat." },
    { "@type": "HowToStep", name: "Confirm payment and delivery", text: "Agree on EFT, PayFast, or cash on delivery in the chat, then deliver and mark the order complete." },
  ],
};

const FAQ = [
  { q: "Is selling on WhatsApp allowed?", a: "Yes. WhatsApp Business exists exactly for this. What gets sellers blocked is spammy bulk messaging — the catalogue-link method avoids that because buyers come to you." },
  { q: "Why not just use the built-in WhatsApp Business catalogue?", a: "It works until it doesn't: no search, no categories, no link Google can find, and buyers must already have your number. A TradeFeed catalogue is a real web page — searchable, shareable, and trust-badged. You can import your existing WhatsApp catalogue in one go." },
  { q: "How do I stop the endless 'how much?' messages?", a: "Put the price on the listing. When buyers browse your catalogue link, they see prices, sizes, and stock before they message you — so the first message you get is an order, not a question." },
  { q: "Do my buyers need to download anything?", a: "No. Your catalogue link opens in any phone browser, and orders arrive in WhatsApp, which they already have." },
  { q: "What does it cost?", a: "Free for your first 20 products, with 10 AI-written listings a month. Paid plans from R99/month when you grow." },
];

export default function SellOnWhatsappPage() {
  return (
    <SeoPageShell breadcrumb={{ name: "Sell on WhatsApp", path: "/sell-on-whatsapp" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(HOWTO_LD) }} />

      <h1 className="font-tf-display text-4xl font-semibold leading-tight tracking-tight">
        How to sell on WhatsApp — without the chaos
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-tf-stone-600">
        You&apos;re already selling on WhatsApp. The problem isn&apos;t WhatsApp — it&apos;s that
        your shop lives in posts that vanish. Here&apos;s the method serious SA sellers use to
        turn the same chats into organised, trackable orders.
      </p>

      <SeoSection title="Why WhatsApp selling stalls">
        <p>
          Three reasons, and you&apos;ve felt all of them. <strong>Posts get buried</strong> — a
          group post is gone in ten minutes, and reposting gets you muted.{" "}
          <strong>Every sale costs twenty messages</strong> — &quot;how much?&quot;, &quot;what
          sizes?&quot;, &quot;is it still available?&quot; <strong>New buyers don&apos;t trust
          you</strong> — a stranger with a phone number is a risk; a shop with verified status,
          order history, and reviews is not.
        </p>
      </SeoSection>

      <SeoSection title="The catalogue-link method">
        <p>
          Instead of posting products, you post <strong>one link</strong>. The link is your whole
          shop: every product, every price, every size, searchable, always current. Buyers browse
          on their own time, choose exactly what they want, and tap{" "}
          <strong>Order on WhatsApp</strong> — which opens your chat with the order pre-filled:
          product, variant, quantity, total, and an order number you can both track.
        </p>
        <p>
          Your group posts change from &quot;new stock 🔥 DM me&quot; to &quot;new stock just
          landed — browse and order here: [your link]&quot;. One message, zero back-and-forth,
          and the post keeps working long after it scrolls away because the link never expires.
        </p>
      </SeoSection>

      <SeoSection title="Setting up in under 3 minutes">
        <p>
          Create a free shop, upload a product photo, and AI writes the listing — title,
          description, tags — in about 10 seconds. Already maintaining a WhatsApp Business
          catalogue? <Link href="/import-whatsapp-catalogue" className="text-tf-primary underline underline-offset-2">Import the whole thing at once</Link>{" "}
          instead of re-typing it. Then share your link everywhere your buyers already are. For
          the bigger picture on what a proper catalogue adds over the built-in one, see{" "}
          <Link href="/whatsapp-catalog" className="text-tf-primary underline underline-offset-2">
            WhatsApp catalogue for business
          </Link>.
        </p>
      </SeoSection>

      <SeoSection title="Getting paid">
        <p>
          Payment happens where the trust is — in the chat. EFT with proof of payment, PayFast
          for cards, or cash on delivery locally. Nothing is paid until you and the buyer agree,
          and the written record protects both sides. Your WhatsApp number is never shown
          publicly on TradeFeed; it&apos;s only used when a buyer places an order.
        </p>
      </SeoSection>

      <SeoCta label="Get your catalogue link" />
      <SeoFaq items={FAQ} />
    </SeoPageShell>
  );
}
