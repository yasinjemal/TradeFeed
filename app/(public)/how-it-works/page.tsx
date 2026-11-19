import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { SeoCta, SeoPageShell } from "@/components/seo/seo-page";
import { TfHeroFont } from "@/components/tf/tf-fonts";

export const metadata: Metadata = {
  // The root layout appends the brand — don't repeat it here.
  title: "How It Works — Sell on WhatsApp in 3 Easy Steps",
  description:
    "Create your free online shop in under 5 minutes. Snap a product photo, AI writes the listing, share your catalog link, and receive structured orders on WhatsApp. No app needed. Start selling in South Africa today.",
  keywords: [
    "how to sell on WhatsApp South Africa",
    "how to sell online South Africa",
    "create online shop South Africa",
    "WhatsApp catalog how it works",
    "start selling online free",
    "WhatsApp business South Africa",
    "how to create online store South Africa",
    "sell products WhatsApp",
    "AI product listing South Africa",
    "free online shop South Africa",
  ],
  alternates: {
    canonical: "https://tradefeed.co.za/how-it-works",
  },
  openGraph: {
    type: "website",
    title: "How It Works — Sell on WhatsApp in 3 Easy Steps | TradeFeed",
    description:
      "Snap a photo, AI creates the listing, share your link, get orders on WhatsApp. Free to start — set up in under 5 minutes.",
    url: "https://tradefeed.co.za/how-it-works",
    images: [
      {
        url: "/api/og?title=How+It+Works&subtitle=Photo+%E2%86%92+AI+Listing+%E2%86%92+WhatsApp+Orders",
        width: 1200,
        height: 630,
        alt: "How TradeFeed Works — 3 Steps to Sell Online in South Africa",
      },
    ],
    locale: "en_ZA",
  },
  twitter: {
    card: "summary_large_image",
    title: "How It Works — Sell on WhatsApp in 3 Easy Steps | TradeFeed",
    description:
      "Snap a photo, AI creates the listing, share your link, get orders on WhatsApp. Free to start.",
  },
};

const BENEFITS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: "Set Up in Under 5 Minutes",
    description:
      "Sign up, enter your shop name and WhatsApp number, upload your first product — done. No forms to fill, no approval process.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
      </svg>
    ),
    title: "AI Does the Hard Part",
    description:
      "Upload a photo and AI writes the product title, description, category, and SEO tags. You get 10 free AI generations every month.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
    title: "Works on Any Phone",
    description:
      "Your customers don't download anything. They tap your link, browse your catalog, and order — even on 3G. Mobile-first, data-light.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
    title: "No Commission on Sales",
    description:
      "TradeFeed doesn't take a cut of your sales. You and your customer agree on payment — EFT, cash, e-wallet — whatever works for you.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: "Track Cart Orders",
    description:
      "Orders placed through the cart get a tracking number. Direct WhatsApp enquiries are not tracked orders. Update status from your dashboard — Pending → Confirmed → Shipped → Delivered — and keep buyers informed.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    title: "Get Found on the Marketplace",
    description:
      "Your products appear on the TradeFeed marketplace — buyers across all 9 SA provinces discover your shop. Free exposure, no extra effort.",
  },
];

export default async function HowItWorksPage() {
  const tLanding = await getTranslations("landing");

  const steps = [
    { title: tLanding("howItWorks.step1Title"), description: tLanding("howItWorks.step1Desc") },
    { title: tLanding("howItWorks.step2Title"), description: tLanding("howItWorks.step2Desc") },
    { title: tLanding("howItWorks.step3Title"), description: tLanding("howItWorks.step3Desc") },
  ];

  return (
    // Same header, footer and breadcrumb schema as /pricing and the money pages.
    <SeoPageShell breadcrumb={{ name: "How it works", path: "/how-it-works" }}>
      <TfHeroFont />

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-tf-primary">
        {tLanding("howItWorks.badge")}
      </p>
      <h1
        className="mt-2 font-tf-hero font-semibold text-tf-ink"
        style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", lineHeight: "1.05", letterSpacing: "-0.035em" }}
      >
        {tLanding("howItWorks.title")}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-tf-stone-600">
        {tLanding("howItWorks.subtitle")}
      </p>

      <ol className="mt-10 grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-xl border border-tf-stone-200 bg-tf-raised p-5 shadow-tf-sm"
          >
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-full bg-tf-primary text-sm font-semibold text-white"
            >
              {index + 1}
            </span>
            <h2 className="mt-4 font-tf-display text-lg font-semibold text-tf-ink">
              {step.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-tf-stone-600">{step.description}</p>
          </li>
        ))}
      </ol>

      <section className="mt-14" aria-labelledby="why-tradefeed">
        <h2
          id="why-tradefeed"
          className="font-tf-display text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Why sellers choose TradeFeed
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-tf-stone-600">
          Built for the way South African sellers actually do business.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit.title}
              className="rounded-xl border border-tf-stone-200 bg-tf-raised p-5 shadow-tf-sm"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-tf-verified-soft text-tf-verified">
                {benefit.icon}
              </span>
              <h3 className="mt-4 font-tf-display text-base font-semibold text-tf-ink">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-tf-stone-600">
                {benefit.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-12 text-[15px] leading-relaxed text-tf-stone-600">
        More detail is in the{" "}
        <Link href="/faq" className="text-tf-primary underline underline-offset-2">
          FAQ
        </Link>
        , and plans are on the{" "}
        <Link href="/pricing" className="text-tf-primary underline underline-offset-2">
          pricing page
        </Link>
        . Or look around the{" "}
        <Link href="/marketplace" className="text-tf-primary underline underline-offset-2">
          marketplace
        </Link>{" "}
        first.
      </p>

      <SeoCta />
    </SeoPageShell>
  );
}
