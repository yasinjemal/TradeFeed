import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Camera,
  Check,
  MessageCircle,
  Share2,
  Store,
} from "lucide-react";

import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { TfButton } from "@/components/tf/button";
import { TfFonts } from "@/components/tf/tf-fonts";
import { TfVerifiedSellerCard } from "@/components/tf/verified-seller-card";
import { TfReveal } from "@/components/tf/motion/tf-reveal";
import { TfCountUp } from "@/components/tf/motion/tf-count-up";
import { TfPhoneMock } from "./phone-mock";
import { TfLandingStickyCta } from "./sticky-cta";

// ============================================================
// TfLanding — trust-first landing page (FEATURE_FLAGS.UI_REDESIGN).
//
// One set of true numbers, used everywhere on this page:
//   · seller count = live DB count (no inflated floors)
//   · Free plan    = 20 products free + 10 AI listings a month
//   · setup time   = under 3 minutes
// ============================================================

export interface TfLandingProps {
  ctaHref: string;
  ctaLabel: string;
  stats: {
    shopCount: number;
    productCount: number;
    orderCount: number;
    cityCount: number;
    topCities: string;
  };
  sellers: {
    name: string;
    slug: string;
    logoUrl: string | null;
    city: string | null;
    isVerified: boolean;
    productCount: number;
  }[];
}

const n = (v: number) => v.toLocaleString("en-ZA");

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

const STEPS = [
  {
    icon: Camera,
    title: "Snap a photo",
    body: "Upload one product photo. AI writes the title, description and tags in about 10 seconds — you check it and publish.",
  },
  {
    icon: Share2,
    title: "Share one link",
    body: "Your whole catalogue lives at one address. Post it in WhatsApp groups, your status, anywhere your customers are.",
  },
  {
    icon: MessageCircle,
    title: "Take orders on WhatsApp",
    body: "Buyers send a ready-made order message. You confirm payment and delivery — no app for them to download.",
  },
] as const;

const PLANS = [
  {
    name: "Free",
    price: 0,
    blurb: "Everything you need to start selling today.",
    features: ["20 products free — forever", "10 AI listings a month", "Your own catalogue link", "WhatsApp order messages"],
    popular: false,
  },
  {
    name: "Starter",
    price: 99,
    blurb: "For shops outgrowing 20 products.",
    features: ["Unlimited products", "25 AI listings a month", "Everything in Free"],
    popular: false,
  },
  {
    name: "Pro",
    price: 299,
    blurb: "For sellers doing daily volume.",
    features: ["Unlimited AI listings", "Team accounts", "Priority support", "Everything in Starter"],
    popular: true,
  },
  {
    name: "Pro AI",
    price: 499,
    blurb: "Full AI automation for serious shops.",
    features: ["Catalogue import", "Background removal", "Listing translations", "Everything in Pro"],
    popular: false,
  },
] as const;

export function TfLanding({ ctaHref, ctaLabel, stats, sellers }: TfLandingProps) {
  const reassurance = `20 products free · 10 AI listings a month · no credit card · set up in under 3 minutes`;

  return (
    <main className="bg-tf-surface text-tf-ink">
      <TfFonts />

      {/* ── Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-tf-stone-200 bg-tf-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="TradeFeed home" className="shrink-0">
            <TradeFeedLogo size="sm" />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-6 text-sm text-tf-stone-600 md:flex">
            <Link href="#how-it-works" className="hover:text-tf-ink">How it works</Link>
            <Link href="#pricing" className="hover:text-tf-ink">Pricing</Link>
            <Link href="/marketplace" className="hover:text-tf-ink">Marketplace</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="hidden px-3 py-2 text-sm text-tf-stone-600 hover:text-tf-ink sm:block">
              Sign in
            </Link>
            <TfButton asChild size="sm">
              <Link href={ctaHref}>{ctaLabel}</Link>
            </TfButton>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <TfReveal stagger>
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-tf-verified-soft px-3 py-1 text-xs font-medium text-tf-deep">
              <BadgeCheck aria-hidden="true" className="size-3.5 text-tf-verified" />
              {n(stats.shopCount)} sellers live across {stats.cityCount} SA {stats.cityCount === 1 ? "city" : "cities"}
            </p>
            <h1 className="font-tf-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              One photo.
              <br />
              One link.
              <br />
              Orders on <span className="text-tf-primary">WhatsApp</span>.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-tf-stone-600 sm:text-lg">
              Take a photo — AI writes the listing. Share your catalogue link and take
              orders where your customers already are. No app for them, no website for you.
            </p>
            <div id="tf-hero-cta" className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <TfButton asChild size="lg">
                <Link href={ctaHref}>{ctaLabel}</Link>
              </TfButton>
              <TfButton asChild variant="ghost">
                <Link href="/marketplace">Browse the marketplace</Link>
              </TfButton>
            </div>
            <p className="mt-4 text-xs text-tf-stone-500">{reassurance}</p>
          </TfReveal>
          <TfReveal delay={160}>
            <TfPhoneMock />
          </TfReveal>
        </div>
      </section>

      {/* ── Live numbers (real, never inflated) ────────── */}
      <section aria-label="Platform statistics" className="border-y border-tf-stone-200 bg-tf-raised">
        <TfReveal as="div" stagger className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 py-6 text-center sm:grid-cols-4 sm:px-6" role="list">
          {[
            [stats.shopCount, "live sellers"],
            [stats.productCount, "products listed"],
            [stats.orderCount, "orders placed"],
            [stats.cityCount, "SA cities"],
          ].map(([value, label]) => (
            <div key={label as string}>
              <p className="order-2 text-xs text-tf-stone-500">{label}</p>
              <p className="font-tf-display text-2xl font-semibold tabular-nums text-tf-ink sm:text-3xl">
                <TfCountUp value={value as number} />
              </p>
            </div>
          ))}
        </TfReveal>
      </section>

      {/* ── How it works ───────────────────────────────── */}
      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-14 sm:px-6 sm:py-20">
        <h2 className="font-tf-display text-2xl font-semibold sm:text-3xl">
          How it works — three honest steps
        </h2>
        <p className="mt-2 max-w-lg text-sm text-tf-stone-600">
          No warehouse, no website builder, no monthly admin. If you can send a WhatsApp
          message, you can run a shop.
        </p>
        <TfReveal as="ul" stagger className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-xl border border-tf-stone-200 bg-tf-raised p-5 shadow-tf-sm">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-tf-verified-soft text-tf-primary">
                  <step.icon aria-hidden="true" className="size-4.5" />
                </span>
                <span className="text-xs font-medium tabular-nums text-tf-stone-500">Step {i + 1}</span>
              </div>
              <h3 className="font-tf-display text-base font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-tf-stone-600">{step.body}</p>
            </li>
          ))}
        </TfReveal>
      </section>

      {/* ── Trust: the Verified Seller card ────────────── */}
      <section className="bg-tf-deep">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2">
          <div>
            <h2 className="font-tf-display text-2xl font-semibold text-tf-surface sm:text-3xl">
              Buyers see who they&apos;re buying from
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-emerald-100/90">
              Every storefront, product page and checkout carries your Verified Seller
              card — your verification, orders fulfilled, reply time and location. Small
              shop, real-store trust. That&apos;s the whole point of TradeFeed.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-emerald-100/90">
              {["Verification backed by real seller checks", "Order count and reply time from actual activity", "Your WhatsApp number stays private until a buyer orders"].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <TfReveal delay={120}>
          <TfVerifiedSellerCard
            variant="hero"
            name="Thandi's Sneakers"
            verified
            ordersFulfilled={127}
            avgReplyMinutes={8}
            memberSince={2024}
            location="Soweto, Johannesburg"
          />
          </TfReveal>
        </div>
      </section>

      {/* ── Real sellers ───────────────────────────────── */}
      {sellers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="font-tf-display text-2xl font-semibold sm:text-3xl">
            Real shops, live right now
          </h2>
          <p className="mt-2 text-sm text-tf-stone-600">
            No stock photos — these are {sellers.length} of the {n(stats.shopCount)} sellers
            trading on TradeFeed today.
          </p>
          <TfReveal as="ul" stagger className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {sellers.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/catalog/${s.slug}`}
                  className="tf-card-tactile flex h-full flex-col items-center gap-2 rounded-xl border border-tf-stone-200 bg-tf-raised p-4 text-center shadow-tf-sm outline-none hover:shadow-tf-md focus-visible:ring-2 focus-visible:ring-tf-primary"
                >
                  <span className="relative flex size-12 items-center justify-center overflow-hidden rounded-full bg-tf-deep text-sm font-medium text-tf-surface">
                    {s.logoUrl ? (
                      <Image src={s.logoUrl} alt="" fill sizes="48px" className="object-cover" />
                    ) : (
                      initials(s.name)
                    )}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium text-tf-ink">
                    <span className="line-clamp-1">{s.name}</span>
                    {s.isVerified && (
                      <BadgeCheck aria-hidden="true" className="size-3.5 shrink-0 text-tf-verified" />
                    )}
                  </span>
                  <span className="text-xs tabular-nums text-tf-stone-500">
                    {s.city ? `${s.city} · ` : ""}{s.productCount} products
                  </span>
                </Link>
              </li>
            ))}
          </TfReveal>
        </section>
      )}

      {/* ── Pricing ────────────────────────────────────── */}
      <section id="pricing" className="border-t border-tf-stone-200 bg-tf-raised">
        <div className="mx-auto max-w-6xl scroll-mt-16 px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="font-tf-display text-2xl font-semibold sm:text-3xl">
            Honest pricing, in Rand
          </h2>
          <p className="mt-2 text-sm text-tf-stone-600">
            Start free with 20 products and 10 AI listings a month. Upgrade when the
            orders say so. Cancel anytime.
          </p>
          <TfReveal stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.popular
                    ? "relative rounded-xl border-2 border-tf-primary bg-tf-surface p-5 shadow-tf-md"
                    : "rounded-xl border border-tf-stone-200 bg-tf-surface p-5 shadow-tf-sm"
                }
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-5 rounded-full bg-tf-primary px-2.5 py-0.5 text-[11px] font-medium text-white">
                    Most popular
                  </span>
                )}
                <h3 className="font-tf-display text-base font-semibold">{plan.name}</h3>
                <p className="mt-1 tabular-nums">
                  <span className="font-tf-display text-3xl font-semibold">R{plan.price}</span>
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
                  <Link href={ctaHref}>{plan.price === 0 ? "Start free" : `Choose ${plan.name}`}</Link>
                </TfButton>
              </div>
            ))}
          </TfReveal>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────── */}
      <section className="bg-tf-deep">
        <TfReveal className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <Store aria-hidden="true" className="mx-auto mb-4 size-8 text-emerald-300" />
          <h2 className="font-tf-display text-3xl font-semibold text-tf-surface sm:text-4xl">
            Your shop could be live in under 3 minutes
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-emerald-100/90">
            Join {n(stats.shopCount)} South African sellers already taking orders on WhatsApp.
          </p>
          <TfButton asChild size="lg" className="mt-7">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </TfButton>
          <p className="mt-4 text-xs text-emerald-100/70">{reassurance}</p>
        </TfReveal>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-tf-stone-200 bg-tf-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-tf-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} TradeFeed — South Africa&apos;s WhatsApp-first marketplace.</p>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/sell-online-south-africa" className="hover:text-tf-ink">Sell online in SA</Link>
            <Link href="/sell-on-whatsapp" className="hover:text-tf-ink">Sell on WhatsApp</Link>
            <Link href="/whatsapp-catalog" className="hover:text-tf-ink">WhatsApp catalogue</Link>
            <Link href="/create-online-shop" className="hover:text-tf-ink">Create a shop</Link>
            <Link href="/import-whatsapp-catalogue" className="hover:text-tf-ink">Import catalogue</Link>
            <Link href="/pricing" className="hover:text-tf-ink">Pricing</Link>
            <Link href="/marketplace" className="hover:text-tf-ink">Marketplace</Link>
            <Link href="/privacy" className="hover:text-tf-ink">Privacy (POPIA)</Link>
            <Link href="/terms" className="hover:text-tf-ink">Terms</Link>
            <Link href="/contact" className="hover:text-tf-ink">Contact</Link>
          </nav>
        </div>
      </footer>

      <TfLandingStickyCta href={ctaHref} label={ctaLabel} sentinelId="tf-hero-cta" />
    </main>
  );
}
