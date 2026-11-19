// ============================================================
// About TradeFeed — /about
// ============================================================
// The "who am I dealing with" page: what TradeFeed is, how an
// order and its money actually move, how sellers are checked,
// and the company behind it.
//
// Nothing on this page may be invented. Company identity comes
// from lib/config/company.ts (unfilled fields are omitted in
// production and shown as TODO markers on local/preview builds).
// Everything else restates what the product, the Terms and the
// Privacy Policy already say — if those change, change this too.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

import { SeoCta, SeoPageShell, SeoSection } from "@/components/seo/seo-page";
import { TfCompanyDetails } from "@/components/tf/site/company-details";
import { JsonLdScript } from "@/components/tf/site/json-ld-script";
import { TfHeroFont } from "@/components/tf/tf-fonts";
import { COMPANY } from "@/lib/config/company";
import { SITE_ORIGIN } from "@/lib/seo/site-url";

const DESCRIPTION =
  "Who runs TradeFeed, how orders and payments work between buyers and sellers, how sellers are verified, and how to reach a person.";

export const metadata: Metadata = {
  // The root layout appends the brand — don't repeat it here.
  title: "About Us — Who Runs This Marketplace",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_ORIGIN}/about` },
  openGraph: {
    title: "About TradeFeed",
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/about`,
    siteName: "TradeFeed",
    type: "website",
    locale: "en_ZA",
  },
};

const linkCls = "text-tf-primary underline underline-offset-2";

export default function AboutPage() {
  const aboutLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About TradeFeed",
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/about`,
    inLanguage: "en-ZA",
    // The Organization node itself is emitted once, by the root layout.
    about: { "@type": "Organization", name: COMPANY.brandName, url: SITE_ORIGIN },
  };

  return (
    <SeoPageShell breadcrumb={{ name: "About", path: "/about" }}>
      <TfHeroFont />
      <JsonLdScript data={aboutLd} />

      <h1
        className="font-tf-hero font-semibold text-tf-ink"
        style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", lineHeight: "1.05", letterSpacing: "-0.035em" }}
      >
        About TradeFeed
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-tf-stone-600">
        TradeFeed gives South African sellers an online shop that works the way they already
        sell: one catalogue link to share, and orders that arrive on WhatsApp.
      </p>

      <SeoSection title="What TradeFeed does">
        <p>
          A seller signs up, adds a product photo, and gets a catalogue page with its own
          link. AI drafts the listing from the photo; the seller checks it and publishes.
          Buyers open the link in their phone&apos;s browser — no app and no account — pick
          what they want, and send the seller a ready-made order message on WhatsApp.
        </p>
        <p>
          Every published product can also appear on the{" "}
          <Link href="/marketplace" className={linkCls}>
            TradeFeed marketplace
          </Link>
          , where buyers browse shops from across South Africa. The step-by-step version is
          on{" "}
          <Link href="/how-it-works" className={linkCls}>
            How it works
          </Link>
          .
        </p>
      </SeoSection>

      <SeoSection title="How orders and payments work">
        <p>
          <strong>You buy from the seller, not from TradeFeed.</strong> Each shop is run by
          an independent business. When you order, your message goes straight to that
          seller&apos;s WhatsApp, and you agree on payment and delivery with them. TradeFeed
          is not a party to the sale — the full position is in our{" "}
          <Link href="/terms" className={linkCls}>
            Terms of Service
          </Link>
          .
        </p>
        <p>
          Sellers choose which payment methods they accept and tell you in the chat. Confirm
          the total, including delivery, before you pay. Every order gets an order number
          you can use to{" "}
          <Link href="/track" className={linkCls}>
            track it
          </Link>
          , and if something goes wrong you can{" "}
          <Link href="/support/order" className={linkCls}>
            ask us for help with an order
          </Link>
          .
        </p>
        <p>
          Sellers pay TradeFeed a monthly subscription for the shop itself. Starting is free;
          the paid plans and what they include are on the{" "}
          <Link href="/pricing" className={linkCls}>
            pricing page
          </Link>
          . Subscriptions are billed in rand through PayFast, by card or EFT.
        </p>
      </SeoSection>

      <SeoSection title="How sellers are checked">
        <p>
          Anyone can open a shop, so a shop on TradeFeed is not automatically a business we
          have vetted. The <strong>Verified Seller</strong> badge is different: a seller
          earns it by submitting their business details, and a person at TradeFeed reviews
          them before the badge is switched on. A shop without the badge has not been through
          that review.
        </p>
        <p>
          Seller pages show what we actually know — location, how long the shop has been
          on TradeFeed, and buyer reviews. Listings flagged for breaking our rules are
          hidden from the marketplace.
        </p>
      </SeoSection>

      <SeoSection title="Your information">
        <p>
          TradeFeed is operated in South Africa and handles personal information under the
          Protection of Personal Information Act (POPIA). Buyer phone numbers are masked
          wherever they are shown publicly, and marketing messages are opt-in. What we
          collect, why, and how to reach our Information Officer is set out in the{" "}
          <Link href="/privacy" className={linkCls}>
            Privacy Policy
          </Link>
          .
        </p>
      </SeoSection>

      <section className="mt-10" aria-labelledby="company-details">
        <h2
          id="company-details"
          className="font-tf-display text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Who you&apos;re dealing with
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-tf-stone-600">
          Talk to a person by email or WhatsApp. More ways to get help are on the{" "}
          <Link href="/contact" className={linkCls}>
            contact page
          </Link>
          .
        </p>
        <div className="mt-5 rounded-xl border border-tf-stone-200 bg-tf-raised p-5">
          <TfCompanyDetails />
        </div>
      </section>

      <SeoCta />
    </SeoPageShell>
  );
}
