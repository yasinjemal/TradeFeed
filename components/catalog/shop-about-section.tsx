// ============================================================
// Component — Shop About Section
// ============================================================
// Always-visible about section below the product grid.
// Shows seller's story, gallery, business hours, socials,
// and location. Replaces the old collapsible ShopProfile.
// ============================================================

"use client";

import { useState } from "react";
import Image from "next/image";
import type { BusinessHours, DayKey } from "@/lib/validation/shop-settings";
import { DAY_LABELS, DAYS_OF_WEEK } from "@/lib/validation/shop-settings";

interface ShopAboutSectionProps {
  shop: {
    name: string;
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
    gallery?: {
      id: string;
      url: string;
      type: string;
      caption: string | null;
      position: number;
    }[];
  };
}

export function ShopAboutSection({ shop }: ShopAboutSectionProps) {
  const hasAbout = !!shop.aboutText;
  const hasGallery = shop.gallery && shop.gallery.length > 0;
  const hasLocation =
    shop.latitude !== null && shop.longitude !== null;
  const hasAddress = shop.address || shop.city;
  const hasSocials =
    shop.instagram ||
    shop.facebook ||
    shop.tiktok ||
    shop.website ||
    shop.whatsappGroupLink;

  const parsedHours: BusinessHours = shop.businessHours
    ? (JSON.parse(shop.businessHours) as BusinessHours)
    : {};
  const hasHours = Object.keys(parsedHours).length > 0;

  const hasAnyContent =
    hasAbout || hasGallery || hasLocation || hasAddress || hasSocials || hasHours;

  if (!hasAnyContent) return null;

  return (
    <div className="space-y-4">
      {/* Section heading */}
      <h3 className="text-base font-bold text-slate-800">
        About {shop.name}
      </h3>

      {/* About text */}
      {hasAbout && (
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {shop.aboutText}
        </p>
      )}

      {/* Gallery */}
      {hasGallery && <GalleryGrid images={shop.gallery!} />}

      {/* Info cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Business hours */}
        {hasHours && <HoursCard hours={parsedHours} />}

        {/* Location */}
        {(hasAddress || hasLocation) && (
          <LocationCard
            address={shop.address}
            city={shop.city}
            province={shop.province}
            lat={shop.latitude}
            lng={shop.longitude}
          />
        )}
      </div>

      {/* Social links */}
      {hasSocials && (
        <SocialLinks
          instagram={shop.instagram}
          facebook={shop.facebook}
          tiktok={shop.tiktok}
          website={shop.website}
          whatsappGroupLink={shop.whatsappGroupLink}
        />
      )}
    </div>
  );
}

/* ── Gallery Grid ──────────────────────────────────────── */

function GalleryGrid({
  images,
}: {
  images: { id: string; url: string; caption: string | null }[];
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setSelectedIdx(idx)}
            className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Image
              src={img.url}
              alt={img.caption || "Shop photo"}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 33vw, 25vw"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedIdx(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <button
            type="button"
            onClick={() => setSelectedIdx(null)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div
            className="relative max-h-[80vh] max-w-[90vw] sm:max-w-lg overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selectedIdx]!.url}
              alt={images[selectedIdx]!.caption || "Shop photo"}
              width={600}
              height={600}
              className="w-full h-auto object-contain"
            />
            {images[selectedIdx]!.caption && (
              <p className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs text-center py-2 px-3">
                {images[selectedIdx]!.caption}
              </p>
            )}
          </div>
          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIdx(
                    (selectedIdx - 1 + images.length) % images.length
                  );
                }}
                className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Previous image"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5 8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIdx((selectedIdx + 1) % images.length);
                }}
                className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Next image"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

/* ── Hours Card ────────────────────────────────────────── */

function HoursCard({ hours }: { hours: BusinessHours }) {
  const now = new Date();
  const dayMap: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const todayKey = dayMap[now.getDay()]!;

  return (
    <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="h-4 w-4 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <span className="text-sm font-semibold text-slate-700">
          Business Hours
        </span>
      </div>
      <div className="space-y-1">
        {DAYS_OF_WEEK.map((day) => {
          const isToday = day === todayKey;
          const value = hours[day];
          return (
            <div
              key={day}
              className={`flex justify-between text-xs ${
                isToday
                  ? "font-semibold text-emerald-600"
                  : "text-slate-500"
              }`}
            >
              <span>{DAY_LABELS[day]}</span>
              <span>{value || "Closed"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Location Card ─────────────────────────────────────── */

function LocationCard({
  address,
  city,
  province,
  lat,
  lng,
}: {
  address: string | null;
  city: string | null;
  province: string | null;
  lat: number | null;
  lng: number | null;
}) {
  const locationText = [address, city, province]
    .filter(Boolean)
    .join(", ");

  const mapsUrl =
    lat && lng
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : locationText
        ? `https://www.google.com/maps/search/${encodeURIComponent(locationText)}`
        : null;

  return (
    <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="h-4 w-4 text-slate-500"
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
        <span className="text-sm font-semibold text-slate-700">
          Location
        </span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">
        {locationText}
      </p>
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          View on map
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
        </a>
      )}
    </div>
  );
}

/* ── Social Links ──────────────────────────────────────── */

function SocialLinks({
  instagram,
  facebook,
  tiktok,
  website,
  whatsappGroupLink,
}: {
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  website: string | null;
  whatsappGroupLink: string | null;
}) {
  const links = [
    instagram && { label: "Instagram", url: instagram, icon: InstagramIcon },
    facebook && { label: "Facebook", url: facebook, icon: FacebookIcon },
    tiktok && { label: "TikTok", url: tiktok, icon: TikTokIcon },
    website && { label: "Website", url: website, icon: WebsiteIcon },
    whatsappGroupLink && {
      label: "WhatsApp Group",
      url: whatsappGroupLink,
      icon: WhatsAppGroupIcon,
    },
  ].filter(Boolean) as {
    label: string;
    url: string;
    icon: React.FC<{ className?: string }>;
  }[];

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/60 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-emerald-200 hover:text-emerald-600"
        >
          <link.icon className="h-3.5 w-3.5" />
          {link.label}
        </a>
      ))}
    </div>
  );
}

/* ── Social Icons ──────────────────────────────────────── */

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function WebsiteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
      />
    </svg>
  );
}

function WhatsAppGroupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
