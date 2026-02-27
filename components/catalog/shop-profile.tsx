// ============================================================
// Component — Public Shop Profile Section
// ============================================================
// Shows on the catalog page: map, about, hours, trust, socials.
// Collapsible on mobile — expands to show full profile.
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
    gallery?: { id: string; url: string; type: string; caption: string | null; position: number }[];
    _count: { products: number; orders: number; reviews: number };
  };
  /** Seller reputation tier data (optional) */
  tierBadge?: { emoji: string; label: string; key: string } | null;
}

export function ShopProfile({ shop, tierBadge }: ShopProfileProps) {
  const [expanded, setExpanded] = useState(true);

  const hasLocation = shop.latitude !== null && shop.longitude !== null;
  const hasAddress = shop.address || shop.city;
  const hasSocials = shop.instagram || shop.facebook || shop.tiktok || shop.website || shop.whatsappGroupLink;
  const hasAbout = shop.aboutText;
  const hasGallery = shop.gallery && shop.gallery.length > 0;

  // Parse business hours — only treat as "has hours" if at least one day is configured.
  // An empty object {} means no hours were set → don't show "Closed" in the trust bar.
  const parsedHours: BusinessHours = shop.businessHours
    ? (JSON.parse(shop.businessHours) as BusinessHours)
    : {};
  const hours = parsedHours;
  const hasHours = Object.keys(parsedHours).length > 0;

  // Nothing to show
  if (!hasLocation && !hasAddress && !hasHours && !hasSocials && !hasAbout && !hasGallery) {
    return null;
  }

  // Is the shop currently open?
  // Runs in the browser — uses device local time (correct for SA users viewing SA shops).
  const now = new Date();
  const dayIndex = now.getDay(); // 0=Sun, 1=Mon, ...
  const dayMap: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const todayKey = dayMap[dayIndex]!;
  const todayHours = hours[todayKey];
  // Only show the open/closed pill if today's hours are explicitly configured.
  // Prevents false "Closed" when the seller hasn't set hours for every day.
  const hasTodayHours = todayHours !== undefined;
  const isOpenNow = hasTodayHours && todayHours !== "Closed" ? checkIfOpen(todayHours, now) : false;

  const memberSince = shop.createdAt.toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-2xl border border-stone-200/60 bg-white overflow-hidden">
      {/* ── Trust Bar (always visible) ────────────────────── */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-stone-50/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Trust indicators */}
          <div className="flex items-center gap-2 text-xs text-stone-500">
            {shop.isVerified && (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified
              </span>
            )}
            {shop.avgRating > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                ⭐ {shop.avgRating.toFixed(1)} ({shop._count.reviews})
              </span>
            )}
            {tierBadge && tierBadge.key !== "new" && (
              <span className="inline-flex items-center gap-0.5 font-semibold text-stone-700">
                {tierBadge.emoji} {tierBadge.label}
              </span>
            )}
            {shop._count.orders > 0 && (
              <span className="text-emerald-600 font-medium">✅ {shop._count.orders} orders fulfilled</span>
            )}
            <span>📦 {shop._count.products} products</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Since {memberSince}</span>
            {hasAddress && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">
                  📍 {shop.city || shop.address}
                </span>
              </>
            )}
            {/* Only show open/closed when today's hours are explicitly configured */}
            {hasHours && hasTodayHours && (
              <>
                <span>•</span>
                <span className={isOpenNow ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
                  {isOpenNow ? "🟢 Open now" : "🔴 Closed"}
                </span>
              </>
            )}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-stone-400 transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* ── Expanded Content ──────────────────────────────── */}
      {expanded && (
        <div className="border-t border-stone-100 px-4 py-5 space-y-5">
          {/* About */}
          {hasAbout && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-400 mb-2">
                About
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                {shop.aboutText}
              </p>
            </div>
          )}

          {/* Gallery */}
          {hasGallery && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-400 mb-2">
                Our Shop
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {shop.gallery!.map((item) => (
                  <div
                    key={item.id}
                    className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200"
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
                        className="object-cover"
                      />
                    )}
                    {item.caption && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
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
              <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-400 mb-2">
                Location
              </h3>
              {hasAddress && (
                <p className="text-sm text-stone-600 mb-2">
                  {[shop.address, shop.city, shop.province]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {hasLocation && (
                <div className="space-y-2">
                  {/*
                    Map card — OpenStreetMap embed iframes are blocked by browsers
                    due to their X-Frame-Options: SAMEORIGIN header on external domains.
                    Using a styled clickable card that opens Google Maps instead.
                    Opens native Maps app on mobile devices automatically.
                  */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open shop location in Google Maps"
                    className="block rounded-xl overflow-hidden border border-stone-200 hover:border-emerald-300 transition-all group relative h-48 sm:h-56"
                  >
                    {/* Map grid background */}
                    <div
                      className="absolute inset-0 bg-stone-100"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right,#d1d5db 1px,transparent 1px),linear-gradient(to bottom,#d1d5db 1px,transparent 1px)",
                        backgroundSize: "32px 32px",
                      }}
                    />
                    {/* Decorative horizontal road */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-5 bg-white/70" />
                    </div>
                    {/* Decorative vertical road */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="h-full w-6 bg-white/70" />
                    </div>
                    {/* Location pin + tap label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-xs font-semibold bg-white px-3 py-1.5 rounded-full shadow-md text-stone-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
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
              <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-400 mb-2">
                Business Hours
              </h3>
              <div className="grid grid-cols-1 gap-1">
                {DAYS_OF_WEEK.map((day) => {
                  const dayHour = hours[day];
                  if (!dayHour) return null;
                  const isToday = day === todayKey;
                  return (
                    <div
                      key={day}
                      className={`flex items-center justify-between py-1 px-2 rounded-lg text-sm ${
                        isToday ? "bg-emerald-50 font-medium" : ""
                      }`}
                    >
                      <span className={isToday ? "text-emerald-700" : "text-stone-600"}>
                        {DAY_LABELS[day]}
                        {isToday && " (Today)"}
                      </span>
                      <span
                        className={
                          dayHour === "Closed"
                            ? "text-red-500 text-xs"
                            : isToday
                              ? "text-emerald-700"
                              : "text-stone-500"
                        }
                      >
                        {dayHour}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Social Links */}
          {hasSocials && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-400 mb-2">
                Connect
              </h3>
              <div className="flex flex-wrap gap-2">
                {/* WhatsApp — Wholesale */}
                <a
                  href={`https://wa.me/${shop.whatsappNumber.replace("+", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {shop.retailWhatsappNumber ? "Wholesale" : "WhatsApp"}
                </a>
                {/* WhatsApp — Retail */}
                {shop.retailWhatsappNumber && (
                  <a
                    href={`https://wa.me/${shop.retailWhatsappNumber.replace("+", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Retail
                  </a>
                )}
                {/* WhatsApp Group */}
                {shop.whatsappGroupLink && (
                  <a
                    href={shop.whatsappGroupLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Join Group
                  </a>
                )}
                {shop.instagram && (
                  <a
                    href={`https://instagram.com/${shop.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 text-sm font-medium hover:bg-pink-100 transition-colors"
                  >
                    📸 @{shop.instagram}
                  </a>
                )}
                {shop.tiktok && (
                  <a
                    href={`https://tiktok.com/@${shop.tiktok}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-100 transition-colors"
                  >
                    🎵 @{shop.tiktok}
                  </a>
                )}
                {shop.facebook && (
                  <a
                    href={
                      shop.facebook.startsWith("http")
                        ? shop.facebook
                        : `https://facebook.com/${shop.facebook}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    👥 Facebook
                  </a>
                )}
                {shop.website && (
                  <a
                    href={shop.website.startsWith("http") ? shop.website : `https://${shop.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-100 transition-colors"
                  >
                    🌐 Website
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Trust Footer */}
          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-3 text-xs text-stone-400">
            <span>🛡️ Since {memberSince}</span>
            <span>📦 {shop._count.products} products</span>
            {shop._count.orders > 0 && <span>✅ {shop._count.orders} orders delivered</span>}
            {shop.avgRating > 0 && <span>⭐ {shop.avgRating.toFixed(1)} avg rating ({shop._count.reviews} reviews)</span>}
            {shop.isVerified && <span className="text-emerald-600">✅ Verified seller</span>}
          </div>
        </div>
      )}
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
