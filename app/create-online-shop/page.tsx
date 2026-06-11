import type { Metadata } from "next";
import Link from "next/link";

import { SeoPageShell, SeoSection, SeoCta } from "@/components/seo/seo-page";
import { SeoFaq } from "@/components/seo/faq";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tradefeed.co.za";

export const metadata: Metadata = {
  title: "Create an Online Shop in South Africa — Free, Live in 3 Minutes",
  description:
    "Create a free online shop in South Africa: no coding, no hosting, no monthly fees to start. Upload a photo, AI writes the listing, share your link, take orders on WhatsApp.",
  alternates: { canonical: `${APP_URL}/create-online-shop` },
  openGraph: {
    title: "Create an Online Shop in South Africa — Free, Live in 3 Minutes",
    description: "A real online shop with one shareable link. Free for 20 products.",
    url: `${APP_URL}/create-online-shop`,
    siteName: "TradeFeed",
    type: "website",
  },
};

const FAQ = [
  { q: "Is it really free to create an online shop?", a: "Yes — 20 products free, forever, including 10 AI-written listings a month, your own shop link, and WhatsApp ordering. No credit card to start. Paid plans (from R99/month) add unlimited products and more AI." },
  { q: "Do I need to know how to build a website?", a: "No. If you can post a photo on WhatsApp, you can build your shop. Upload a photo, AI writes the listing, you hit publish." },
  { q: "Can I use my own domain name?", a: "Yes — on higher plans you can connect your own .co.za domain so your shop runs on your brand, with SSL handled for you." },
  { q: "How do customers pay?", a: "You confirm payment in the WhatsApp chat: EFT, PayFast for cards, or cash on delivery. TradeFeed never holds your money." },
  { q: "What can I sell?", a: "Any legal physical goods — clothing, shoes, beauty, electronics, accessories, food, wholesale stock. Retail and wholesale pricing can run side by side." },
];

export default function CreateOnlineShopPage() {
  return (
    <SeoPageShell breadcrumb={{ name: "Create an online shop", path: "/create-online-shop" }}>
      <h1 className="font-tf-display text-4xl font-semibold leading-tight tracking-tight">
        Create an online shop in South Africa — free, in minutes
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-tf-stone-600">
        No coding, no hosting, no designer, no monthly fee to start. A real shop with a real
        link, built from your product photos — and orders arriving where you already work:
        WhatsApp.
      </p>

      <SeoSection title="Live in under 3 minutes — honestly">
        <p>
          Sign up, name your shop, upload your first product photo. AI writes the title,
          description, category, and tags in about 10 seconds; you check it and publish. Your
          shop is now live at <em>tradefeed.co.za/your-shop-name</em> — a link you can put in
          WhatsApp groups, your status, Instagram bio, or on a printed card at your stall.
        </p>
      </SeoSection>

      <SeoSection title="What your shop includes">
        <p>
          Every shop — including free ones — gets a product catalogue with search and
          categories, pre-filled WhatsApp ordering with order numbers and tracking, a{" "}
          <strong>Verified Seller card</strong> showing buyers your stats and location, reviews
          collected from confirmed orders, and a dashboard with views, orders, and revenue. On
          higher plans you can connect your own .co.za domain and add team members.
        </p>
      </SeoSection>

      <SeoSection title="Shop builder vs website builder">
        <p>
          Website builders sell you pages; you still have to turn them into a shop — payments,
          product management, mobile layout, trust. TradeFeed starts from the shop and works
          backwards. If you&apos;re comparing against Shopify, Wix, or WooCommerce, the rand
          maths is in our{" "}
          <Link href="/compare/shopify-alternative-south-africa" className="text-tf-primary underline underline-offset-2">
            Shopify alternative comparison
          </Link>{" "}
          — including who should still pick Shopify.
        </p>
      </SeoSection>

      <SeoSection title="Already selling on WhatsApp or Instagram?">
        <p>
          Don&apos;t re-type your products.{" "}
          <Link href="/import-whatsapp-catalogue" className="text-tf-primary underline underline-offset-2">
            Import your WhatsApp catalogue
          </Link>{" "}
          in one go, or upload your photos in bulk and let AI draft every listing. Then read how
          the{" "}
          <Link href="/sell-on-whatsapp" className="text-tf-primary underline underline-offset-2">
            catalogue-link method
          </Link>{" "}
          turns your existing groups and followers into structured orders.
        </p>
      </SeoSection>

      <SeoCta />
      <SeoFaq items={FAQ} />
    </SeoPageShell>
  );
}
