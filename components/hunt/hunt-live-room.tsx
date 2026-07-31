"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  Check,
  Clock3,
  Copy,
  Flag,
  MapPin,
  MessageCircle,
  Radar,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  X,
} from "lucide-react";

import {
  closeHuntAction,
  joinHuntAction,
  reportHuntAction,
  selectHuntOfferAction,
  trackHuntShareAction,
} from "@/app/actions/hunts";
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
    viewerIsOwner: boolean;
    selectedOfferId: string | null;
    fulfillmentStatus:
      | "NONE"
      | "OFFER_SELECTED"
      | "HANDOFF_SENT"
      | "FULFILLED";
    offers: Array<{
      id: string;
      matchType: "EXACT" | "SIMILAR" | "UNCERTAIN";
      publicProductName: string;
      publicDescription: string | null;
      publicVariant: string | null;
      publicDeliveryEstimate: string;
      priceCents: number;
      quantityAvailable: number | null;
      publicSellerVerifiedSnapshot: boolean;
      publishedAt: string | null;
    }>;
    publishedLabel: string;
    expiresLabel: string;
  };
}

function formatOfferPrice(cents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function HuntLiveRoom({ hunt }: HuntLiveRoomProps) {
  const router = useRouter();
  const [participantCount, setParticipantCount] = React.useState(
    hunt.participantCount,
  );
  const [joined, setJoined] = React.useState(hunt.viewerJoined);
  const [joining, setJoining] = React.useState(false);
  const [selectedOfferId, setSelectedOfferId] = React.useState(
    hunt.selectedOfferId,
  );
  const [selectingOfferId, setSelectingOfferId] = React.useState<string | null>(
    null,
  );
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportReason, setReportReason] = React.useState("MISLEADING");
  const [reportDetails, setReportDetails] = React.useState("");
  const [reporting, setReporting] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const canonicalHuntUrl = `https://tradefeed.co.za/hunt/${hunt.slug}`;

  React.useEffect(() => {
    setParticipantCount(hunt.participantCount);
    setJoined(hunt.viewerJoined);
    setSelectedOfferId(hunt.selectedOfferId);
  }, [hunt.participantCount, hunt.selectedOfferId, hunt.viewerJoined]);

  React.useEffect(() => {
    if (hunt.status !== "LIVE") return;
    const timer = window.setInterval(() => router.refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, [hunt.status, router]);

  const shareText = `Can TradeFeed find this in ${hunt.city}? Join the Hunt:`;

  const copyLink = React.useCallback(async () => {
    await navigator.clipboard.writeText(canonicalHuntUrl);
    void trackHuntShareAction(hunt.slug, "copy");
    setMessage("Hunt link copied");
    window.setTimeout(() => setMessage(""), 2_500);
  }, [canonicalHuntUrl, hunt.slug]);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${hunt.title} — TradeFeed HUNT`,
          text: shareText,
          url: canonicalHuntUrl,
        });
        void trackHuntShareAction(hunt.slug, "native");
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
    try {
      const result = await joinHuntAction(hunt.slug);
      if (result.success) {
        setParticipantCount(result.participantCount);
        setJoined(true);
        setMessage("You joined this Hunt");
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("This Hunt could not be joined. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const chooseOffer = async (offerId: string) => {
    setSelectingOfferId(offerId);
    setError("");
    try {
      const result = await selectHuntOfferAction(hunt.slug, offerId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSelectedOfferId(offerId);
      setMessage("Offer selected. Opening WhatsApp...");
      window.location.assign(result.whatsappUrl);
    } catch {
      setError("The offer could not be selected. Please try again.");
    } finally {
      setSelectingOfferId(null);
    }
  };

  const submitReport = async () => {
    setReporting(true);
    setError("");
    try {
      const result = await reportHuntAction({
        huntSlug: hunt.slug,
        reason: reportReason,
        details: reportDetails,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage("Report received. TradeFeed will review it.");
      setReportOpen(false);
      setReportDetails("");
    } catch {
      setError("The report could not be sent. Please try again.");
    } finally {
      setReporting(false);
    }
  };

  const closeHunt = async () => {
    if (!window.confirm("Close this Hunt? New buyers and offers will stop.")) {
      return;
    }
    setClosing(true);
    setError("");
    try {
      const result = await closeHuntAction(hunt.slug);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage("Hunt closed");
      router.refresh();
    } catch {
      setError("The Hunt could not be closed. Please try again.");
    } finally {
      setClosing(false);
    }
  };

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
            {hunt.offers.length === 0 ? (
              <TfEmptyState
                icon={<Sparkles />}
                title="No verified offer has been published yet"
                description="The concierge team records only genuine responses from opted-in TradeFeed sellers. We never invent a seller, price, stock claim, or response time."
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
            ) : (
              <div className="space-y-3">
                {hunt.offers.map((offer) => {
                  const selected = selectedOfferId === offer.id;
                  const matchLabel =
                    offer.matchType === "EXACT"
                      ? "Exact match"
                      : offer.matchType === "SIMILAR"
                        ? "Similar option"
                        : "Needs confirmation";

                  return (
                    <article
                      key={offer.id}
                      className={`rounded-2xl border p-4 transition-colors sm:p-5 ${
                        selected
                          ? "border-tf-primary bg-tf-verified-soft"
                          : "border-tf-stone-200 bg-tf-stone-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-tf-stone-200 bg-tf-raised text-tf-primary">
                          <Store className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-tf-ink">
                              TradeFeed seller
                            </p>
                            {offer.publicSellerVerifiedSnapshot && (
                              <TfBadge variant="verified" icon>
                                Verified seller
                              </TfBadge>
                            )}
                            <TfBadge
                              variant={
                                offer.matchType === "EXACT"
                                  ? "sale"
                                  : "outline"
                              }
                            >
                              {matchLabel}
                            </TfBadge>
                          </div>
                          <h3 className="mt-2 font-tf-display text-lg font-semibold text-tf-ink">
                            {offer.publicProductName}
                          </h3>
                          {offer.publicDescription && (
                            <p className="mt-1 text-sm leading-relaxed text-tf-stone-600">
                              {offer.publicDescription}
                            </p>
                          )}
                        </div>
                        <p className="shrink-0 font-tf-display text-xl font-semibold tabular-nums text-tf-ink">
                          {formatOfferPrice(offer.priceCents)}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-tf-stone-600">
                        {offer.publicVariant && (
                          <span className="rounded-full bg-tf-raised px-3 py-1.5">
                            {offer.publicVariant}
                          </span>
                        )}
                        <span className="rounded-full bg-tf-raised px-3 py-1.5">
                          {offer.publicDeliveryEstimate}
                        </span>
                        {offer.quantityAvailable != null && (
                          <span className="rounded-full bg-tf-raised px-3 py-1.5">
                            {offer.quantityAvailable} available when checked
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-tf-stone-500">
                        TradeFeed recorded the seller&apos;s current-stock
                        confirmation. Public proof media is withheld during
                        Beta; this is not an authenticity guarantee.
                      </p>

                      <div className="mt-4 border-t border-tf-stone-200 pt-4">
                        {hunt.viewerIsOwner ? (
                          hunt.status === "LIVE" ||
                          (hunt.status === "FOUND" && selected) ? (
                            <TfButton
                              type="button"
                              fullWidth
                              variant={selected ? "whatsapp" : "primary"}
                              onClick={() => void chooseOffer(offer.id)}
                              disabled={Boolean(
                                selectingOfferId &&
                                  selectingOfferId !== offer.id,
                              )}
                            >
                              <MessageCircle aria-hidden="true" />
                              {selectingOfferId === offer.id
                                ? "Opening WhatsApp..."
                                : selected
                                  ? "Continue with this seller"
                                  : "Choose & confirm on WhatsApp"}
                            </TfButton>
                          ) : (
                            <p className="text-xs leading-relaxed text-tf-stone-500">
                              This Hunt is closed. No new seller can be chosen.
                            </p>
                          )
                        ) : (
                          <p className="text-xs leading-relaxed text-tf-stone-500">
                            Only the Hunt creator can choose an offer. Seller
                            contact details stay private until that choice.
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
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
                  onClick={() =>
                    void trackHuntShareAction(hunt.slug, "whatsapp")
                  }
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

          <div className="rounded-2xl border border-tf-stone-200 bg-tf-raised p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-tf-display text-base font-semibold text-tf-ink">
                  Safety & control
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-tf-stone-500">
                  Report privacy, rights, counterfeit, scam, spam or misleading
                  content. Reports go to the private operator queue.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <TfButton
                  type="button"
                  variant="secondary"
                  onClick={() => setReportOpen((open) => !open)}
                >
                  <Flag aria-hidden="true" />
                  Report
                </TfButton>
                {hunt.viewerIsOwner && isLive && (
                  <TfButton
                    type="button"
                    variant="danger"
                    onClick={() => void closeHunt()}
                    disabled={closing}
                  >
                    <X aria-hidden="true" />
                    {closing ? "Closing..." : "Close my Hunt"}
                  </TfButton>
                )}
              </div>
            </div>

            {reportOpen && (
              <div className="mt-4 space-y-3 border-t border-tf-stone-200 pt-4">
                <label className="block text-sm font-semibold text-tf-ink">
                  Reason
                  <select
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-tf-stone-300 bg-tf-raised px-3 text-sm text-tf-ink outline-none focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25"
                  >
                    <option value="MISLEADING">Misleading information</option>
                    <option value="SCAM_OR_FRAUD">Scam or fraud concern</option>
                    <option value="PROHIBITED_ITEM">Prohibited item</option>
                    <option value="COPYRIGHT_OR_TRADEMARK">
                      Copyright or trademark concern
                    </option>
                    <option value="PRIVACY">Privacy concern</option>
                    <option value="SPAM">Spam</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label className="block text-sm font-semibold text-tf-ink">
                  Details <span className="font-normal text-tf-stone-500">(optional)</span>
                  <textarea
                    value={reportDetails}
                    onChange={(event) => setReportDetails(event.target.value)}
                    maxLength={1_000}
                    rows={3}
                    placeholder="Explain what TradeFeed should review. Do not include passwords or payment details."
                    className="mt-1.5 w-full resize-none rounded-xl border border-tf-stone-300 bg-tf-raised px-3 py-2.5 text-sm text-tf-ink outline-none focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25"
                  />
                </label>
                <TfButton
                  type="button"
                  onClick={() => void submitReport()}
                  disabled={reporting}
                >
                  {reporting ? "Sending..." : "Send private report"}
                </TfButton>
              </div>
            )}
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
