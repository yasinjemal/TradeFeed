import type { Metadata } from "next";
import {
  ArrowDown,
  BadgeCheck,
  Camera,
  MessageCircle,
  Search,
  Share2,
  ShieldCheck,
  Users,
} from "lucide-react";

import { HuntCard } from "@/components/hunt/hunt-card";
import { HuntCreateForm } from "@/components/hunt/hunt-create-form";
import { HuntHeader } from "@/components/hunt/hunt-header";
import { getRecentPublicHunts } from "@/lib/db/hunts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "HUNT — Screenshot It. South Africa Finds It",
  description:
    "Show TradeFeed a fashion product, your size, Johannesburg area and budget. Start a live Hunt and let relevant local sellers respond.",
  alternates: { canonical: "https://tradefeed.co.za/hunt" },
  openGraph: {
    title: "TradeFeed HUNT — Screenshot it. South Africa finds it.",
    description:
      "Turn one product screenshot into a live request for local sellers.",
    url: "https://tradefeed.co.za/hunt",
    type: "website",
    images: [
      {
        url: "/api/og?type=marketplace&title=Screenshot+it.+South+Africa+finds+it.&subtitle=TradeFeed+HUNT+%C2%B7+Johannesburg+pilot",
        width: 1200,
        height: 630,
        alt: "TradeFeed HUNT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeFeed HUNT — Screenshot it. South Africa finds it.",
    description:
      "Turn one product screenshot into a live request for local sellers.",
  },
};

const HOW_IT_WORKS = [
  {
    icon: Camera,
    number: "01",
    title: "Show it",
    copy: "Upload one privacy-safe screenshot or take a product photo.",
  },
  {
    icon: Search,
    number: "02",
    title: "Hunt it",
    copy: "Set the size, Johannesburg area and maximum budget that must match.",
  },
  {
    icon: MessageCircle,
    number: "03",
    title: "Choose it",
    copy: "A real seller offer appears only after the TradeFeed pilot team checks it.",
  },
] as const;

export default async function HuntPage() {
  const recentHunts = await getRecentPublicHunts(6);

  return (
    <div className="overflow-x-hidden">
      <section className="relative overflow-hidden bg-[#071a0f] text-white">
        <HuntHeader overHero />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 15% 30%, rgba(16,185,129,.18), transparent 34%), radial-gradient(circle at 80% 62%, rgba(34,211,238,.10), transparent 34%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-44 size-[28rem] rounded-full border border-emerald-400/10"
        >
          <div className="absolute inset-16 rounded-full border border-emerald-400/10" />
          <div className="absolute inset-32 rounded-full border border-emerald-400/10" />
        </div>

        <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-6xl items-center gap-10 px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:py-28">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              LIVE PILOT · JOHANNESBURG
            </div>

            <h1
              className="mt-6 font-tf-hero font-semibold tracking-[-0.045em]"
              style={{
                fontSize: "clamp(3rem, 9vw, 5.8rem)",
                lineHeight: 0.92,
              }}
            >
              Screenshot it.
              <span className="mt-2 block bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                SA finds it.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
              Show TradeFeed a fashion product, your size and your budget. We
              turn it into a live Hunt that real buyers can join and credible
              local sellers can answer.
            </p>

            <div className="mt-7 grid gap-3 text-sm text-white/75 sm:grid-cols-3">
              <span className="flex items-center gap-2">
                <ShieldCheck
                  className="size-4 text-emerald-300"
                  aria-hidden="true"
                />
                Private number
              </span>
              <span className="flex items-center gap-2">
                <BadgeCheck
                  className="size-4 text-emerald-300"
                  aria-hidden="true"
                />
                Checked offers
              </span>
              <span className="flex items-center gap-2">
                <MessageCircle
                  className="size-4 text-emerald-300"
                  aria-hidden="true"
                />
                WhatsApp handoff
              </span>
            </div>

            <div className="mt-9 rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-emerald-300">
                  <Users className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Sharing is part of the product
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-white/55">
                    Friends can join the same Hunt. Future group prices will
                    unlock only from verified reservations and a real seller
                    commitment—never from fake clicks.
                  </p>
                </div>
              </div>
            </div>

            <a
              href="#start-hunt"
              className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
            >
              Start with one screenshot
              <ArrowDown className="size-4" aria-hidden="true" />
            </a>
          </div>

          <div id="start-hunt" className="scroll-mt-20">
            <HuntCreateForm />
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-b border-tf-stone-200 bg-tf-surface py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-tf-primary">
              One request, a real response
            </p>
            <h2 className="mt-3 font-tf-display text-3xl font-semibold tracking-tight text-tf-ink sm:text-4xl">
              No catalogue result? Start the market.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-tf-stone-600">
              HUNT does not pretend every product is already listed. It captures
              the demand and gives the TradeFeed pilot team a truthful path to
              find hidden local stock.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.number}
                  className="rounded-2xl border border-tf-stone-200 bg-tf-raised p-5 shadow-tf-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-tf-verified-soft text-tf-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-tf-display text-sm font-semibold text-tf-stone-400">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mt-5 font-tf-display text-xl font-semibold text-tf-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-tf-stone-600">
                    {step.copy}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="live-hunts" className="bg-tf-stone-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-tf-primary">
                Real pilot activity
              </p>
              <h2 className="mt-3 font-tf-display text-3xl font-semibold text-tf-ink sm:text-4xl">
                Live Hunts
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tf-stone-600">
                Only real, approved requests appear here. No demonstration
                records are inserted to make the pilot look busy.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-tf-stone-500">
              <Share2 className="size-4" aria-hidden="true" />
              #CanTradeFeedFindIt
            </div>
          </div>

          {recentHunts.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentHunts.map((hunt) => (
                <HuntCard key={hunt.id} hunt={hunt} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-tf-stone-300 bg-tf-raised px-6 py-12 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-tf-verified-soft text-tf-primary">
                <Search className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-tf-display text-xl font-semibold text-tf-ink">
                The first public Hunt starts here
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-tf-stone-600">
                This feed stays empty until a real buyer creates an approved
                request. Start the pilot with one clear fashion screenshot.
              </p>
              <a
                href="#start-hunt"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-tf-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-tf-primary-hover"
              >
                Start the first Hunt
              </a>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-tf-stone-200 bg-tf-raised">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-tf-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            TradeFeed HUNT pilot · Johannesburg fashion and sneakers · Offers
            are not auctions.
          </p>
          <p>Proof of current stock is evidence, not an authenticity guarantee.</p>
        </div>
      </footer>
    </div>
  );
}
