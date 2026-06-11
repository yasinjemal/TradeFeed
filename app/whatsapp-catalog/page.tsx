import type { Metadata } from "next";
import Link from "next/link";

import { SeoPageShell, SeoSection, SeoCta } from "@/components/seo/seo-page";
import { SeoFaq } from "@/components/seo/faq";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tradefeed.co.za";

export const metadata: Metadata = {
  title: "WhatsApp Catalogue for Business — Beyond the Built-In Limits",
  description:
    "WhatsApp's built-in catalogue can't be searched, shared as a real shop, or found on Google. Get a proper WhatsApp catalogue link for your South African business — free.",
  alternates: { canonical: `${APP_URL}/whatsapp-catalog` },
  openGraph: {
    title: "WhatsApp Catalogue for Business — Beyond the Built-In Limits",
    description: "A real, shareable, searchable WhatsApp catalogue for SA sellers.",
    url: `${APP_URL}/whatsapp-catalog`,
    siteName: "TradeFeed",
    type: "website",
  },
};

const FAQ = [
  { q: "What's wrong with the WhatsApp Business built-in catalogue?", a: "Nothing — until you grow. It has no search or categories, buyers must already have your number to see it, it can't be found on Google, and there's no trust layer (no reviews, no verification, no order tracking). It's a brochure, not a shop." },
  { q: "Can I keep using WhatsApp Business alongside TradeFeed?", a: "Yes — that's the point. Orders still arrive in your WhatsApp. TradeFeed replaces the catalogue part, not the conversation part." },
  { q: "Can I move my existing WhatsApp catalogue over?", a: "Yes, in one import: photos, names, and prices come across, and AI tidies up the listings. See the import page for the walkthrough." },
  { q: "Does a catalogue link work for wholesale?", a: "Yes. You can run wholesale and retail pricing on the same products, set minimum order quantities, and take structured bulk enquiries on WhatsApp." },
  { q: "What does it cost?", a: "Free for 20 products. Paid plans from R99/month for unlimited products." },
];

export default function WhatsappCatalogPage() {
  return (
    <SeoPageShell breadcrumb={{ name: "WhatsApp catalogue for business", path: "/whatsapp-catalog" }}>
      <h1 className="font-tf-display text-4xl font-semibold leading-tight tracking-tight">
        A WhatsApp catalogue your buyers can actually find
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-tf-stone-600">
        WhatsApp Business gives you a catalogue. What it doesn&apos;t give you is a shop:
        something buyers can search, share, find on Google, and trust. That&apos;s the gap a
        catalogue link closes.
      </p>

      <SeoSection title="The built-in catalogue vs a real one">
        <p>
          The built-in catalogue lives inside your chat profile. Buyers must already have your
          number, scroll a flat list with no search or categories, and take your word on
          everything — no reviews, no verified badge, no order history. A TradeFeed catalogue is
          a real web page at your own link: searchable, organised by category, visible on Google,
          and carrying a <strong>Verified Seller card</strong> — your verification status, orders
          fulfilled, and reply time — on every page.
        </p>
      </SeoSection>

      <SeoSection title="What your catalogue link adds">
        <p>
          <strong>Discovery:</strong> your products appear on the TradeFeed marketplace and in
          Google searches, not just in chats you started. <strong>Order structure:</strong>{" "}
          buyers pick size, colour, and quantity themselves; the order arrives in your WhatsApp
          pre-filled with an order number. <strong>Trust:</strong> reviews from confirmed orders,
          verification, and live stats turn first-time browsers into buyers.{" "}
          <strong>One update, everywhere:</strong> change a price once and the link is current
          for everyone — no resending PDFs or re-posting.
        </p>
      </SeoSection>

      <SeoSection title="Already have a WhatsApp catalogue? Bring it with you">
        <p>
          You don&apos;t start from zero. The{" "}
          <Link href="/import-whatsapp-catalogue" className="text-tf-primary underline underline-offset-2">
            WhatsApp catalogue import
          </Link>{" "}
          pulls your photos, product names, and prices across in one go, and AI cleans up titles
          and descriptions. Most sellers are live in under ten minutes. From there, the{" "}
          <Link href="/sell-on-whatsapp" className="text-tf-primary underline underline-offset-2">
            catalogue-link method
          </Link>{" "}
          does the selling.
        </p>
      </SeoSection>

      <SeoCta label="Create your catalogue — free" />
      <SeoFaq items={FAQ} />
    </SeoPageShell>
  );
}
