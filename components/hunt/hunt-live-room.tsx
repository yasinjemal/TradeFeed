"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  Check,
  Clock3,
  Copy,
  MapPin,
  MessageCircle,
  Radar,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { joinHuntAction } from "@/app/actions/hunts";
import { TfBadge } from "@/components/tf/badge";
import { TfButton } from "@/components/tf/button";
import { TfEmptyState } from "@/components/tf/empty-state";

interface HuntLiveRoomProps {
  hunt: {
    slug: string;
    title: string;
    description: string;
    imageUrl: string;
    status: "LIVE" | "FOUND" | "CLOSED" | "REJECTED" | "EXPIRED";
    city: string;
    province: string | null;
    desiredVariant: string | null;
    desiredColor: string | null;
    style: string | null;
    matchPreference: "EXACT_ONLY" | "SIMILAR_OK";
    budgetLabel: string | null;
    participantCount: number;
    viewerJoined: boolean;
    publishedLabel: string;
    expiresLabel: string;
  };
}

export function HuntLiveRoom({ hunt }: HuntLiveRoomProps) {
  const router = useRouter();
  const [participantCount, setParticipantCount] = React.useState(
    hunt.participantCount,
  );
  const [joined, setJoined] = React.useState(hunt.viewerJoined);
  const [joining, setJoining] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setParticipantCount(hunt.participantCount);
    setJoined(hunt.viewerJoined);
  }, [hunt.participantCount, hunt.viewerJoined]);

  React.useEffect(() => {
    if (hunt.status !== "LIVE") return;
    const timer = window.setInterval(() => router.refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, [hunt.status, router]);

  const shareText = `Can TradeFeed find this in ${hunt.city}? Join the Hunt:`;

  const copyLink = React.useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
    setMessage("Hunt link copied");
    window.setTimeout(() => setMessage(""), 2_500);
  }, []);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${hunt.title} — TradeFeed HUNT`,
          text: shareText,
          url: window.location.href,
        });
        setMessage("Hunt shared");
        return;
      } catch (shareError) {
        if (
          shareError instanceof DOMException &&
          shareError.name === "AbortError"
        ) {
          return;
        }
      }
    }
    await copyLink();
  };

  const join = async () => {
    setJoining(true);
    setError("");
    const result = await joinHuntAction(hunt.slug);
    if (result.success) {
      setParticipantCount(result.participantCount);
      setJoined(true);
      setMessage("You joined this Hunt");
      router.refresh();
    } else {
      setError(result.error);
    }
    setJoining(false);
  };

  const canonicalHuntUrl = `https://tradefeed.co.za/hunt/${hunt.slug}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `${shareText} ${canonicalHuntUrl}`,
  )}`;
  const sellerResponseUrl = `https://wa.me/27835034502?text=${encodeURIComponent(
    `Hi TradeFeed, I may be able to fulfil HUNT ${hunt.slug}. Please send me the seller response steps.`,
  )}`;

  const isLive = hunt.status === "LIVE";
  const peopleLabel =
    participantCount === 1 ? "1 person wants this" : `${participantCount} people want this`;

  return (
    <div className="pb-28 lg:pb-16">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-8">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-tf-stone-200 bg-tf-raised shadow-tf-sm">
            <div className="relative aspect-[4/3] bg-tf-stone-100">
              <Image
                src={hunt.imageUrl}
                alt={`Reference image for ${hunt.title}`}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-contain"
              />
              <TfBadge
                className={
                  isLive
                    ? "absolute left-4 top-4 border border-emerald-500/20 bg-emerald-950/85 text-emerald-300 backdrop-blur"
                    : "absolute left-4 top-4"
                }
              >
                {isLive && (
                  <span
                    className="size-1.5 rounded-full bg-emerald-400"
                    aria-hidden="true"
                  />
                )}
                {hunt.status}
              </TfBadge>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-tf-primary">
                TradeFeed HUNT
              </p>
              <h1 className="mt-2 font-tf-display text-2xl font-semibold leading-tight text-tf-ink sm:text-3xl">
                {hunt.title}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-tf-stone-600">
                {hunt.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <TfBadge variant="location" icon>
                  {hunt.city}
                </TfBadge>
                {hunt.desiredVariant && (
                  <TfBadge variant="outline">{hunt.desiredVariant}</TfBadge>
                )}
                {hunt.desiredColor && (
                  <TfBadge variant="outline">{hunt.desiredColor}</TfBadge>
                )}
                {hunt.budgetLabel && (
                  <TfBadge variant="sale">
                    Under {hunt.budgetLabel}
                  </TfBadge>
                )}
                <TfBadge variant="outline">
                  {hunt.matchPreference === "EXACT_ONLY"
                    ? "Exact only"
                    : "Similar welcome"}
                </TfBadge>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-tf-stone-200 pt-5 text-xs">
                <div>
                  <dt className="text-tf-stone-500">Started</dt>
                  <dd className="mt-1 font-medium text-tf-ink">
                    {hunt.publishedLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-tf-stone-500">Hunt closes</dt>
                  <dd className="mt-1 font-medium text-tf-ink">
                    {hunt.expiresLabel}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-5" aria-label="Live Hunt updates">
          <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-[linear-gradient(135deg,#071a0f,#064e3b)] p-5 text-white shadow-tf-md sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="relative mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                  <span className="absolute inset-0 animate-ping rounded-full border border-emerald-400/20 motion-reduce:animate-none" />
                  <Radar className="relative size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-tf-display text-lg font-semibold">
                    {isLive ? "Searching now" : "This Hunt is closed"}
                  </p>
                  <p className="mt-1 max-w-lg text-sm leading-relaxed text-white/65">
                    {isLive
                      ? "This request is ready for the concierge team to match with relevant, opted-in Johannesburg sellers."
                      : "New interest is paused, but the real result remains visible."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.refresh()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Refresh
              </button>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-xs text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden="true" />
                {peopleLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden="true" />
                {hunt.city} pilot
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-3.5" aria-hidden="true" />
                Updates are real, never simulated
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-tf-stone-200 bg-tf-raised p-5 shadow-tf-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-tf-ink">
                  {peopleLabel}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-tf-stone-500">
                  This count is interest, not a paid reservation or a group-price
                  unlock.
                </p>
              </div>
              {isLive && (
                <TfButton
                  type="button"
                  onClick={join}
                  disabled={joining || joined}
                >
                  {joined ? (
                    <>
                      <Check aria-hidden="true" />
                      You&apos;re in
                    </>
                  ) : joining ? (
                    "Joining…"
                  ) : (
                    <>
                      <Users aria-hidden="true" />
                      I want one too
                    </>
                  )}
                </TfButton>
              )}
            </div>
            {error && (
              <p className="mt-3 text-sm text-tf-error" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-tf-stone-200 bg-tf-raised p-5 shadow-tf-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-tf-primary">
                  Seller offers
                </p>
                <h2 className="mt-1 font-tf-display text-xl font-semibold text-tf-ink">
                  Credible offers appear here
                </h2>
              </div>
              <ShieldCheck
                className="size-6 shrink-0 text-tf-primary"
                aria-hidden="true"
              />
            </div>
            <TfEmptyState
              icon={<Sparkles />}
              title="No verified offer has been published yet"
              description="The pilot team matches requests manually. We will never invent a seller, price, stock claim, or response time to make this page look busy."
              action={
                <TfButton asChild variant="secondary">
                  <a
                    href={sellerResponseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle aria-hidden="true" />
                    I am a seller with this item
                  </a>
                </TfButton>
              }
            />
          </div>

          <div className="rounded-2xl border border-tf-stone-200 bg-tf-raised p-5 shadow-tf-sm sm:p-6">
            <h2 className="font-tf-display text-lg font-semibold text-tf-ink">
              Help this Hunt travel
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-tf-stone-600">
              Share it with people who want the same product or know a credible
              Johannesburg seller.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <TfButton type="button" variant="secondary" onClick={share}>
                <Share2 aria-hidden="true" />
                Share
              </TfButton>
              <TfButton asChild variant="whatsapp" fullWidth>
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle aria-hidden="true" />
                  WhatsApp
                </a>
              </TfButton>
              <TfButton
                type="button"
                variant="secondary"
                onClick={() => void copyLink()}
              >
                <Copy aria-hidden="true" />
                Copy link
              </TfButton>
            </div>
          </div>

          <div className="rounded-2xl border border-tf-stone-200 bg-tf-stone-50 p-5">
            <h2 className="font-tf-display text-base font-semibold text-tf-ink">
              What happens next
            </h2>
            <ol className="mt-4 space-y-3 text-sm text-tf-stone-600">
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tf-verified-soft text-xs font-bold text-tf-primary">
                  1
                </span>
                TradeFeed reviews the request and matches relevant opted-in
                sellers during pilot service hours.
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tf-verified-soft text-xs font-bold text-tf-primary">
                  2
                </span>
                A genuine seller response is checked before an offer is shown.
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tf-verified-soft text-xs font-bold text-tf-primary">
                  3
                </span>
                The Hunt starter chooses whether to continue to an organised
                WhatsApp order.
              </li>
            </ol>
          </div>

          <div className="text-center">
            <Link
              href="/hunt"
              className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-tf-primary hover:underline"
            >
              Hunt another product
            </Link>
          </div>
        </section>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-tf-stone-200 bg-tf-raised/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto grid max-w-xl grid-cols-[0.75fr_1.25fr] gap-2">
          <TfButton type="button" variant="secondary" onClick={share}>
            <Share2 aria-hidden="true" />
            Share
          </TfButton>
          <TfButton
            type="button"
            onClick={join}
            disabled={!isLive || joining || joined}
          >
            {joined ? (
              <>
                <Check aria-hidden="true" />
                You&apos;re in · {participantCount}
              </>
            ) : isLive ? (
              <>
                <Users aria-hidden="true" />
                I want one too
              </>
            ) : (
              "Hunt closed"
            )}
          </TfButton>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
