import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { FadeIn } from "@/components/landing/fade-in";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "How It Works — Sell on WhatsApp in 3 Easy Steps | TradeFeed",
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
    title: "Track Every Order",
    description:
      "Every order gets a tracking number. Update status from your dashboard — Pending → Confirmed → Shipped → Delivered — and keep buyers informed.",
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

  return (
    <div className="min-h-screen bg-white text-slate-900">
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
                name: "How It Works",
                item: "https://tradefeed.co.za/how-it-works",
              },
            ],
          }),
        }}
      />

      {/* Hero header — light section with enough top padding for the fixed navbar */}
      <div className="pt-32 pb-16 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full mb-6">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              {tLanding("howItWorks.badge")}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              {tLanding("howItWorks.title")}
            </h1>
            <p className="mt-4 text-slate-500 text-lg leading-relaxed max-w-xl mx-auto">
              {tLanding("howItWorks.subtitle")}
            </p>
          </FadeIn>
        </div>
      </div>

      {/* 3-step section — reuses the landing page component (dark bg, connecting line, icons) */}
      <HowItWorksSection
        badge={tLanding("howItWorks.badge")}
        title={tLanding("howItWorks.title")}
        subtitle={tLanding("howItWorks.subtitle")}
        steps={[
          {
            title: tLanding("howItWorks.step1Title"),
            description: tLanding("howItWorks.step1Desc"),
          },
          {
            title: tLanding("howItWorks.step2Title"),
            description: tLanding("howItWorks.step2Desc"),
          },
          {
            title: tLanding("howItWorks.step3Title"),
            description: tLanding("howItWorks.step3Desc"),
          },
        ]}
      />

      {/* Why TradeFeed — benefit cards */}
      <section className="py-24 px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Why Sellers Choose TradeFeed
              </h2>
              <p className="mt-3 text-slate-500 text-lg max-w-xl mx-auto">
                Built for the way South African sellers actually do business.
              </p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit, i) => (
              <FadeIn key={benefit.title} delay={i * 0.08}>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all h-full flex flex-col">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-4 flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">{benefit.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-6 lg:px-8">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center">
            <div className="p-8 sm:p-12 rounded-2xl bg-slate-50 border border-slate-200">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
                Ready to start selling?
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
                Create your free catalog in under 5 minutes. No credit card, no commitment — your first 10 AI listings are on us.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Start Selling Free →
                </Link>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all"
                >
                  Browse the Marketplace
                </Link>
              </div>
              <p className="mt-5 text-xs text-slate-400">
                10 free AI listings · No credit card · Set up in under 5 minutes · Cancel anytime
              </p>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
