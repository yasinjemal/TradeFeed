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
  Zap,
  BarChart3,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";

import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { TfButton } from "@/components/tf/button";
import { TfFonts } from "@/components/tf/tf-fonts";
import { TfVerifiedSellerCard } from "@/components/tf/verified-seller-card";
import { TfReveal } from "@/components/tf/motion/tf-reveal";
import { TfCountUp } from "@/components/tf/motion/tf-count-up";
import { TfTilt } from "@/components/tf/motion/tf-tilt";
import { TfLiveTicker } from "@/components/tf/motion/tf-live-ticker";
import { TfMarquee } from "@/components/tf/motion/tf-marquee";
import { TfPhoneMock } from "./phone-mock";
import { TfLandingHeader } from "./tf-header";
import { TfLandingStickyCta } from "./sticky-cta";
import { SA_PROVINCES } from "@/lib/marketplace/locations";

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

const PLANS = [
  {
    name: "Free",
    price: 0,
    blurb: "Everything you need to start selling today.",
    features: [
      "20 products free — forever",
      "10 AI listings a month",
      "Your own catalogue link",
      "WhatsApp order messages",
    ],
    popular: false,
  },
  {
    name: "Starter",
    price: 99,
    blurb: "For shops outgrowing 20 products.",
    features: [
      "Unlimited products",
      "25 AI listings a month",
      "Revenue dashboard",
      "Everything in Free",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: 299,
    blurb: "For sellers doing daily volume.",
    features: [
      "Unlimited AI listings",
      "Team accounts",
      "Priority support",
      "Everything in Starter",
    ],
    popular: true,
  },
  {
    name: "Pro AI",
    price: 499,
    blurb: "Full AI automation for serious shops.",
    features: [
      "Catalogue import",
      "Background removal",
      "Listing translations",
      "Everything in Pro",
    ],
    popular: false,
  },
] as const;

const WHATSAPP_GREEN = "#25D366";

export function TfLanding({ ctaHref, ctaLabel, stats, sellers }: TfLandingProps) {
  const reassurance = `20 products free · 10 AI listings a month · no credit card · set up in under 3 minutes`;

  return (
    <main className="bg-tf-surface text-tf-ink overflow-x-hidden">
      <TfFonts />

      {/* ── Sticky header ──────────────────────────────── */}
      <TfLandingHeader>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="TradeFeed home" className="shrink-0">
            <TradeFeedLogo size="sm" />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-6 text-sm text-tf-stone-600 md:flex">
            <Link href="#how-it-works" className="tf-navlink hover:text-tf-ink">How it works</Link>
            <Link href="#pricing" className="tf-navlink hover:text-tf-ink">Pricing</Link>
            <Link href="/marketplace" className="tf-navlink hover:text-tf-ink">Marketplace</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="hidden px-3 py-2 text-sm text-tf-stone-600 hover:text-tf-ink sm:block transition-colors"
            >
              Sign in
            </Link>
            <TfButton asChild size="sm">
              <Link href={ctaHref}>{ctaLabel}</Link>
            </TfButton>
          </div>
        </div>
      </TfLandingHeader>

      {/* ══════════════════════════════════════════════════
          HERO — Cinematic dark opener
      ══════════════════════════════════════════════════ */}
      <section
        id="tf-hero"
        className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden"
        style={{ backgroundColor: "#071a0f" }}
      >
        {/* Layered ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 65% 75% at 78% 45%, rgba(4,120,87,0.22) 0%, transparent 60%)," +
              "radial-gradient(ellipse 40% 50% at 18% 80%, rgba(37,211,102,0.07) 0%, transparent 55%)",
          }}
        />
        {/* SVG grain texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 pt-24 sm:px-6 sm:pb-28 sm:pt-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

            {/* ── Left: Headline + CTAs ─── */}
            <TfReveal stagger>
              {/* Live badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-400">
                <span
                  className="tf-presence inline-block size-2 rounded-full bg-emerald-400"
                  aria-hidden="true"
                />
                {n(stats.shopCount)} sellers live &middot; {stats.cityCount} SA {stats.cityCount === 1 ? "city" : "cities"}
              </div>

              {/* Kinetic headline */}
              <h1 className="mt-6 font-tf-display text-5xl font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[4.25rem]">
                One photo.
                <br />
                One link.
                <br />
                <span className="text-white">Orders on </span>
                <span style={{ color: "#4ade80" }}>WhatsApp</span>
                <span className="text-white">.</span>
              </h1>

              <p className="mt-5 max-w-[26rem] text-base leading-relaxed text-white/55 sm:text-[1.05rem]">
                Take a photo — AI writes the listing in 10&nbsp;seconds. Share your
                catalogue link and take orders where your customers already are.
                No app for them, no website for you.
              </p>

              {/* CTAs */}
              <div id="tf-hero-cta" className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={ctaHref}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                  style={{
                    backgroundColor: "#047857",
                    boxShadow: "0 8px 24px rgba(4,120,87,0.35)",
                  }}
                >
                  {ctaLabel}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-sm font-medium text-white/65 transition-all duration-200 hover:border-white/30 hover:text-white"
                >
                  Browse the marketplace
                </Link>
              </div>

              <p className="mt-4 text-xs text-white/30">{reassurance}</p>

              {/* Live activity ticker */}
              {sellers.filter((s) => s.city).length > 0 && (
                <TfLiveTicker
                  className="mt-6"
                  items={sellers
                    .filter((s) => s.city)
                    .slice(0, 6)
                    .map((s) => `${s.name} is live in ${s.city} right now`)}
                />
              )}
            </TfReveal>

            {/* ── Right: Phone mockup ─── */}
            <TfReveal delay={200}>
              <div className="tf-float flex items-center justify-center">
                <TfTilt>
                  <div className="relative">
                    {/* Halo glow behind phone */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-[-30%] rounded-full blur-3xl"
                      style={{ background: "radial-gradient(circle, rgba(4,120,87,0.18) 0%, transparent 70%)" }}
                    />
                    <div className="relative">
                      <TfPhoneMock />
                    </div>
                  </div>
                </TfTilt>
              </div>
            </TfReveal>
          </div>
        </div>

        {/* Edge fade to next section */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-20"
          style={{ background: "linear-gradient(to bottom, transparent, #faf8f4)" }}
        />
      </section>

      {/* ══════════════════════════════════════════════════
          SELLER MARQUEE — continuous social proof
      ══════════════════════════════════════════════════ */}
      {sellers.length > 0 && (
        <section className="overflow-hidden border-y border-tf-stone-200 bg-tf-raised py-4">
          <TfMarquee
            items={sellers.map((s) => ({
              name: s.name,
              city: s.city,
              isVerified: s.isVerified,
            }))}
          />
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          STATS — real, earned numbers
      ══════════════════════════════════════════════════ */}
      <section aria-label="Platform statistics" className="bg-tf-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <TfReveal>
            <p className="mb-10 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-tf-stone-400">
              Real numbers · updated every 5 minutes
            </p>
          </TfReveal>
          <TfReveal
            as="div"
            stagger
            className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4"
          >
            {[
              { value: stats.shopCount, label: "live sellers" },
              { value: stats.productCount, label: "products listed" },
              { value: stats.orderCount, label: "orders placed" },
              { value: stats.cityCount, label: "SA cities" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="font-tf-display text-4xl font-semibold tabular-nums text-tf-ink sm:text-5xl">
                  <TfCountUp value={value} />
                </p>
                <p className="mt-2 text-sm text-tf-stone-500">{label}</p>
              </div>
            ))}
          </TfReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS — three honest steps (dark)
      ══════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="scroll-mt-16"
        style={{ backgroundColor: "#064e3b" }}
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <TfReveal>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400/60">
              How it works
            </p>
            <h2 className="mt-2 font-tf-display text-3xl font-semibold text-white sm:text-4xl">
              Three honest steps
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/50">
              No warehouse, no website builder, no monthly admin. If you can
              send a WhatsApp message, you can run a shop.
            </p>
          </TfReveal>

          <TfReveal
            as="ul"
            stagger
            className="mt-12 grid gap-4 sm:grid-cols-3"
          >
            {[
              {
                number: "01",
                icon: Camera,
                title: "Snap a photo",
                body: "Upload one product photo. AI writes the title, description and tags in about 10 seconds — you check it and publish.",
              },
              {
                number: "02",
                icon: Share2,
                title: "Share one link",
                body: "Your whole catalogue lives at one address. Post it in WhatsApp groups, your status, anywhere your customers are.",
              },
              {
                number: "03",
                icon: MessageCircle,
                title: "Take orders on WhatsApp",
                body: "Buyers send a ready-made order message. You confirm payment and delivery — no app for them to download.",
              },
            ].map((step) => (
              <li
                key={step.title}
                className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300"
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                {/* Large step number watermark */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-2 -top-4 select-none font-tf-display text-8xl font-semibold leading-none transition-colors duration-300 group-hover:text-emerald-500/12"
                  style={{ color: "rgba(255,255,255,0.05)" }}
                >
                  {step.number}
                </span>

                <span className="relative flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <step.icon aria-hidden="true" className="size-4.5" />
                </span>
                <h3 className="relative mt-4 font-tf-display text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-white/50">
                  {step.body}
                </p>
              </li>
            ))}
          </TfReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURE BENTO GRID — Apple-style mixed layout
      ══════════════════════════════════════════════════ */}
      <section className="bg-tf-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <TfReveal>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-tf-stone-400">
              Built for South African sellers
            </p>
            <h2 className="mt-2 font-tf-display text-3xl font-semibold text-tf-ink sm:text-4xl">
              Everything you need, nothing you don&apos;t
            </h2>
          </TfReveal>

          {/* Row 1: AI (2 cols) + WhatsApp (1 col) */}
          <TfReveal stagger className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* AI — large card */}
            <div className="group col-span-1 rounded-2xl border border-tf-stone-200 bg-tf-raised p-7 shadow-tf-sm transition-all duration-300 hover:shadow-tf-md sm:col-span-2">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-tf-primary">
                  <Zap className="size-5" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-tf-primary">
                  AI-powered
                </span>
              </div>
              <h3 className="font-tf-display text-xl font-semibold text-tf-ink">
                Listing written in 10 seconds
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-tf-stone-500">
                Upload a photo — AI generates the title, description, category,
                and SEO tags automatically. Review, adjust the price, and
                publish. No writing required.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Title", "Description", "Category", "SEO tags"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-tf-primary"
                  >
                    ✓ {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* WhatsApp */}
            <div className="rounded-2xl border border-tf-stone-200 bg-tf-raised p-7 shadow-tf-sm transition-all duration-300 hover:shadow-tf-md">
              <span
                className="mb-5 flex size-10 items-center justify-center rounded-xl"
                style={{ background: `${WHATSAPP_GREEN}18` }}
              >
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill={WHATSAPP_GREEN}
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path
                    d="M12 0C5.373 0 0 5.373 0 12c0 2.134.558 4.137 1.535 5.874L0 24l6.332-1.614A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"
                    opacity={0.25}
                  />
                </svg>
              </span>
              <h3 className="font-tf-display text-base font-semibold text-tf-ink">
                WhatsApp checkout
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-tf-stone-500">
                Buyers tap one button and send a structured order message. No
                payment gateway needed — no app to download.
              </p>
            </div>
          </TfReveal>

          {/* Row 2: Analytics + Trust + Speed (dark) */}
          <TfReveal stagger className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Analytics */}
            <div className="rounded-2xl border border-tf-stone-200 bg-tf-raised p-7 shadow-tf-sm transition-all duration-300 hover:shadow-tf-md">
              <span className="mb-5 flex size-10 items-center justify-center rounded-xl bg-tf-stone-100">
                <BarChart3 className="size-5 text-tf-stone-600" aria-hidden="true" />
              </span>
              <h3 className="font-tf-display text-base font-semibold text-tf-ink">
                See what sells
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-tf-stone-500">
                Know which products get the most views. Drop slow sellers, double
                down on winners — no guesswork.
              </p>
            </div>

            {/* Trust */}
            <div className="rounded-2xl border border-tf-stone-200 bg-tf-raised p-7 shadow-tf-sm transition-all duration-300 hover:shadow-tf-md">
              <span className="mb-5 flex size-10 items-center justify-center rounded-xl bg-emerald-50">
                <Shield className="size-5 text-tf-primary" aria-hidden="true" />
              </span>
              <h3 className="font-tf-display text-base font-semibold text-tf-ink">
                Verified seller badge
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-tf-stone-500">
                Your verification, order count, and reply time are shown on every
                product and checkout. Buyers know who they&apos;re buying from.
              </p>
            </div>

            {/* Speed — dark accent card */}
            <div
              className="rounded-2xl p-7 shadow-tf-sm transition-all duration-300 hover:shadow-tf-md"
              style={{
                background: "#064e3b",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span className="mb-5 flex size-10 items-center justify-center rounded-xl bg-white/10">
                <Clock className="size-5 text-emerald-300" aria-hidden="true" />
              </span>
              <h3 className="font-tf-display text-base font-semibold text-white">
                Live in under 3 minutes
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Name, WhatsApp number, first product photo. Your shop is live
                and sharing on your very first day.
              </p>
              <Link
                href={ctaHref}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
              >
                Start now — it&apos;s free
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </TfReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TRUST — Verified Seller card (dark)
      ══════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: "#071a0f" }}>
        {/* Top grain */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 h-px opacity-20"
          style={{ background: "linear-gradient(to right, transparent, #4ade80, transparent)" }}
        />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
          <TfReveal>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400/60">
              Built-in trust
            </p>
            <h2 className="mt-2 font-tf-display text-3xl font-semibold text-white sm:text-4xl">
              Buyers see who they&apos;re buying from
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/50">
              Every storefront, product page, and checkout carries your Verified
              Seller card — your verification, orders fulfilled, reply time, and
              location. Small shop, real-store trust.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Verification backed by real seller checks",
                "Order count and reply time from actual activity",
                "Your WhatsApp number stays private until a buyer orders",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-white/60">
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-emerald-400"
                  />
                  {t}
                </li>
              ))}
            </ul>
          </TfReveal>
          <TfReveal delay={120}>
            <TfTilt>
              <TfVerifiedSellerCard
                variant="hero"
                name="Thandi's Sneakers"
                verified
                ordersFulfilled={127}
                avgReplyMinutes={8}
                memberSince={2024}
                location="Soweto, Johannesburg"
              />
            </TfTilt>
          </TfReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          REAL SELLERS — Live right now
      ══════════════════════════════════════════════════ */}
      {sellers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <TfReveal>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="tf-presence inline-block size-2 rounded-full bg-tf-primary"
                aria-hidden="true"
              />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-tf-stone-400">
                Live right now
              </p>
            </div>
            <h2 className="font-tf-display text-3xl font-semibold text-tf-ink sm:text-4xl">
              Real shops, trading today
            </h2>
            <p className="mt-2 text-sm text-tf-stone-500">
              No stock photos — these are {sellers.length} of the{" "}
              {n(stats.shopCount)} sellers on TradeFeed right now.
            </p>
          </TfReveal>

          <TfReveal
            as="ul"
            stagger
            className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          >
            {sellers.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/catalog/${s.slug}`}
                  className="tf-card-tactile flex h-full flex-col items-center gap-2 rounded-xl border border-tf-stone-200 bg-tf-raised p-4 text-center shadow-tf-sm outline-none transition-all hover:border-tf-primary/30 hover:shadow-tf-md focus-visible:ring-2 focus-visible:ring-tf-primary"
                >
                  <span className="relative flex size-12 items-center justify-center overflow-hidden rounded-full bg-tf-deep text-sm font-medium text-tf-surface">
                    {s.logoUrl ? (
                      <Image
                        src={s.logoUrl}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      initials(s.name)
                    )}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium text-tf-ink">
                    <span className="line-clamp-1">{s.name}</span>
                    {s.isVerified && (
                      <BadgeCheck
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-tf-verified"
                      />
                    )}
                  </span>
                  <span className="text-xs tabular-nums text-tf-stone-500">
                    {s.city ? `${s.city} · ` : ""}
                    {s.productCount} products
                  </span>
                </Link>
              </li>
            ))}
          </TfReveal>

          <div className="mt-8 text-center">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-xl border border-tf-stone-200 bg-tf-raised px-6 py-3 text-sm font-semibold text-tf-ink shadow-tf-sm transition-all hover:border-tf-primary/30 hover:shadow-tf-md"
            >
              Join these sellers — it&apos;s free
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          PRICING — Honest, in Rand
      ══════════════════════════════════════════════════ */}
      <section
        id="pricing"
        className="scroll-mt-16 border-t border-tf-stone-200 bg-tf-raised"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <TfReveal>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-tf-stone-400">
              No surprises
            </p>
            <h2 className="mt-2 font-tf-display text-3xl font-semibold text-tf-ink sm:text-4xl">
              Honest pricing, in Rand
            </h2>
            <p className="mt-2 text-sm text-tf-stone-500">
              Start free with 20 products and 10 AI listings a month. Upgrade
              when the orders say so. Cancel anytime.
            </p>
          </TfReveal>

          <TfReveal stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.popular
                    ? "relative rounded-2xl border-2 border-tf-primary bg-tf-surface p-6 shadow-tf-md"
                    : "rounded-2xl border border-tf-stone-200 bg-tf-surface p-6 shadow-tf-sm transition-all hover:shadow-tf-md"
                }
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-5 rounded-full bg-tf-primary px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                    Most popular
                  </span>
                )}
                <h3 className="font-tf-display text-base font-semibold text-tf-ink">
                  {plan.name}
                </h3>
                <p className="mt-1 tabular-nums">
                  <span className="font-tf-display text-3xl font-semibold text-tf-ink">
                    R{plan.price}
                  </span>
                  <span className="text-sm text-tf-stone-500">/month</span>
                </p>
                <p className="mt-1 text-xs text-tf-stone-500">{plan.blurb}</p>
                <ul className="mt-4 space-y-2.5 text-sm text-tf-stone-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-tf-primary"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={ctaHref}
                  className={
                    plan.popular
                      ? "mt-6 block w-full rounded-xl bg-tf-primary px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-tf-primary-hover"
                      : "mt-6 block w-full rounded-xl border border-tf-stone-300 bg-tf-raised px-4 py-3 text-center text-sm font-semibold text-tf-ink transition-colors hover:border-tf-stone-400"
                  }
                >
                  {plan.price === 0 ? "Start free" : `Choose ${plan.name}`}
                </Link>
              </div>
            ))}
          </TfReveal>
          <p className="mt-6 text-center text-xs text-tf-stone-400">
            Payments processed securely by PayFast 🇿🇦 &middot; Cancel anytime
            &middot; VAT inclusive
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FINAL CTA — Full-height dark closer
      ══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: "#071a0f" }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(4,120,87,0.18) 0%, transparent 65%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          }}
        />
        <TfReveal className="relative z-10 mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-32">
          <Store
            aria-hidden="true"
            className="mx-auto mb-5 size-10 text-emerald-400"
          />
          <h2 className="font-tf-display text-3xl font-semibold text-white sm:text-5xl">
            Your shop could be live
            <br className="hidden sm:block" /> in under 3 minutes
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/45">
            Join {n(stats.shopCount)} South African sellers already taking
            orders on WhatsApp.
          </p>
          <Link
            href={ctaHref}
            className="mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              backgroundColor: "#047857",
              boxShadow: "0 8px 32px rgba(4,120,87,0.40)",
            }}
          >
            {ctaLabel}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <p className="mt-4 text-xs text-white/25">{reassurance}</p>
        </TfReveal>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════ */}
      <footer className="border-t border-tf-stone-200 bg-tf-surface">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="mb-10 grid gap-8 sm:grid-cols-4">
            <div className="sm:col-span-1">
              <TradeFeedLogo size="sm" />
              <p className="mt-3 text-xs leading-relaxed text-tf-stone-500">
                South Africa&apos;s WhatsApp-first marketplace. Create your
                online shop, list products, and sell via WhatsApp. 🇿🇦
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-tf-stone-400">
                Product
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "How it works", href: "#how-it-works" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Marketplace", href: "/marketplace" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-tf-stone-500 transition-colors hover:text-tf-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-tf-stone-400">
                For Sellers
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Sell online in SA", href: "/sell-online-south-africa" },
                  { label: "Sell on WhatsApp", href: "/sell-on-whatsapp" },
                  { label: "WhatsApp catalogue", href: "/whatsapp-catalog" },
                  { label: "Create a shop", href: "/create-online-shop" },
                  { label: "Import catalogue", href: "/import-whatsapp-catalogue" },
                  { label: "Pricing", href: "/pricing" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-tf-stone-500 transition-colors hover:text-tf-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-tf-stone-400">
                Legal
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Privacy (POPIA)", href: "/privacy" },
                  { label: "Terms", href: "/terms" },
                  { label: "Contact", href: "/contact" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-tf-stone-500 transition-colors hover:text-tf-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Province SEO links */}
          <div className="mb-6 border-t border-tf-stone-200 pt-6">
            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-tf-stone-400">
              Browse by Province
            </h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {SA_PROVINCES.map((p) => (
                <Link
                  key={p.slug}
                  href={`/marketplace/${p.slug}`}
                  className="text-xs text-tf-stone-400 transition-colors hover:text-tf-primary"
                >
                  {p.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-tf-stone-200 pt-6 sm:flex-row">
            <p className="text-xs text-tf-stone-400">
              © {new Date().getFullYear()} TradeFeed — South Africa&apos;s
              WhatsApp-first marketplace.
            </p>
            <div className="flex items-center gap-5 text-xs text-tf-stone-400">
              <span>POPIA Compliant</span>
              <span>SSL Encrypted</span>
            </div>
          </div>
        </div>
      </footer>

      <TfLandingStickyCta
        href={ctaHref}
        label={ctaLabel}
        sentinelId="tf-hero-cta"
      />
    </main>
  );
}
