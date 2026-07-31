"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  closeHuntAdminAction,
  dismissHuntReportAdminAction,
  markHuntFulfilledAdminAction,
  publishHuntOfferAction,
  routeHuntToSellerAction,
  saveHuntSellerPreferenceAction,
  takeDownHuntAdminAction,
  updateHuntSellerRouteStatusAction,
  withdrawHuntOfferAdminAction,
  type AdminHuntActionResult,
} from "@/app/actions/admin-hunts";

type HuntStatus = "LIVE" | "FOUND" | "CLOSED" | "REJECTED" | "EXPIRED";
type RouteStatus =
  | "ROUTED"
  | "CONTACTED"
  | "RESPONDED"
  | "DECLINED"
  | "CANCELLED";
const CURRENT_SELLER_CONSENT_SOURCE =
  "ADMIN_CONFIRMED_ANON_OFFER_PUBLICATION";

export interface AdminHuntQueueItem {
  id: string;
  slug: string;
  status: HuntStatus;
  moderationStatus: string;
  fulfillmentStatus: string;
  publicTitle: string;
  publicDescription: string;
  publicImageUrl: string;
  publicImageKey: string | null;
  category: string | null;
  desiredVariant: string | null;
  desiredColor: string | null;
  matchPreference: string;
  maxBudgetCents: number | null;
  city: string;
  province: string | null;
  publishedAt: Date;
  expiresAt: Date;
  resolvedAt: Date | null;
  handoffAt: Date | null;
  fulfilledAt: Date | null;
  selectedOfferId: string | null;
  privateData: {
    buyerName: string | null;
    whatsappNumber: string;
    rawRequestText: string;
    purgeAfter: Date;
    huntUpdatesConsentAt: Date;
  } | null;
  offers: Array<{
    id: string;
    shopId: string;
    status: string;
    matchType: string;
    publicProductName: string;
    publicDescription: string | null;
    publicVariant: string | null;
    publicDeliveryEstimate: string;
    publicProofUrl: string | null;
    publicProofCapturedAt: Date | null;
    priceCents: number;
    quantityAvailable: number | null;
    publicSellerNameSnapshot: string;
    publicSellerVerifiedSnapshot: boolean;
    sellerWhatsappSnapshot: string | null;
    publishedAt: Date | null;
  }>;
  sellerRoutes: Array<{
    id: string;
    shopId: string;
    status: RouteStatus;
    note: string | null;
    routedAt: Date;
    contactedAt: Date | null;
    respondedAt: Date | null;
    shop: {
      name: string;
      slug: string;
      whatsappNumber: string | null;
      isVerified: boolean;
    };
  }>;
  reports: Array<{
    id: string;
    reason: string;
    details: string | null;
    status: string;
    createdAt: Date;
  }>;
  _count: {
    participants: number;
    offers: number;
    reports: number;
  };
}

export interface AdminHuntSeller {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  province: string | null;
  whatsappNumber: string | null;
  isVerified: boolean;
  logoUrl: string | null;
  huntSellerPreference: {
    isOptedIn: boolean;
    cities: string[];
    categories: string[];
    consentedAt: Date | null;
    consentSource: string | null;
    consentedBy: string | null;
    pausedAt: Date | null;
  } | null;
}

interface Props {
  hunts: AdminHuntQueueItem[];
  sellers: AdminHuntSeller[];
}

type Feedback = {
  type: "success" | "error";
  text: string;
  whatsappUrl?: string;
};

const inputClass =
  "w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

function feedbackFrom(result: AdminHuntActionResult): Feedback {
  return result.success
    ? {
        type: "success",
        text: result.message,
        whatsappUrl: result.whatsappUrl,
      }
    : { type: "error", text: result.error };
}

function splitTags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );
}

function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRand(cents: number | null): string {
  if (cents == null) return "No public budget";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function statusClass(status: string): string {
  if (status === "LIVE" || status === "PUBLISHED" || status === "FULFILLED") {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
  }
  if (status === "FOUND" || status === "HANDOFF_SENT") {
    return "border-cyan-500/25 bg-cyan-500/10 text-cyan-300";
  }
  if (status === "REJECTED" || status === "DECLINED") {
    return "border-red-500/25 bg-red-500/10 text-red-300";
  }
  if (status === "ROUTED" || status === "CONTACTED") {
    return "border-amber-500/25 bg-amber-500/10 text-amber-300";
  }
  return "border-stone-600 bg-stone-800 text-stone-300";
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClass(
        String(children),
      )}`}
    >
      {children}
    </span>
  );
}

function FeedbackBanner({ feedback }: { feedback: Feedback | null }) {
  if (!feedback) return null;
  return (
    <div
      role="status"
      className={`rounded-xl border px-4 py-3 text-sm ${
        feedback.type === "success"
          ? "border-emerald-700 bg-emerald-950/40 text-emerald-200"
          : "border-red-700 bg-red-950/40 text-red-200"
      }`}
    >
      <p>{feedback.text}</p>
      {feedback.whatsappUrl && (
        <a
          href={feedback.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-10 items-center rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-stone-950 hover:bg-[#40df7a]"
        >
          Review message and open WhatsApp
        </a>
      )}
    </div>
  );
}

function SellerPreferenceRow({ seller }: { seller: AdminHuntSeller }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [cities, setCities] = useState(
    seller.huntSellerPreference?.cities.join(", ") ?? seller.city ?? "",
  );
  const [categories, setCategories] = useState(
    seller.huntSellerPreference?.categories.join(", ") ?? "",
  );
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const routingEnabled = Boolean(
    seller.huntSellerPreference?.isOptedIn &&
      !seller.huntSellerPreference.pausedAt,
  );
  const hasCurrentConsent =
    routingEnabled &&
    seller.huntSellerPreference?.consentSource ===
      CURRENT_SELLER_CONSENT_SOURCE;
  const optedIn = hasCurrentConsent;
  const needsConsentRefresh = routingEnabled && !hasCurrentConsent;

  const save = (nextOptedIn: boolean) => {
    const consentConfirmed =
      !nextOptedIn ||
      hasCurrentConsent ||
      window.confirm(
        "Confirm this seller explicitly agreed to receive relevant TradeFeed HUNT requests and to let TradeFeed publish seller-approved offer details anonymously. Their name, logo, WhatsApp number and proof media remain private.",
      );
    if (!consentConfirmed) return;

    setFeedback(null);
    startTransition(async () => {
      const result = await saveHuntSellerPreferenceAction(
        {
          shopId: seller.id,
          isOptedIn: nextOptedIn,
          cities: splitTags(cities),
          categories: splitTags(categories),
        },
        nextOptedIn ? consentConfirmed : false,
      );
      setFeedback(feedbackFrom(result));
      if (result.success) {
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/catalog/${seller.slug}`}
              target="_blank"
              className="truncate text-sm font-semibold text-white hover:text-emerald-300"
            >
              {seller.name}
            </Link>
            {seller.isVerified && (
              <span className="text-[10px] font-semibold text-emerald-400">
                VERIFIED
              </span>
            )}
            <Badge>{optedIn ? "LIVE" : "PAUSED"}</Badge>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            {[seller.city, seller.province].filter(Boolean).join(", ") ||
              "No shop location"}
            {" · "}
            {seller.whatsappNumber ? "WhatsApp ready" : "No WhatsApp number"}
          </p>
          {optedIn && seller.huntSellerPreference?.consentedAt && (
            <p className="mt-1 text-[11px] text-emerald-400/75">
              Consent {seller.huntSellerPreference.consentSource ===
              CURRENT_SELLER_CONSENT_SOURCE
                ? "operator-confirmed"
                : "recorded"}{" "}
              {formatDate(seller.huntSellerPreference.consentedAt)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsEditing((value) => !value)}
            className={`${buttonClass} bg-stone-800 text-stone-200 hover:bg-stone-700`}
          >
            {isEditing ? "Cancel" : "Coverage"}
          </button>
          <button
            type="button"
            disabled={isPending || (!seller.whatsappNumber && !optedIn)}
            onClick={() => save(!optedIn)}
            className={`${buttonClass} ${
              optedIn
                ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                : "bg-emerald-600 text-white hover:bg-emerald-500"
            }`}
          >
            {isPending
              ? "Saving…"
              : optedIn
                ? "Pause routing"
                : needsConsentRefresh
                  ? "Update consent"
                  : "Opt in"}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 grid gap-3 border-t border-stone-800 pt-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-stone-400">
            Cities (comma-separated; empty means all pilot cities)
            <input
              value={cities}
              onChange={(event) => setCities(event.target.value)}
              className={`${inputClass} mt-1.5`}
              placeholder="Johannesburg, Soweto"
            />
          </label>
          <label className="text-xs font-medium text-stone-400">
            Categories (empty means all)
            <input
              value={categories}
              onChange={(event) => setCategories(event.target.value)}
              className={`${inputClass} mt-1.5`}
              placeholder="Sneakers, Women's fashion"
            />
          </label>
          <button
            type="button"
            disabled={isPending}
            onClick={() => save(optedIn)}
            className={`${buttonClass} bg-emerald-600 text-white hover:bg-emerald-500 sm:col-span-2 sm:w-fit`}
          >
            Save coverage
          </button>
        </div>
      )}
      <div className="mt-3">
        <FeedbackBanner feedback={feedback} />
      </div>
    </div>
  );
}

function SellerRoster({ sellers }: { sellers: AdminHuntSeller[] }) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matches = normalized
      ? sellers.filter((seller) =>
          [seller.name, seller.slug, seller.city, seller.province]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(normalized)),
        )
      : sellers;
    return showAll || normalized ? matches : matches.slice(0, 8);
  }, [query, sellers, showAll]);
  const optedInCount = sellers.filter(
    (seller) =>
      seller.huntSellerPreference?.isOptedIn &&
      !seller.huntSellerPreference.pausedAt &&
      seller.huntSellerPreference.consentSource ===
        CURRENT_SELLER_CONSENT_SOURCE,
  ).length;

  return (
    <details className="rounded-2xl border border-stone-800 bg-stone-900/70">
      <summary className="cursor-pointer list-none px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">
              Seller routing & anonymous-offer consent
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              {optedInCount} of {sellers.length} active sellers opted in.
              TradeFeed never messages them automatically and never publishes
              their identity in Beta rooms.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-400">
            Manage sellers
          </span>
        </div>
      </summary>
      <div className="space-y-3 border-t border-stone-800 p-4 sm:p-5">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={inputClass}
          placeholder="Search active sellers by name, slug or city"
          aria-label="Search HUNT sellers"
        />
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-500">
            No active seller matches this search.
          </p>
        ) : (
          visible.map((seller) => (
            <SellerPreferenceRow key={seller.id} seller={seller} />
          ))
        )}
        {!query && sellers.length > 8 && (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className={`${buttonClass} w-full bg-stone-800 text-stone-300 hover:bg-stone-700`}
          >
            {showAll ? "Show fewer sellers" : `Show all ${sellers.length} sellers`}
          </button>
        )}
      </div>
    </details>
  );
}

function OfferComposer({
  hunt,
  routedSellers,
}: {
  hunt: AdminHuntQueueItem;
  routedSellers: AdminHuntQueueItem["sellerRoutes"];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const eligibleRoutes = routedSellers.filter(
    (route) => !["DECLINED", "CANCELLED"].includes(route.status),
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const sellerPublicationConfirmed =
      data.get("sellerPublicationConfirmed") === "on";

    startTransition(async () => {
      const result = await publishHuntOfferAction(
        {
          huntId: hunt.id,
          shopId: String(data.get("shopId") ?? ""),
          matchType: String(data.get("matchType") ?? ""),
          publicProductName: String(data.get("publicProductName") ?? ""),
          publicDescription: String(data.get("publicDescription") ?? ""),
          publicVariant: String(data.get("publicVariant") ?? ""),
          publicDeliveryEstimate: String(
            data.get("publicDeliveryEstimate") ?? "",
          ),
          priceCents: String(data.get("priceCents") ?? ""),
          quantityAvailable: String(data.get("quantityAvailable") ?? ""),
        },
        sellerPublicationConfirmed,
      );
      setFeedback(feedbackFrom(result));
      if (result.success) {
        form.reset();
        router.refresh();
      }
    });
  };

  return (
    <details className="rounded-xl border border-stone-800 bg-stone-950/50">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-stone-200">
        Publish a genuine seller offer
      </summary>
      <div className="border-t border-stone-800 p-4">
        {eligibleRoutes.length === 0 ? (
          <p className="text-sm text-amber-300">
            Route this Hunt to an opted-in seller before publishing an offer.
          </p>
        ) : (
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-stone-400">
              Routed seller
              <select name="shopId" required className={`${inputClass} mt-1.5`}>
                <option value="">Choose seller</option>
                {eligibleRoutes.map((route) => (
                  <option key={route.shopId} value={route.shopId}>
                    {route.shop.name} · {route.status.toLowerCase()}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-stone-400">
              Match quality
              <select
                name="matchType"
                defaultValue="EXACT"
                className={`${inputClass} mt-1.5`}
              >
                <option value="EXACT">Exact match</option>
                <option value="SIMILAR">Similar item</option>
                <option value="UNCERTAIN">Uncertain match</option>
              </select>
            </label>
            <label className="text-xs font-medium text-stone-400">
              Public product name
              <input
                name="publicProductName"
                required
                minLength={2}
                maxLength={140}
                className={`${inputClass} mt-1.5`}
                placeholder="Brown knit polo"
              />
            </label>
            <label className="text-xs font-medium text-stone-400">
              Price (rand)
              <input
                name="priceCents"
                required
                inputMode="decimal"
                pattern="\d{1,6}(?:\.\d{1,2})?"
                className={`${inputClass} mt-1.5`}
                placeholder="650"
              />
            </label>
            <label className="text-xs font-medium text-stone-400">
              Offered size / variant
              <input
                name="publicVariant"
                maxLength={120}
                className={`${inputClass} mt-1.5`}
                placeholder={hunt.desiredVariant ?? "Medium, Brown"}
              />
            </label>
            <label className="text-xs font-medium text-stone-400">
              Quantity genuinely available
              <input
                name="quantityAvailable"
                type="number"
                min={1}
                max={100000}
                className={`${inputClass} mt-1.5`}
                placeholder="1"
              />
            </label>
            <label className="text-xs font-medium text-stone-400 sm:col-span-2">
              Delivery / collection timing
              <input
                name="publicDeliveryEstimate"
                required
                minLength={2}
                maxLength={160}
                className={`${inputClass} mt-1.5`}
                placeholder="Collection in Johannesburg today, or delivery in 1–2 days"
              />
            </label>
            <label className="text-xs font-medium text-stone-400 sm:col-span-2">
              Public offer details
              <textarea
                name="publicDescription"
                rows={2}
                maxLength={500}
                className={`${inputClass} mt-1.5 resize-y`}
                placeholder="Only state details the seller supplied and you verified."
              />
            </label>
            <label className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-100 sm:col-span-2">
              <input
                name="sellerPublicationConfirmed"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-stone-600 accent-emerald-500"
              />
              <span>
                I received these current-stock details from the seller, and the
                seller approved publishing this product, price, variant,
                quantity and delivery information anonymously. Their name,
                logo, WhatsApp number and proof media will remain private.
              </span>
            </label>
            <button
              type="submit"
              disabled={isPending}
              className={`${buttonClass} bg-emerald-600 text-white hover:bg-emerald-500 sm:col-span-2 sm:w-fit`}
            >
              {isPending ? "Publishing…" : "Publish genuine offer"}
            </button>
          </form>
        )}
        <div className="mt-3">
          <FeedbackBanner feedback={feedback} />
        </div>
      </div>
    </details>
  );
}

function HuntCard({
  hunt,
  sellers,
}: {
  hunt: AdminHuntQueueItem;
  sellers: AdminHuntSeller[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [routeNote, setRouteNote] = useState("");
  const [closeReason, setCloseReason] = useState("");
  const [takedownReason, setTakedownReason] = useState("");
  const [selectedReportId, setSelectedReportId] = useState(
    hunt.reports[0]?.id ?? "",
  );
  const [fulfillmentConfirmed, setFulfillmentConfirmed] = useState(false);

  const optedInSellers = sellers.filter((seller) => {
    const preference = seller.huntSellerPreference;
    if (
      !seller.whatsappNumber ||
      !preference?.isOptedIn ||
      preference.pausedAt ||
      !preference.consentedAt ||
      preference.consentSource !== CURRENT_SELLER_CONSENT_SOURCE
    ) {
      return false;
    }
    const cityMatches =
      preference.cities.length === 0 ||
      preference.cities.some(
        (city) => city.toLowerCase() === hunt.city.toLowerCase(),
      );
    const categoryMatches =
      preference.categories.length === 0 ||
      (hunt.category != null &&
        preference.categories.some(
          (category) =>
            category.toLowerCase() === hunt.category?.toLowerCase(),
        ));
    return cityMatches && categoryMatches;
  });

  const run = (
    task: () => Promise<AdminHuntActionResult>,
    options?: { refresh?: boolean },
  ) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await task();
      setFeedback(feedbackFrom(result));
      if (result.success && options?.refresh !== false) {
        router.refresh();
      }
    });
  };

  const routeSeller = () => {
    run(() =>
      routeHuntToSellerAction({
        huntId: hunt.id,
        shopId: selectedShopId,
        note: routeNote,
      }),
    );
  };

  const phone = hunt.privateData?.whatsappNumber.replace(/\D/g, "") ?? "";

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900/75">
      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[160px_minmax(0,1fr)]">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-stone-950 lg:aspect-auto lg:min-h-40">
          <Image
            src={hunt.publicImageUrl}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 160px"
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{hunt.status}</Badge>
                <Badge>{hunt.fulfillmentStatus}</Badge>
                {hunt.moderationStatus !== "APPROVED" && (
                  <Badge>{hunt.moderationStatus}</Badge>
                )}
              </div>
              <h2 className="mt-2 text-lg font-bold text-white">
                {hunt.publicTitle}
              </h2>
              <p className="mt-1 text-sm leading-6 text-stone-400">
                {hunt.publicDescription}
              </p>
            </div>
            <Link
              href={`/hunt/${hunt.slug}`}
              target="_blank"
              className={`${buttonClass} border border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700`}
            >
              Open public Hunt
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-500">
            <span>{[hunt.city, hunt.province].filter(Boolean).join(", ")}</span>
            <span>{formatRand(hunt.maxBudgetCents)}</span>
            {hunt.desiredVariant && <span>Variant: {hunt.desiredVariant}</span>}
            {hunt.desiredColor && <span>Colour: {hunt.desiredColor}</span>}
            <span>{hunt.matchPreference.replaceAll("_", " ")}</span>
            <span>Expires {formatDate(hunt.expiresAt)}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-stone-500">
            <span className="rounded-full bg-stone-800 px-2.5 py-1">
              {hunt._count.participants} interested
            </span>
            <span className="rounded-full bg-stone-800 px-2.5 py-1">
              {hunt._count.offers} offers
            </span>
            <span className="rounded-full bg-stone-800 px-2.5 py-1">
              {hunt._count.reports} reports
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-5 border-t border-stone-800 p-4 sm:p-5">
        <section className="rounded-xl border border-red-500/25 bg-red-950/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-300">
                Private buyer operations data
              </h3>
              <p className="mt-1 text-xs text-red-200/65">
                POPIA-sensitive. Use only to operate this Hunt. Do not copy it
                into public offers, screenshots or analytics.
              </p>
            </div>
            {phone && (
              <a
                href={`https://wa.me/${phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonClass} bg-[#25D366] text-stone-950 hover:bg-[#40df7a]`}
              >
                Contact buyer on WhatsApp
              </a>
            )}
          </div>
          {hunt.privateData ? (
            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-red-200/55">Buyer</dt>
                <dd className="mt-1 break-all text-stone-200">
                  {hunt.privateData.buyerName || "Name not supplied"} ·{" "}
                  {hunt.privateData.whatsappNumber}
                </dd>
              </div>
              <div>
                <dt className="text-red-200/55">Scheduled PII purge</dt>
                <dd className="mt-1 text-stone-200">
                  {formatDate(hunt.privateData.purgeAfter)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-red-200/55">Raw buyer request</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-stone-950/70 p-3 text-stone-200">
                  {hunt.privateData.rawRequestText}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-xs text-stone-500">
              Buyer private data has already been purged.
            </p>
          )}
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-bold text-white">Seller routing</h3>
            <p className="mt-1 text-xs text-stone-500">
              Only opted-in sellers appear. Saving creates a route; you must
              review and send the returned WhatsApp message yourself.
            </p>
          </div>
          {hunt.status === "LIVE" && (
            <div className="grid gap-3 rounded-xl border border-stone-800 bg-stone-950/50 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <select
                value={selectedShopId}
                onChange={(event) => setSelectedShopId(event.target.value)}
                className={inputClass}
                aria-label="Choose opted-in seller"
              >
                <option value="">Choose opted-in seller</option>
                {optedInSellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                    {seller.isVerified ? " · verified" : ""}
                    {seller.city ? ` · ${seller.city}` : ""}
                  </option>
                ))}
              </select>
              <input
                value={routeNote}
                onChange={(event) => setRouteNote(event.target.value)}
                maxLength={500}
                className={inputClass}
                placeholder="Internal route note (optional)"
              />
              <button
                type="button"
                disabled={isPending || !selectedShopId}
                onClick={routeSeller}
                className={`${buttonClass} bg-emerald-600 text-white hover:bg-emerald-500`}
              >
                {isPending ? "Saving…" : "Create route"}
              </button>
            </div>
          )}
          {hunt.sellerRoutes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-800 p-4 text-sm text-stone-500">
              No sellers routed yet.
            </p>
          ) : (
            <div className="space-y-2">
              {hunt.sellerRoutes.map((route) => (
                <div
                  key={route.id}
                  className="flex flex-col gap-3 rounded-xl border border-stone-800 bg-stone-950/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/catalog/${route.shop.slug}`}
                        target="_blank"
                        className="truncate text-sm font-semibold text-stone-200 hover:text-emerald-300"
                      >
                        {route.shop.name}
                      </Link>
                      <Badge>{route.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-stone-600">
                      Routed {formatDate(route.routedAt)}
                      {route.note ? ` · ${route.note}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "CONTACTED",
                        "RESPONDED",
                        "DECLINED",
                        "CANCELLED",
                      ] as const
                    ).map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={isPending || route.status === status}
                          onClick={() =>
                            run(() =>
                              updateHuntSellerRouteStatusAction({
                                routeId: route.id,
                                status,
                              }),
                            )
                          }
                          className={`${buttonClass} bg-stone-800 text-stone-300 hover:bg-stone-700`}
                        >
                          {status.toLowerCase()}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {hunt.status === "LIVE" && (
          <OfferComposer hunt={hunt} routedSellers={hunt.sellerRoutes} />
        )}

        <section>
          <h3 className="text-sm font-bold text-white">Published offers</h3>
          {hunt.offers.length === 0 ? (
            <p className="mt-2 rounded-xl border border-dashed border-stone-800 p-4 text-sm text-stone-500">
              No offer has been published.
            </p>
          ) : (
            <div className="mt-2 grid gap-3 lg:grid-cols-2">
              {hunt.offers.map((offer) => (
                <div
                  key={offer.id}
                  className={`rounded-xl border p-4 ${
                    hunt.selectedOfferId === offer.id
                      ? "border-emerald-500/40 bg-emerald-950/20"
                      : "border-stone-800 bg-stone-950/50"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {offer.publicProductName}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {offer.publicSellerNameSnapshot}
                        {offer.publicSellerVerifiedSnapshot ? " · verified" : ""}
                      </p>
                    </div>
                    <p className="text-base font-bold text-emerald-300">
                      {formatRand(offer.priceCents)}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{offer.status}</Badge>
                    <Badge>{offer.matchType}</Badge>
                    {hunt.selectedOfferId === offer.id && (
                      <Badge>SELECTED</Badge>
                    )}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-stone-400">
                    {offer.publicVariant
                      ? `${offer.publicVariant} · `
                      : ""}
                    {offer.publicDeliveryEstimate}
                  </p>
                  {offer.publicDescription && (
                    <p className="mt-2 text-xs leading-5 text-stone-500">
                      {offer.publicDescription}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    {offer.publicProofUrl && (
                      <a
                        href={offer.publicProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-300 underline decoration-cyan-500/40 underline-offset-2"
                      >
                        View proof
                      </a>
                    )}
                    {offer.sellerWhatsappSnapshot && (
                      <a
                        href={`https://wa.me/${offer.sellerWhatsappSnapshot.replace(
                          /\D/g,
                          "",
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-300 underline decoration-emerald-500/40 underline-offset-2"
                      >
                        Seller WhatsApp (private)
                      </a>
                    )}
                    {offer.status === "PUBLISHED" &&
                      hunt.selectedOfferId !== offer.id && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => {
                            const reason = window.prompt(
                              "Why is this offer being withdrawn? This is stored in the admin audit log.",
                            );
                            if (!reason?.trim()) return;
                            run(() =>
                              withdrawHuntOfferAdminAction({
                                offerId: offer.id,
                                reason,
                              }),
                            );
                          }}
                          className="text-red-300 underline decoration-red-500/40 underline-offset-2"
                        >
                          Withdraw offer
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {hunt.reports.length > 0 && (
          <section className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-4">
            <h3 className="text-sm font-bold text-amber-200">
              Open safety reports
            </h3>
            <div className="mt-3 space-y-2">
              {hunt.reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-lg border border-amber-500/15 bg-stone-950/50 p-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-amber-300">
                      {report.reason.replaceAll("_", " ")}
                    </span>
                    <span className="text-stone-600">
                      {formatDate(report.createdAt)}
                    </span>
                  </div>
                  {report.details && (
                    <p className="mt-2 whitespace-pre-wrap break-words text-stone-400">
                      {report.details}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      const resolutionNote = window.prompt(
                        "Why can this report be dismissed? Record the evidence reviewed.",
                      );
                      if (!resolutionNote?.trim()) return;
                      run(() =>
                        dismissHuntReportAdminAction({
                          reportId: report.id,
                          resolutionNote,
                        }),
                      );
                    }}
                    className="mt-3 inline-flex min-h-10 items-center text-xs font-semibold text-amber-200 underline decoration-amber-500/40 underline-offset-2"
                  >
                    Dismiss with review note
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-xl border border-stone-800 bg-stone-950/50 p-4">
          <h3 className="text-sm font-bold text-white">Operator controls</h3>
          <p className="mt-1 text-xs text-stone-500">
            Closing preserves the public record. Takedown immediately hides a
            harmful request. Fulfilment requires buyer or seller confirmation
            after a selected-offer WhatsApp handoff.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="space-y-2 rounded-xl border border-stone-800 p-3">
              <p className="text-xs font-semibold text-stone-300">Close Hunt</p>
              <input
                value={closeReason}
                onChange={(event) => setCloseReason(event.target.value)}
                maxLength={500}
                className={inputClass}
                placeholder="Internal reason (optional)"
              />
              <button
                type="button"
                disabled={
                  isPending ||
                  !["LIVE", "FOUND"].includes(hunt.status)
                }
                onClick={() =>
                  run(() =>
                    closeHuntAdminAction({
                      huntId: hunt.id,
                      reason: closeReason,
                    }),
                  )
                }
                className={`${buttonClass} w-full bg-stone-800 text-stone-200 hover:bg-stone-700`}
              >
                Close without takedown
              </button>
            </div>

            <div className="space-y-2 rounded-xl border border-red-500/20 p-3">
              <p className="text-xs font-semibold text-red-300">
                Safety takedown
              </p>
              {hunt.reports.length > 0 && (
                <select
                  value={selectedReportId}
                  onChange={(event) => setSelectedReportId(event.target.value)}
                  className={inputClass}
                  aria-label="Linked safety report"
                >
                  <option value="">No linked report</option>
                  {hunt.reports.map((report) => (
                    <option key={report.id} value={report.id}>
                      {report.reason.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              )}
              <textarea
                value={takedownReason}
                onChange={(event) => setTakedownReason(event.target.value)}
                rows={2}
                maxLength={500}
                className={`${inputClass} resize-y`}
                placeholder="Required evidence-based reason"
              />
              <button
                type="button"
                disabled={
                  isPending ||
                  takedownReason.trim().length < 3 ||
                  hunt.status === "REJECTED"
                }
                onClick={() =>
                  run(() =>
                    takeDownHuntAdminAction({
                      huntId: hunt.id,
                      reportId: selectedReportId || undefined,
                      reason: takedownReason,
                    }),
                  )
                }
                className={`${buttonClass} w-full bg-red-600 text-white hover:bg-red-500`}
              >
                Take down now
              </button>
            </div>

            <div className="space-y-2 rounded-xl border border-emerald-500/20 p-3">
              <p className="text-xs font-semibold text-emerald-300">
                Confirm fulfilment
              </p>
              <label className="flex items-start gap-2 text-xs leading-5 text-stone-400">
                <input
                  type="checkbox"
                  checked={fulfillmentConfirmed}
                  onChange={(event) =>
                    setFulfillmentConfirmed(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 accent-emerald-500"
                />
                Buyer or seller confirmed the selected offer was fulfilled.
              </label>
              <button
                type="button"
                disabled={
                  isPending ||
                  !hunt.selectedOfferId ||
                  hunt.fulfillmentStatus === "FULFILLED" ||
                  !fulfillmentConfirmed
                }
                onClick={() =>
                  run(() =>
                    markHuntFulfilledAdminAction(
                      {
                        huntId: hunt.id,
                      },
                      fulfillmentConfirmed,
                    ),
                  )
                }
                className={`${buttonClass} w-full bg-emerald-600 text-white hover:bg-emerald-500`}
              >
                Mark fulfilled
              </button>
            </div>
          </div>
        </section>

        <FeedbackBanner feedback={feedback} />
      </div>
    </article>
  );
}

export function AdminHuntQueue({ hunts, sellers }: Props) {
  const [filter, setFilter] = useState<HuntStatus | "ALL">("LIVE");
  const filtered =
    filter === "ALL" ? hunts : hunts.filter((hunt) => hunt.status === filter);
  const statuses: Array<HuntStatus | "ALL"> = [
    "LIVE",
    "FOUND",
    "CLOSED",
    "EXPIRED",
    "REJECTED",
    "ALL",
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-red-500/30 bg-red-950/25 p-4 text-sm text-red-100">
        <p className="font-bold">Private operations workspace</p>
        <p className="mt-1 leading-6 text-red-100/70">
          Buyer phone numbers and raw requests are shown only so the concierge
          can fulfil a Hunt. Never paste them into public listings, seller
          broadcasts, screenshots, reports or analytics. Access and every
          mutation are admin-audited.
        </p>
      </div>

      <SellerRoster sellers={sellers} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statuses.map((status) => {
            const count =
              status === "ALL"
                ? hunts.length
                : hunts.filter((hunt) => hunt.status === status).length;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`${buttonClass} whitespace-nowrap ${
                  filter === status
                    ? "bg-emerald-600 text-white"
                    : "bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white"
                }`}
              >
                {status.toLowerCase()} · {count}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-stone-600">
          Showing up to 50 newest operational records
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-800 py-14 text-center">
          <p className="text-sm text-stone-500">
            No {filter.toLowerCase()} Hunts in this queue.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((hunt) => (
            <HuntCard key={hunt.id} hunt={hunt} sellers={sellers} />
          ))}
        </div>
      )}
    </div>
  );
}
