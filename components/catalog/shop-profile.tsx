// ============================================================
// Component — Luxury VIP Shop Profile Section
// ============================================================
// Premium, high-end design for the public catalog page.
// Features animated luxury frames based on subscription tier,
// verified badges, profile pictures, and VIP aesthetics.
// ============================================================

"use client";

import { useState } from "react";
import Image from "next/image";
import type { BusinessHours, DayKey } from "@/lib/validation/shop-settings";
import { DAY_LABELS, DAYS_OF_WEEK } from "@/lib/validation/shop-settings";

interface ShopProfileProps {
  shop: {
    name: string;
    description: string | null;
    aboutText: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    latitude: number | null;
    longitude: number | null;
    businessHours: string | null;
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
    website: string | null;
    whatsappGroupLink: string | null;
    isVerified: boolean;
    whatsappNumber: string;
    retailWhatsappNumber: string | null;
    createdAt: Date;
    avgRating: number;
    subscription?: { status: string; plan: { slug: string; name: string } } | null;
    gallery?: { id: string; url: string; type: string; caption: string | null; position: number }[];
    _count: { products: number; orders: number; reviews: number };
  };
  /** Seller reputation tier data (optional) */
  tierBadge?: { emoji: string; label: string; key: string; bgColor?: string; textColor?: string; borderColor?: string; description?: string } | null;
}

// ── Determine the "luxury tier" for frame styling ───────────
type LuxuryTier = "standard" | "verified" | "pro" | "elite";

function getLuxuryTier(shop: ShopProfileProps["shop"], tierKey?: string): LuxuryTier {
  const isPro = shop.subscription?.status === "ACTIVE" && shop.subscription.plan.slug !== "free";
  const isTop = tierKey === "top";
  const isEstablished = tierKey === "established";

  if (isPro && (isTop || isEstablished) && shop.isVerified) return "elite";
  if (isPro || isTop) return "pro";
  if (shop.isVerified || isEstablished) return "verified";
  return "standard";
}

// ── Luxury frame styles per tier ────────────────────────────
const FRAME_STYLES: Record<LuxuryTier, {
  outerRing: string;
  innerRing: string;
  glow: string;
  badge: string;
  nameClass: string;
  cardBg: string;
  cardBorder: string;
  accentColor: string;
}> = {
  standard: {
    outerRing: "ring-2 ring-stone-200",
    innerRing: "border-2 border-stone-100",
    glow: "",
    badge: "",
    nameClass: "text-stone-900",
    cardBg: "bg-white",
    cardBorder: "border-stone-200/60",
    accentColor: "stone",
  },
  verified: {
    outerRing: "ring-[3px] ring-emerald-400/70",
    innerRing: "border-2 border-emerald-100",
    glow: "breathe-ring-emerald",
    badge: "bg-emerald-500",
    nameClass: "text-stone-900",
    cardBg: "bg-gradient-to-br from-white via-emerald-50/30 to-white",
    cardBorder: "border-emerald-200/50",
    accentColor: "emerald",
  },
  pro: {
    outerRing: "ring-[3px] ring-amber-400/80",
    innerRing: "border-2 border-amber-100",
    glow: "breathe-ring-gold",
    badge: "bg-gradient-to-r from-amber-400 to-yellow-500",
    nameClass: "gold-shimmer-text",
    cardBg: "bg-gradient-to-br from-amber-50/40 via-white to-amber-50/30",
    cardBorder: "border-amber-200/60",
    accentColor: "amber",
  },
  elite: {
    outerRing: "ring-[3px] ring-amber-400",
    innerRing: "border-[3px] border-transparent bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500",
    glow: "pulse-glow-gold breathe-ring-gold",
    badge: "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500",
    nameClass: "gold-shimmer-text",
    cardBg: "bg-gradient-to-br from-amber-50/50 via-white to-yellow-50/40",
    cardBorder: "border-amber-300/50",
    accentColor: "amber",
  },
};

export function ShopProfile({ shop, tierBadge }: ShopProfileProps) {
  const [expanded, setExpanded] = useState(true);

  const hasLocation = shop.latitude !== null && shop.longitude !== null;
  const hasAddress = shop.address || shop.city;
  const hasSocials = shop.instagram || shop.facebook || shop.tiktok || shop.website || shop.whatsappGroupLink;
  const hasAbout = shop.aboutText;
  const hasGallery = shop.gallery && shop.gallery.length > 0;

  const parsedHours: BusinessHours = shop.businessHours
    ? (JSON.parse(shop.businessHours) as BusinessHours)
    : {};
  const hours = parsedHours;
  const hasHours = Object.keys(parsedHours).length > 0;

  if (!hasLocation && !hasAddress && !hasHours && !hasSocials && !hasAbout && !hasGallery) {
    return null;
  }

  const now = new Date();
  const dayIndex = now.getDay();
  const dayMap: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const todayKey = dayMap[dayIndex]!;
  const todayHours = hours[todayKey];
  const hasTodayHours = todayHours !== undefined;
  const isOpenNow = hasTodayHours && todayHours !== "Closed" ? checkIfOpen(todayHours, now) : false;

  const memberSince = shop.createdAt.toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
  });

  const luxuryTier = getLuxuryTier(shop, tierBadge?.key);
  const frame = FRAME_STYLES[luxuryTier];
  const isPro = shop.subscription?.status === "ACTIVE" && shop.subscription.plan.slug !== "free";

  return (
    <div className={`relative rounded-2xl border ${frame.cardBorder} ${frame.cardBg} overflow-hidden luxury-fade-in`}>
      {/* ── Decorative top accent line ──────────────────── */}
      {luxuryTier !== "standard" && (
        <div className={`h-[2px] w-full ${
          luxuryTier === "elite"
            ? "bg-gradient-to-r from-transparent via-amber-400 to-transparent"
            : luxuryTier === "pro"
              ? "bg-gradient-to-r from-transparent via-amber-300 to-transparent"
              : "bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
        }`} />
      )}

      {/* ── VIP Banner / Cover Area ─────────────────── */}
      <div className={`relative w-full h-28 sm:h-36 ${
        luxuryTier === "elite"
          ? "bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900"
          : luxuryTier === "pro"
            ? "bg-gradient-to-br from-stone-800 via-stone-700 to-stone-800"
            : luxuryTier === "verified"
              ? "bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-800"
              : "bg-gradient-to-br from-stone-600 via-stone-500 to-stone-600"
      }`}>
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: luxuryTier === "elite" || luxuryTier === "pro"
            ? "radial-gradient(circle at 20% 50%, rgba(255,215,0,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,215,0,0.2) 0%, transparent 50%)"
            : "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)"
        }} />

        {/* Banner image if available */}
        {shop.bannerUrl && (
          <Image
            src={shop.bannerUrl}
            alt={`${shop.name} banner`}
            fill
            className="object-cover opacity-60"
            sizes="(max-width: 640px) 100vw, 640px"
          />
        )}

        {/* Luxury tier label in corner */}
        {luxuryTier !== "standard" && (
          <div className={`absolute top-3 right-3 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-sm ${
            luxuryTier === "elite"
              ? "bg-amber-500/20 text-amber-200 border border-amber-400/30"
              : luxuryTier === "pro"
                ? "bg-amber-500/15 text-amber-300 border border-amber-400/20"
                : "bg-emerald-500/15 text-emerald-200 border border-emerald-400/20"
          }`}>
            {luxuryTier === "elite" ? "👑 ELITE VIP" : luxuryTier === "pro" ? "⭐ PRO" : "✓ VERIFIED"}
          </div>
        )}

        {/* Expand/Collapse button */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="absolute top-3 left-3 p-1.5 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-colors"
          aria-label={expanded ? "Collapse profile" : "Expand profile"}
        >
          <svg
            className={`w-4 h-4 text-white/80 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* ── Profile Picture — Large Centered, overlapping banner ── */}
      <div className="relative px-4 -mt-14 sm:-mt-16 pb-4">
        <div className="flex flex-col items-center text-center">
          {/* Profile Avatar — Big & Bold */}
          <div className="relative">
            {/* Sparkle decorations for elite */}
            {luxuryTier === "elite" && (
              <>
                <span className="absolute -top-2 -right-2 text-sm animate-crown z-20">✨</span>
                <span className="absolute -top-1 -left-3 text-xs animate-crown z-20" style={{ animationDelay: "0.7s" }}>💎</span>
                <span className="absolute -bottom-1 -right-3 text-xs animate-crown z-20" style={{ animationDelay: "1.4s" }}>✨</span>
              </>
            )}
            {luxuryTier === "pro" && (
              <span className="absolute -top-1 -right-1 text-sm animate-crown z-20">⭐</span>
            )}

            {/* Outer glow ring */}
            <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full ${
              luxuryTier === "elite"
                ? "ring-4 ring-amber-400 pulse-glow-gold"
                : luxuryTier === "pro"
                  ? "ring-[3px] ring-amber-400/80 breathe-ring-gold"
                  : luxuryTier === "verified"
                    ? "ring-[3px] ring-emerald-400/70 breathe-ring-emerald"
                    : "ring-2 ring-white shadow-lg"
            }`}>
              {/* Inner white border for contrast */}
              <div className="w-full h-full rounded-full border-[3px] border-white shadow-xl overflow-hidden">
                {shop.logoUrl ? (
                  <Image
                    src={shop.logoUrl}
                    alt={shop.name}
                    width={128}
                    height={128}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center rounded-full ${
                    luxuryTier === "elite" || luxuryTier === "pro"
                      ? "bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600"
                      : luxuryTier === "verified"
                        ? "bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600"
                        : "bg-gradient-to-br from-stone-400 via-stone-500 to-stone-600"
                  }`}>
                    <span className={`font-black text-white drop-shadow-md ${
                      luxuryTier === "elite" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"
                    }`}>
                      {shop.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Verified / Pro badge overlay — larger on big avatar */}
            {(shop.isVerified || isPro) && (
              <div className={`absolute -bottom-1 right-1 z-10 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full ${
                isPro
                  ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"
                  : "bg-emerald-500"
              } shadow-lg border-[3px] border-white animate-check-pulse`}>
                {isPro ? (
                  <span className="text-white text-sm sm:text-base font-black">★</span>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            )}
          </div>

          {/* ── Shop Name — Large, Centered, Luxury ────── */}
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center justify-center gap-2">
              <h2 className={`text-2xl sm:text-3xl font-black tracking-tight leading-tight ${frame.nameClass}`}>
                {shop.name}
              </h2>
              {luxuryTier === "elite" && (
                <span className="text-xl animate-crown" title="Elite VIP Seller">👑</span>
              )}
            </div>

            {/* Badge Row — Centered */}
            <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
              {shop.isVerified && (
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                  luxuryTier === "elite" || luxuryTier === "pro"
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-200/30"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}

              {isPro && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-amber-200/50">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  PRO
                </span>
              )}

              {tierBadge && tierBadge.key !== "new" && (
                <span className={`inline-flex items-center gap-0.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${tierBadge.bgColor || "bg-stone-100"} ${tierBadge.textColor || "text-stone-700"} border ${tierBadge.borderColor || "border-stone-200"}`}>
                  {tierBadge.emoji} {tierBadge.label}
                </span>
              )}

              {shop.avgRating > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] font-bold text-amber-700 shadow-sm">
                  ⭐ {shop.avgRating.toFixed(1)}
                  <span className="text-amber-500 font-normal">({shop._count.reviews})</span>
                </span>
              )}
            </div>

            {/* Stats Row — Centered */}
            <div className="flex items-center justify-center gap-3 mt-3 text-[11px] text-stone-500">
              <span className="inline-flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  luxuryTier === "elite" ? "bg-amber-400" : "bg-emerald-400"
                }`} />
                Since {memberSince}
              </span>
              <span className="text-stone-300">·</span>
              <span>📦 {shop._count.products} products</span>
              {shop._count.orders > 0 && (
                <>
                  <span className="text-stone-300">·</span>
                  <span className="text-emerald-600 font-medium">✅ {shop._count.orders} fulfilled</span>
                </>
              )}
              {hasHours && hasTodayHours && (
                <>
                  <span className="text-stone-300">·</span>
                  <span className={isOpenNow ? "text-emerald-600 font-semibold" : "text-red-500 font-medium"}>
                    {isOpenNow ? "🟢 Open" : "🔴 Closed"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Expanded Content ──────────────────────────────── */}
      {expanded && (
        <div className="border-t border-stone-100/80 px-4 py-5 space-y-6 luxury-fade-in">
          {/* About */}
          {hasAbout && (
            <div>
              <SectionHeading icon="✦" accentColor={frame.accentColor}>About</SectionHeading>
              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line mt-2">
                {shop.aboutText}
              </p>
            </div>
          )}

          {/* Gallery — Premium Grid */}
          {hasGallery && (
            <div>
              <SectionHeading icon="📸" accentColor={frame.accentColor}>Our Shop</SectionHeading>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                {shop.gallery!.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`relative aspect-square rounded-xl overflow-hidden bg-stone-100 border group luxury-fade-in ${
                      luxuryTier === "elite"
                        ? "border-amber-200/60 hover:border-amber-300"
                        : luxuryTier === "pro"
                          ? "border-amber-200/40 hover:border-amber-200"
                          : "border-stone-200 hover:border-stone-300"
                    }`}
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    {item.type === "VIDEO" ? (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        controls
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <Image
                        src={item.url}
                        alt={item.caption || "Shop gallery"}
                        fill
                        sizes="(max-width: 640px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    {item.caption && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                        <p className="text-white text-[10px] font-medium truncate">{item.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map + Location */}
          {(hasLocation || hasAddress) && (
            <div>
              <SectionHeading icon="📍" accentColor={frame.accentColor}>Location</SectionHeading>
              {hasAddress && (
                <p className="text-sm text-stone-600 mt-2 mb-2">
                  {[shop.address, shop.city, shop.province].filter(Boolean).join(", ")}
                </p>
              )}
              {hasLocation && (
                <div className="space-y-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open shop location in Google Maps"
                    className={`block rounded-xl overflow-hidden border hover:shadow-lg transition-all group relative h-48 sm:h-56 ${
                      luxuryTier === "elite"
                        ? "border-amber-200/60 hover:border-amber-300"
                        : "border-stone-200 hover:border-emerald-300"
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-stone-100"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right,#d1d5db 1px,transparent 1px),linear-gradient(to bottom,#d1d5db 1px,transparent 1px)",
                        backgroundSize: "32px 32px",
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-5 bg-white/70" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="h-full w-6 bg-white/70" />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg border-2 border-white group-hover:scale-110 transition-transform ${
                        luxuryTier === "elite" || luxuryTier === "pro"
                          ? "bg-gradient-to-br from-amber-400 to-amber-600"
                          : "bg-red-500"
                      }`}>
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full shadow-md transition-colors ${
                        luxuryTier === "elite"
                          ? "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 group-hover:from-amber-100 group-hover:to-yellow-100"
                          : "bg-white text-stone-700 group-hover:bg-emerald-50 group-hover:text-emerald-700"
                      }`}>
                        Tap to open in Google Maps →
                      </span>
                    </div>
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                    </svg>
                    Get directions on Google Maps
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Business Hours */}
          {hasHours && (
            <div>
              <SectionHeading icon="🕐" accentColor={frame.accentColor}>Business Hours</SectionHeading>
              <div className="grid grid-cols-1 gap-1 mt-2">
                {DAYS_OF_WEEK.map((day) => {
                  const dayHour = hours[day];
                  if (!dayHour) return null;
                  const isToday = day === todayKey;
                  return (
                    <div
                      key={day}
                      className={`flex items-center justify-between py-1.5 px-3 rounded-lg text-sm transition-colors ${
                        isToday
                          ? luxuryTier === "elite" || luxuryTier === "pro"
                            ? "bg-amber-50/80 font-medium"
                            : "bg-emerald-50 font-medium"
                          : "hover:bg-stone-50"
                      }`}
                    >
                      <span className={isToday
                        ? luxuryTier === "elite" || luxuryTier === "pro"
                          ? "text-amber-800"
                          : "text-emerald-700"
                        : "text-stone-600"
                      }>
                        {DAY_LABELS[day]}
                        {isToday && " (Today)"}
                      </span>
                      <span className={
                        dayHour === "Closed"
                          ? "text-red-500 text-xs"
                          : isToday
                            ? luxuryTier === "elite" || luxuryTier === "pro"
                              ? "text-amber-800"
                              : "text-emerald-700"
                            : "text-stone-500"
                      }>
                        {dayHour}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Social Links — Premium Pills */}
          {hasSocials && (
            <div>
              <SectionHeading icon="🔗" accentColor={frame.accentColor}>Connect</SectionHeading>
              <div className="flex flex-wrap gap-2 mt-2">
                <a
                  href={`https://wa.me/${shop.whatsappNumber.replace("+", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-md active:scale-95 ${
                    luxuryTier === "elite"
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-sm shadow-emerald-200/50"
                      : "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {shop.retailWhatsappNumber ? "Wholesale" : "WhatsApp"}
                </a>
                {shop.retailWhatsappNumber && (
                  <a
                    href={`https://wa.me/${shop.retailWhatsappNumber.replace("+", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-100 hover:shadow-md transition-all duration-200 active:scale-95"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Retail
                  </a>
                )}
                {shop.whatsappGroupLink && (
                  <a
                    href={shop.whatsappGroupLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 hover:shadow-md transition-all duration-200 active:scale-95"
                  >
                    👥 Join Group
                  </a>
                )}
                {shop.instagram && (
                  <a
                    href={`https://instagram.com/${shop.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 text-pink-700 text-sm font-semibold hover:from-pink-100 hover:to-purple-100 hover:shadow-md transition-all duration-200 active:scale-95"
                  >
                    📸 @{shop.instagram}
                  </a>
                )}
                {shop.tiktok && (
                  <a
                    href={`https://tiktok.com/@${shop.tiktok}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-100 hover:shadow-md transition-all duration-200 active:scale-95"
                  >
                    🎵 @{shop.tiktok}
                  </a>
                )}
                {shop.facebook && (
                  <a
                    href={shop.facebook.startsWith("http") ? shop.facebook : `https://facebook.com/${shop.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-100 hover:shadow-md transition-all duration-200 active:scale-95"
                  >
                    👥 Facebook
                  </a>
                )}
                {shop.website && (
                  <a
                    href={shop.website.startsWith("http") ? shop.website : `https://${shop.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-100 hover:shadow-md transition-all duration-200 active:scale-95"
                  >
                    🌐 Website
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ── Luxury Trust Footer ──────────────────────── */}
          <div className={`pt-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
            luxuryTier === "elite"
              ? "border-amber-100"
              : "border-stone-100"
          }`}>
            <div className="flex flex-wrap items-center gap-3 text-stone-400">
              <span className="inline-flex items-center gap-1">
                🛡️ Since {memberSince}
              </span>
              <span>📦 {shop._count.products} products</span>
              {shop._count.orders > 0 && <span className="text-emerald-600 font-medium">✅ {shop._count.orders} delivered</span>}
              {shop.avgRating > 0 && <span className="text-amber-600">⭐ {shop.avgRating.toFixed(1)} ({shop._count.reviews} reviews)</span>}
            </div>
            {/* Luxury tier indicator */}
            {luxuryTier !== "standard" && (
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${
                luxuryTier === "elite"
                  ? "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200/60"
                  : luxuryTier === "pro"
                    ? "bg-amber-50 text-amber-600 border border-amber-200/50"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-200/50"
              }`}>
                {luxuryTier === "elite" ? "👑 ELITE VIP" : luxuryTier === "pro" ? "⭐ PRO SELLER" : "✓ TRUSTED"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section Heading Component ───────────────────────────────
function SectionHeading({ icon, accentColor, children }: { icon: string; accentColor: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs">{icon}</span>
      <h3 className="text-[11px] uppercase tracking-[0.15em] font-bold text-stone-400">
        {children}
      </h3>
      <div className={`flex-1 h-px ${
        accentColor === "amber" ? "bg-gradient-to-r from-amber-200/60 to-transparent" :
        accentColor === "emerald" ? "bg-gradient-to-r from-emerald-200/60 to-transparent" :
        "bg-gradient-to-r from-stone-200/60 to-transparent"
      }`} />
    </div>
  );
}

// ── Helper: Check if time is within hours range ─────────────
function checkIfOpen(hoursStr: string, now: Date): boolean {
  const match = hoursStr.match(/^(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})$/);
  if (!match) return false;
  const [, openH, openM, closeH, closeM] = match;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = Number(openH) * 60 + Number(openM);
  const closeMinutes = Number(closeH) * 60 + Number(closeM);
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}
