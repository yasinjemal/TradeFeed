// ============================================================
// Component — Shop Hero Section
// ============================================================
// Trust-first hero for the seller shop page. Above-the-fold.
// Shows banner, avatar, name, verification, stats, and CTA.
// Design: Instagram profile meets Takealot store credibility.
// ============================================================

import Image from "next/image";
import { SHIMMER_DARK } from "@/lib/image-placeholder";

interface ShopHeroProps {
  shop: {
    name: string;
    description: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    city: string | null;
    province: string | null;
    isVerified: boolean;
    whatsappNumber: string;
    createdAt: Date;
    avgRating: number;
    subscription?: { status: string; plan: { slug: string; name: string } } | null;
    _count: { products: number; orders: number; reviews: number };
    businessHours: string | null;
  };
  tierBadge?: {
    emoji: string;
    label: string;
    key: string;
    bgColor?: string;
    textColor?: string;
    borderColor?: string;
    description?: string;
  } | null;
}

export function ShopHero({ shop, tierBadge }: ShopHeroProps) {
  const isPro =
    shop.subscription?.status === "ACTIVE" &&
    shop.subscription.plan.slug !== "free";

  const location = [shop.city, shop.province].filter(Boolean).join(", ");

  const memberSince = shop.createdAt.toLocaleDateString("en-ZA", {
    month: "short",
    year: "numeric",
  });

  // Check if open now
  let isOpenNow = false;
  if (shop.businessHours) {
    try {
      const hours = JSON.parse(shop.businessHours) as Record<string, string | undefined>;
      const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const now = new Date();
      const todayKey = dayMap[now.getDay()];
      const todayHours = todayKey ? hours[todayKey] : undefined;
      if (todayHours && todayHours !== "Closed") {
        const [open, close] = todayHours.split(" - ");
        if (open && close) {
          const toMin = (t: string) => {
            const [h, m] = t.split(":").map(Number);
            return (h ?? 0) * 60 + (m ?? 0);
          };
          const nowMin = now.getHours() * 60 + now.getMinutes();
          isOpenNow = nowMin >= toMin(open) && nowMin <= toMin(close);
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-sm">
      {/* ── Banner ─────────────────────────────────────── */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700">
        {shop.bannerUrl ? (
          <Image
            src={shop.bannerUrl}
            alt={`${shop.name} banner`}
            fill
            placeholder="blur"
            blurDataURL={SHIMMER_DARK}
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 640px"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700" />
        )}
        {/* Overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Active status pill */}
        {isOpenNow && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-slate-700">Open now</span>
          </div>
        )}
      </div>

      {/* ── Profile Info ──────────────────────────────── */}
      <div className="relative px-4 -mt-12 pb-4">
        {/* Avatar */}
        <div className="flex items-end gap-3">
          <div
            className={`relative h-20 w-20 flex-shrink-0 rounded-2xl border-[3px] border-white shadow-lg overflow-hidden ${
              isPro
                ? "ring-2 ring-amber-400/60"
                : shop.isVerified
                  ? "ring-2 ring-emerald-400/60"
                  : ""
            }`}
          >
            {shop.logoUrl ? (
              <Image
                src={shop.logoUrl}
                alt={shop.name}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className={`flex h-full w-full items-center justify-center ${
                  isPro
                    ? "bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600"
                    : "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600"
                }`}
              >
                <span className="text-2xl font-black text-white drop-shadow-sm">
                  {shop.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Verification badge on avatar */}
            {(shop.isVerified || isPro) && (
              <div
                className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-sm ${
                  isPro
                    ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                    : "bg-emerald-500"
                }`}
              >
                {isPro ? (
                  <span className="text-[10px] font-black text-white">★</span>
                ) : (
                  <svg
                    className="h-3 w-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            )}
          </div>

          {/* WhatsApp CTA — prominent, right-aligned */}
          <div className="ml-auto mb-1">
            <a
              href={`https://wa.me/${shop.whatsappNumber.replace("+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200/40 transition-all hover:bg-[#20bd5a] hover:shadow-lg active:scale-[0.97]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 fill-current"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contact
            </a>
          </div>
        </div>

        {/* Name + badges */}
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {shop.name}
            </h2>
            {shop.isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200/60">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified
              </span>
            )}
            {isPro && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                ★ PRO
              </span>
            )}
            {tierBadge && tierBadge.key !== "new" && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm border ${tierBadge.bgColor || "bg-slate-100"} ${tierBadge.textColor || "text-slate-700"} ${tierBadge.borderColor || "border-slate-200"}`}
              >
                {tierBadge.emoji} {tierBadge.label}
              </span>
            )}
          </div>

          {/* Description */}
          {shop.description && (
            <p className="mt-1.5 text-sm text-slate-500 line-clamp-2 leading-relaxed">
              {shop.description}
            </p>
          )}

          {/* Location */}
          {location && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                />
              </svg>
              {location}
            </p>
          )}
        </div>

        {/* ── Stats row ─────────────────────────────────── */}
        <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3">
          <StatItem value={shop._count.products} label="Products" />
          {shop._count.orders > 0 && (
            <StatItem
              value={shop._count.orders}
              label="Fulfilled"
              accent
            />
          )}
          {shop.avgRating > 0 && (
            <StatItem
              value={`${shop.avgRating.toFixed(1)} ★`}
              label={`${shop._count.reviews} review${shop._count.reviews !== 1 ? "s" : ""}`}
            />
          )}
          <StatItem value={memberSince} label="Member since" />
        </div>
      </div>
    </div>
  );
}

function StatItem({
  value,
  label,
  accent,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p
        className={`text-sm font-bold tabular-nums ${
          accent ? "text-emerald-600" : "text-slate-800"
        }`}
      >
        {value}
      </p>
      <p className="text-[11px] text-slate-400 truncate">{label}</p>
    </div>
  );
}
