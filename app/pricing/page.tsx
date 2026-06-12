import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { SeoPageShell, SeoCta } from "@/components/seo/seo-page";
import { SeoFaq } from "@/components/seo/faq";
import { TfButton } from "@/components/tf/button";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tradefeed.co.za";

export const metadata: Metadata = {
  title: "TradeFeed Pricing — Free to Start, Plans from R99/month",
  description:
    "Honest pricing in rand: Free (20 products, 10 AI listings/month), Starter R99, Pro R299, Pro AI R499. No hidden fees, no card to start, cancel anytime.",
  alternates: { canonical: `${APP_URL}/pricing` },
  openGraph: {
    title: "TradeFeed Pricing — Free to Start, Plans from R99/month",
    description: "Free for 20 products. Paid plans from R99/month. Prices in rand, cancel anytime.",
    url: `${APP_URL}/pricing`,
    siteName: "TradeFeed",
    type: "website",
  },
};

const PLANS = [
  { name: "Free", price: 0, blurb: "Everything you need to start selling today.", features: ["20 products free — forever", "10 AI listings a month", "Your own catalogue link", "WhatsApp order messages", "Order tracking numbers"], popular: false },
  { name: "Starter", price: 99, blurb: "For shops outgrowing 20 products.", features: ["Unlimited products", "25 AI listings a month", "Everything in Free"], popular: false },
  { name: "Pro", price: 299, blurb: "For sellers doing daily volume.", features: ["Unlimited AI listings", "Team accounts", "Priority support", "Everything in Starter"], popular: true },
  { name: "Pro AI", price: 499, blurb: "Full AI automation for serious shops.", features: ["Catalogue import", "Background removal", "Listing translations", "Everything in Pro"], popular: false },
] as const;

const FAQ = [
  { q: "Is the free plan really free forever?", a: "Yes. 20 products, 10 AI listings a month, your shop link, and WhatsApp ordering — free with no time limit and no card required." },
  { q: "Are there transaction fees?", a: "No. TradeFeed doesn't take a cut of your sales. Buyers pay you directly — EFT, PayFast, or cash on delivery." },
  { q: "How do I pay for a plan?", a: "Subscriptions are billed in rand through PayFast — card, EFT, or any PayFast-supported method." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from your dashboard whenever you like; your shop drops back to the free plan instead of disappearing." },
  { q: "Which plan includes a custom domain?", a: "Custom .co.za domains are available on higher plans — check the plan details in your dashboard billing page for current availability." },
];

export default function PricingPage() {
  return (
    <SeoPageShell breadcrumb={{ name: "Pricing", path: "/pricing" }}>
      <h1
        className="font-tf-hero font-semibold text-tf-ink"
        style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", lineHeight: "1.05", letterSpacing: "-0.035em" }}
      >
        Honest pricing, in rand
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-tf-stone-600">
        Start free with 20 products and 10 AI listings a month. Upgrade when the orders say so.
        No transaction fees, no hidden costs, cancel anytime.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={
              plan.popular
                ? "relative rounded-xl border-2 border-tf-primary bg-tf-raised p-5 shadow-tf-md"
                : "rounded-xl border border-tf-stone-200 bg-tf-raised p-5 shadow-tf-sm"
            }
          >
            {plan.popular && (
              <span className="absolute -top-3 left-5 rounded-full bg-tf-primary px-2.5 py-0.5 text-[11px] font-medium text-white">
                Most popular
              </span>
            )}
            <h2 className="font-tf-display text-lg font-semibold">{plan.name}</h2>
            <p className="mt-1 tabular-nums">
              <span className="font-tf-display text-4xl font-semibold">R{plan.price}</span>
              <span className="text-sm text-tf-stone-500">/month</span>
            </p>
            <p className="mt-1 text-xs text-tf-stone-500">{plan.blurb}</p>
            <ul className="mt-4 space-y-2 text-sm text-tf-stone-600">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tf-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <TfButton asChild fullWidth variant={plan.popular ? "primary" : "secondary"} className="mt-5">
              <Link href="/sign-up">{plan.price === 0 ? "Start free" : `Choose ${plan.name}`}</Link>
            </TfButton>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-tf-stone-500">
        Not sure where to start? Begin free —{" "}
        <Link href="/create-online-shop" className="text-tf-primary underline underline-offset-2">
          your shop can be live in under 3 minutes
        </Link>
        . Billing is handled securely through PayFast.
      </p>

      <SeoCta />
      <SeoFaq items={FAQ} />
    </SeoPageShell>
  );
}
