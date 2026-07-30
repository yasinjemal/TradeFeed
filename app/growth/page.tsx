import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  ImageIcon,
  LayoutGrid,
  Megaphone,
  MessageCircle,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  WandSparkles,
  X,
} from "lucide-react";

import { GrowthApplicationForm } from "@/components/growth/growth-application-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { TfBadge } from "@/components/tf/badge";
import { TfButton } from "@/components/tf/button";
import { TfFonts } from "@/components/tf/tf-fonts";
import { TfLandingHeader } from "@/components/tf/landing/tf-header";
import { TfLandingStickyCta } from "@/components/tf/landing/sticky-cta";
import { TfReveal } from "@/components/tf/motion/tf-reveal";
import { TfThemeToggle } from "@/components/tf/theme-toggle";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";

const GROWTH_WHATSAPP_URL = `https://wa.me/27835034502?text=${encodeURIComponent(
  "Hi TradeFeed Growth, I am interested in the done-for-you online shop service.",
)}`;

const packages = [
  {
    name: "Shop Launch",
    eyebrow: "Founding-client offer",
    price: "R5,000",
    cadence: "once-off",
    description:
      "For a seller who has products and wants a professional shop without doing the setup alone.",
    features: [
      "TradeFeed shop setup and branding",
      "Up to 50 product listings",
      "AI-assisted titles and descriptions",
      "Product image cleanup",
      "Categories and WhatsApp ordering",
      "One banner and five social posts",
      "Owner handover and training",
    ],
    note: "50% deposit to begin. Balance is due before launch.",
    featured: true,
  },
  {
    name: "Growth Management",
    eyebrow: "Ongoing support",
    price: "R3,500",
    cadence: "per month",
    description:
      "For a live shop that needs consistent catalogue updates and promotional content.",
    features: [
      "Up to 20 new product uploads",
      "Eight social media posts",
      "Four short promotional videos",
      "One monthly campaign",
      "Catalogue improvements",
      "Performance review and report",
      "WhatsApp support",
    ],
    note: "Month-to-month for accepted founding clients.",
    featured: false,
  },
  {
    name: "Wholesale Digital Setup",
    eyebrow: "Large catalogues",
    price: "From R15,000",
    cadence: "project",
    description:
      "For wholesalers and suppliers with larger ranges, variants, staff and reseller workflows.",
    features: [
      "100–500 product catalogue assessment",
      "Product and variant organisation",
      "Reseller-friendly digital catalogue",
      "Bulk import preparation",
      "WhatsApp ordering workflow",
      "Reseller marketing materials",
      "Staff training and launch support",
    ],
    note: "Final quote depends on catalogue size and complexity.",
    featured: false,
  },
] as const;

const faqItems = [
  {
    question: "Is TradeFeed Growth a separate company?",
    answer:
      "No. It is TradeFeed’s done-for-you service. The TradeFeed platform gives you the software; the Growth service helps set up, organise and promote your shop.",
  },
  {
    question: "Do you guarantee sales?",
    answer:
      "No honest service can guarantee sales. We build a stronger catalogue and marketing system, but results still depend on your products, pricing, stock, customer demand and follow-up.",
  },
  {
    question: "Can you really launch in seven days?",
    answer:
      "Seven working days is our target after we receive complete product photos, prices, variants, business details and feedback. Missing information or a complex catalogue can extend the timeline.",
  },
  {
    question: "What do I need before we start?",
    answer:
      "You need the right to use the product images and information, a working WhatsApp number, prices, available variants and enough time to review the shop before launch.",
  },
  {
    question: "Can I start with normal self-service TradeFeed instead?",
    answer:
      "Yes. Self-service TradeFeed is the lower-cost option when you want to upload and manage everything yourself. Growth is for businesses that want our team to do the setup or ongoing work.",
  },
  {
    question: "What happens after I apply?",
    answer:
      "We review your catalogue size and readiness, reply on WhatsApp, and arrange a short fit check. If the service makes sense, you receive a clear scope and payment details before any work begins.",
  },
] as const;

export const metadata: Metadata = {
  title: "Done-for-You Online Shop Setup | TradeFeed Growth",
  description:
    "Send your product photos and TradeFeed Growth will organise your catalogue, prepare professional listings, launch your online shop and create marketing content.",
  alternates: {
    canonical: "https://tradefeed.co.za/growth",
  },
  openGraph: {
    type: "website",
    url: "https://tradefeed.co.za/growth",
    title: "TradeFeed Growth — We Build and Grow Your Shop",
    description:
      "A done-for-you online shop service for South African WhatsApp sellers and wholesalers.",
    images: [
      {
        url: "/growth-og.png",
        width: 1200,
        height: 630,
        alt: "TradeFeed Growth done-for-you online shop service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeFeed Growth — We Build and Grow Your Shop",
    description:
      "Send your product photos. We organise the catalogue, prepare the listings and launch the shop.",
    images: ["/growth-og.png"],
  },
};

export default function GrowthPage() {
  return (
    <main className="bg-tf-deepest text-tf-ink">
      <TfFonts />

      <TfLandingHeader>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="TradeFeed home" className="shrink-0">
            <span className="tf-over-hero">
              <TradeFeedLogo size="sm" variant="light" />
            </span>
            <span className="tf-over-surface">
              <TradeFeedLogo size="sm" variant="auto" />
            </span>
          </Link>

          <nav
            aria-label="Growth page"
            className="hidden items-center gap-6 text-sm text-tf-stone-600 md:flex"
          >
            <Link href="#what-you-get" className="tf-navlink hover:text-tf-ink">
              What you get
            </Link>
            <Link href="#process" className="tf-navlink hover:text-tf-ink">
              Process
            </Link>
            <Link href="#packages" className="tf-navlink hover:text-tf-ink">
              Packages
            </Link>
            <Link href="/marketplace" className="tf-navlink hover:text-tf-ink">
              Marketplace
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex">
              <LanguageSwitcher />
            </span>
            <span className="hidden sm:inline-flex">
              <TfThemeToggle />
            </span>
            <TfButton asChild size="sm">
              <Link href="#apply">Apply now</Link>
            </TfButton>
          </div>
        </div>
      </TfLandingHeader>

      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 65% 75% at 78% 42%, rgba(4,120,87,0.28) 0%, transparent 62%), radial-gradient(ellipse 42% 55% at 8% 80%, rgba(245,158,11,0.08) 0%, transparent 58%)",
          }}
        />

        <div className="relative mx-auto grid min-h-[calc(100svh-3.5rem)] max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.03fr_0.97fr]">
          <TfReveal stagger>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300">
              <Sparkles className="size-3.5" aria-hidden="true" />
              TradeFeed Growth · done-for-you service
            </div>

            <h1
              className="mt-6 max-w-3xl font-tf-hero font-semibold text-white"
              style={{
                fontSize: "clamp(3.25rem, 8vw, 6.6rem)",
                lineHeight: "0.96",
                letterSpacing: "-0.045em",
              }}
            >
              Send the photos.
              <br />
              <span
                style={{
                  background: "linear-gradient(120deg, #4ade80 0%, #fbbf24 115%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                We build the shop.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/62 sm:text-lg">
              We organise your catalogue, write professional listings, set up
              WhatsApp ordering and create launch content—so your business gets
              a proper online shop without another unfinished project.
            </p>

            <div id="growth-hero-cta" className="mt-8 flex flex-wrap gap-3">
              <TfButton asChild size="lg">
                <Link href="#apply">
                  Apply for TradeFeed Growth
                  <ArrowRight aria-hidden="true" />
                </Link>
              </TfButton>
              <TfButton asChild size="lg" variant="secondary">
                <a href={GROWTH_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden="true" />
                  Ask on WhatsApp
                </a>
              </TfButton>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/45">
              {[
                "From R5,000",
                "50% deposit",
                "Seven-working-day target",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-400" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </TfReveal>

          <TfReveal delay={150}>
            <div className="relative mx-auto max-w-[34rem]">
              <div
                aria-hidden="true"
                className="absolute inset-10 rounded-full bg-emerald-500/20 blur-3xl"
              />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.055] p-4 shadow-2xl backdrop-blur-sm sm:p-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/35">
                      Your handoff
                    </p>
                    <p className="mt-1 font-tf-display text-base font-semibold text-white">
                      Photos, prices, business details
                    </p>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-amber-400/12 text-amber-300">
                    <Send className="size-4.5" aria-hidden="true" />
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-[0.82fr_auto_1.18fr] items-center gap-3">
                  <div className="space-y-2.5">
                    {[
                      { icon: ImageIcon, label: "Product photos" },
                      { icon: FileText, label: "Prices & sizes" },
                      { icon: Store, label: "Shop details" },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="rounded-xl border border-white/10 bg-black/15 p-3"
                      >
                        <Icon className="size-4 text-white/45" aria-hidden="true" />
                        <p className="mt-2 text-xs font-medium text-white/58">{label}</p>
                      </div>
                    ))}
                  </div>

                  <ArrowRight className="size-5 text-emerald-400" aria-hidden="true" />

                  <div className="overflow-hidden rounded-2xl bg-[#faf8f4] p-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-700">
                        Launch ready
                      </span>
                      <span className="size-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="mt-3 overflow-hidden rounded-xl bg-white">
                      <Image
                        src="/landing/demo-sneakers.webp"
                        alt="Example product prepared for an online catalogue"
                        width={520}
                        height={360}
                        className="aspect-[4/3] w-full object-cover"
                        priority
                      />
                    </div>
                    <p className="mt-3 text-sm font-bold text-stone-900">
                      Professional catalogue
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-stone-500">
                        Listings · variants · prices
                      </span>
                      <span className="rounded-full bg-[#25D366] px-2 py-1 text-[9px] font-semibold text-white">
                        Order on WhatsApp
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07] px-4 py-3">
                  <span className="flex items-center gap-2 text-xs font-medium text-emerald-200">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Human-reviewed before launch
                  </span>
                  <span className="text-xs text-white/35">TradeFeed Growth</span>
                </div>
              </div>
            </div>
          </TfReveal>
        </div>
      </section>

      <section className="border-y border-tf-stone-200 bg-tf-raised">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4">
          {[
            { value: "7 days", label: "launch target", icon: Clock3 },
            { value: "50", label: "listings included", icon: ShoppingBag },
            { value: "50 / 50", label: "deposit structure", icon: ShieldCheck },
            { value: "Human", label: "review before launch", icon: CheckCircle2 },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 px-2 py-6 sm:px-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tf-verified-soft text-tf-primary">
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-tf-display text-lg font-semibold text-tf-ink">{value}</p>
                <p className="text-xs text-tf-stone-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-tf-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <TfReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-tf-primary">
                The transformation
              </p>
              <h2 className="mt-3 font-tf-hero text-4xl font-semibold tracking-[-0.04em] text-tf-ink sm:text-5xl">
                From WhatsApp chaos to one shop you can share
              </h2>
              <p className="mt-4 text-base leading-relaxed text-tf-stone-600">
                Your customers should not have to ask for every price, size and
                product photo one message at a time.
              </p>
            </div>
          </TfReveal>

          <TfReveal stagger className="mt-12 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-red-200 bg-red-50/70 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-red-100 text-red-700">
                  <X className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                    Before
                  </p>
                  <h3 className="font-tf-display text-xl font-semibold text-stone-900">
                    Selling from scattered messages
                  </h3>
                </div>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-stone-700">
                {[
                  "Product photos buried in chats and phone folders",
                  "Customers repeatedly asking for prices and availability",
                  "Missing descriptions, sizes and product categories",
                  "Inconsistent social posts with no clear next step",
                  "No single catalogue link for resellers or customers",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <X className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Check className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    After
                  </p>
                  <h3 className="font-tf-display text-xl font-semibold text-stone-900">
                    A managed TradeFeed catalogue
                  </h3>
                </div>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-stone-700">
                {[
                  "Products organised into a clean, mobile-friendly shop",
                  "Clear prices, descriptions, sizes and variants",
                  "One shareable link with WhatsApp ordering built in",
                  "Launch content ready for your status and social pages",
                  "A repeatable system for keeping the catalogue current",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </TfReveal>
        </div>
      </section>

      <section id="what-you-get" className="scroll-mt-20 bg-tf-raised">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <TfReveal>
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-tf-primary">
                What we do for you
              </p>
              <h2 className="mt-3 font-tf-hero text-4xl font-semibold tracking-[-0.04em] text-tf-ink sm:text-5xl">
                The work that normally keeps your shop unfinished
              </h2>
            </div>
          </TfReveal>

          <TfReveal stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: LayoutGrid,
                title: "Catalogue structure",
                body: "We organise products, categories, prices and variants so buyers can find what they need.",
              },
              {
                icon: WandSparkles,
                title: "Professional listings",
                body: "AI helps draft clear titles and descriptions; a person checks the result before publishing.",
              },
              {
                icon: Camera,
                title: "Image cleanup",
                body: "We prepare usable product photos for a consistent, trustworthy catalogue presentation.",
              },
              {
                icon: MessageCircle,
                title: "WhatsApp ordering",
                body: "Customers browse the shop and send a structured enquiry through the channel they already use.",
              },
              {
                icon: Megaphone,
                title: "Launch content",
                body: "You receive practical posts and a banner that point customers to one clear catalogue link.",
              },
              {
                icon: BarChart3,
                title: "Growth review",
                body: "Managed clients get a monthly review of catalogue activity and practical improvement ideas.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-2xl border border-tf-stone-200 bg-tf-surface p-6 shadow-tf-sm transition-shadow hover:shadow-tf-md"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-tf-verified-soft text-tf-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-tf-display text-xl font-semibold text-tf-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-tf-stone-600">{body}</p>
              </article>
            ))}
          </TfReveal>
        </div>
      </section>

      <section id="process" className="scroll-mt-20 bg-tf-deep">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <TfReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/75">
              A clear delivery process
            </p>
            <h2 className="mt-3 max-w-2xl font-tf-hero text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              From fit check to live shop
            </h2>
          </TfReveal>

          <TfReveal stagger className="mt-12 grid gap-4 md:grid-cols-4">
            {[
              {
                number: "01",
                title: "Apply",
                body: "Tell us what you sell, catalogue size and what is ready.",
              },
              {
                number: "02",
                title: "Confirm the scope",
                body: "We review the fit, agree on deliverables and collect the deposit.",
              },
              {
                number: "03",
                title: "Build together",
                body: "You provide product information; we prepare and review the shop.",
              },
              {
                number: "04",
                title: "Approve and launch",
                body: "You check the result, pay the balance and receive your launch pack.",
              },
            ].map((step) => (
              <article
                key={step.number}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-6"
              >
                <span
                  aria-hidden="true"
                  className="absolute -right-2 -top-6 font-tf-hero text-8xl font-bold text-white/[0.045]"
                >
                  {step.number}
                </span>
                <span className="text-xs font-semibold tracking-[0.2em] text-emerald-300/65">
                  STEP {step.number}
                </span>
                <h3 className="relative mt-8 font-tf-display text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-white/52">{step.body}</p>
              </article>
            ))}
          </TfReveal>

          <p className="mt-8 max-w-3xl text-xs leading-relaxed text-white/40">
            The seven-working-day target begins only after we receive the
            agreed deposit and complete product information. Larger or
            incomplete catalogues receive a separate timeline.
          </p>
        </div>
      </section>

      <section id="packages" className="scroll-mt-20 bg-tf-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <TfReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-tf-primary">
                Simple service packages
              </p>
              <h2 className="mt-3 font-tf-hero text-4xl font-semibold tracking-[-0.04em] text-tf-ink sm:text-5xl">
                Start with the help your business needs
              </h2>
              <p className="mt-4 text-base leading-relaxed text-tf-stone-600">
                Software subscriptions and managed services are priced
                separately. These packages cover hands-on work by the Growth
                team.
              </p>
            </div>
          </TfReveal>

          <TfReveal stagger className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
            {packages.map((pkg) => (
              <article
                key={pkg.name}
                className={`relative flex flex-col rounded-3xl bg-tf-raised p-6 shadow-tf-sm sm:p-7 ${
                  pkg.featured
                    ? "border-2 border-tf-primary shadow-tf-md"
                    : "border border-tf-stone-200"
                }`}
              >
                {pkg.featured && (
                  <TfBadge
                    variant="urgency"
                    className="absolute right-5 top-5"
                  >
                    First 3 accepted businesses
                  </TfBadge>
                )}
                <p className="pr-28 text-xs font-semibold uppercase tracking-[0.18em] text-tf-primary">
                  {pkg.eyebrow}
                </p>
                <h3 className="mt-3 font-tf-display text-2xl font-semibold text-tf-ink">
                  {pkg.name}
                </h3>
                <p className="mt-5">
                  <span className="font-tf-hero text-4xl font-semibold tracking-tight text-tf-ink">
                    {pkg.price}
                  </span>
                  <span className="ml-2 text-sm text-tf-stone-500">{pkg.cadence}</span>
                </p>
                <p className="mt-4 min-h-16 text-sm leading-relaxed text-tf-stone-600">
                  {pkg.description}
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-sm text-tf-stone-700">
                      <Check className="mt-0.5 size-4 shrink-0 text-tf-primary" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t border-tf-stone-200 pt-4 text-xs leading-relaxed text-tf-stone-500">
                  {pkg.note}
                </p>
                <TfButton asChild fullWidth className="mt-5" variant={pkg.featured ? "primary" : "secondary"}>
                  <Link href="#apply">Apply for {pkg.name}</Link>
                </TfButton>
              </article>
            ))}
          </TfReveal>
        </div>
      </section>

      <section className="bg-tf-raised">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <TfReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-tf-primary">
                Choose the right route
              </p>
              <h2 className="mt-3 font-tf-hero text-4xl font-semibold tracking-[-0.04em] text-tf-ink sm:text-5xl">
                Self-service or done for you?
              </h2>
            </div>
          </TfReveal>

          <TfReveal className="mt-10 overflow-hidden rounded-3xl border border-tf-stone-200 shadow-tf-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] border-collapse text-left">
                <thead>
                  <tr className="bg-tf-stone-100">
                    <th className="px-5 py-4 text-sm font-semibold text-tf-stone-600">Task</th>
                    <th className="px-5 py-4 text-sm font-semibold text-tf-ink">
                      Self-service TradeFeed
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold text-tf-primary">
                      TradeFeed Growth
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tf-stone-200 bg-tf-raised">
                  {[
                    ["Shop setup", "You do it", "We do it"],
                    ["Product uploads", "You upload", "We prepare and upload"],
                    ["Descriptions", "You write or use AI", "We draft and review"],
                    ["Marketing content", "You create it", "Included by package"],
                    ["Best for", "Hands-on sellers", "Busy or larger businesses"],
                    ["Cost", "Lower software fee", "Higher hands-on service fee"],
                  ].map(([task, selfService, growth]) => (
                    <tr key={task}>
                      <th className="px-5 py-4 text-sm font-medium text-tf-stone-700">{task}</th>
                      <td className="px-5 py-4 text-sm text-tf-stone-600">{selfService}</td>
                      <td className="px-5 py-4 text-sm font-medium text-tf-ink">{growth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TfReveal>

          <div className="mt-6 text-center">
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 text-sm font-semibold text-tf-primary hover:underline"
            >
              View self-service TradeFeed pricing
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section id="apply" className="scroll-mt-16 bg-tf-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <TfReveal>
            <div className="lg:sticky lg:top-24">
              <TfBadge variant="verified" icon>
                Applications open
              </TfBadge>
              <h2 className="mt-5 font-tf-hero text-4xl font-semibold tracking-[-0.04em] text-tf-ink sm:text-5xl">
                Let&apos;s see if Growth fits your business
              </h2>
              <p className="mt-5 text-base leading-relaxed text-tf-stone-600">
                Apply before creating a TradeFeed account. We first check your
                catalogue size, product information and launch goals.
              </p>

              <ul className="mt-7 space-y-4">
                {[
                  "No payment is taken from this page",
                  "No work starts before you approve the scope",
                  "We reply within one business day",
                  "You keep control of the final shop",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-tf-stone-700">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-tf-verified-soft text-tf-primary">
                      <Check className="size-3" aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-2xl border border-tf-stone-200 bg-tf-raised p-5">
                <div className="flex items-center gap-3">
                  <Building2 className="size-5 text-tf-primary" aria-hidden="true" />
                  <p className="font-tf-display font-semibold text-tf-ink">
                    Have more than 100 products?
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-tf-stone-600">
                  Choose Wholesale Digital Setup in the form. We&apos;ll assess
                  variants, reseller needs and staff workflow before quoting.
                </p>
              </div>
            </div>
          </TfReveal>

          <TfReveal delay={100}>
            <GrowthApplicationForm />
          </TfReveal>
        </div>
      </section>

      <section className="bg-tf-raised">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <TfReveal>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-tf-primary">
                Questions before you apply
              </p>
              <h2 className="mt-3 font-tf-hero text-4xl font-semibold tracking-[-0.04em] text-tf-ink sm:text-5xl">
                Straight answers
              </h2>
            </div>
          </TfReveal>

          <TfReveal stagger className="mt-10 space-y-3">
            {faqItems.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-tf-stone-200 bg-tf-surface"
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-tf-ink [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span className="text-xl font-light text-tf-primary transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-tf-stone-600">{faq.answer}</p>
              </details>
            ))}
          </TfReveal>
        </div>
      </section>

      <section className="bg-tf-deepest">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <TfReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/70">
              Your catalogue should be working for you
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl font-tf-hero text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
              Stop rebuilding the same sale in every WhatsApp chat.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/55">
              Give customers one professional shop link—and give yourself a
              system you can keep growing.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <TfButton asChild size="lg">
                <Link href="#apply">
                  Apply for Growth
                  <ArrowRight aria-hidden="true" />
                </Link>
              </TfButton>
              <TfButton asChild size="lg" variant="secondary">
                <Link href="/marketplace">See TradeFeed shops</Link>
              </TfButton>
            </div>
          </TfReveal>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-tf-deepest pb-24 text-white/55 lg:pb-0">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <TradeFeedLogo size="sm" variant="light" />
            <p className="mt-3 max-w-sm text-xs leading-relaxed">
              TradeFeed gives sellers the software. TradeFeed Growth does the
              setup and ongoing work for accepted businesses.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
            <Link href="/" className="hover:text-white">
              TradeFeed
            </Link>
            <Link href="/marketplace" className="hover:text-white">
              Marketplace
            </Link>
            <Link href="/#pricing" className="hover:text-white">
              Software pricing
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
          </nav>
        </div>
      </footer>

      <TfLandingStickyCta
        href="#apply"
        label="Apply for TradeFeed Growth"
        sentinelId="growth-hero-cta"
      />
    </main>
  );
}
