"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ImageOff, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { useInView } from "@/lib/hooks/use-in-view";
import { shouldAutoplay } from "@/lib/video/autoplay";
import { formatZAR } from "./format";
import { TfRatingChip } from "./rating-chip";

// WhatsApp green SVG icon — inline so no extra icon dep needed
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.116 1.522 5.844L.057 23.882a.5.5 0 0 0 .61.61l6.04-1.465A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.003-1.37l-.359-.213-3.724.904.92-3.625-.234-.373A9.818 9.818 0 0 1 2.182 12c0-5.424 4.394-9.818 9.818-9.818 5.424 0 9.818 4.394 9.818 9.818 0 5.424-4.394 9.818-9.818 9.818z" />
    </svg>
  );
}

export interface TfProductCardProps extends React.ComponentProps<"article"> {
  href: string;
  title: string;
  /** Price in Rand */
  price: number;
  /** Original price when on sale */
  compareAtPrice?: number;
  imageUrl?: string | null;
  imageAlt?: string;
  sellerName?: string;
  sellerVerified?: boolean;
  rating?: number;
  ratingCount?: number;
  location?: string;
  /** Set on above-the-fold cards to skip lazy loading */
  priority?: boolean;
  /** Honest labelling for paid placements */
  promoted?: boolean;
  /** Shop WhatsApp number — enables direct WhatsApp CTA */
  whatsappNumber?: string;
  /** Product listed within the last 7 days */
  isNew?: boolean;
  /** Showcase video URL — upload/direct autoplay muted in view */
  videoPreviewUrl?: string | null;
  /** youtube shows a play badge only (no iframe in grids) */
  videoKind?: "upload" | "direct" | "youtube" | null;
}

function TfProductCard({
  href,
  title,
  price,
  compareAtPrice,
  imageUrl,
  imageAlt,
  sellerName,
  sellerVerified = false,
  rating,
  ratingCount,
  location,
  priority = false,
  promoted = false,
  whatsappNumber,
  isNew = false,
  videoPreviewUrl,
  videoKind,
  className,
  ...props
}: TfProductCardProps) {
  const onSale = compareAtPrice != null && compareAtPrice > price;
  const discountPct = onSale
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const waHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! I'm interested in "${title}" — ${formatZAR(price)}`)}`
    : null;

  // ── Smart autoplay preview (upload/direct only) ──────────
  // Data discipline for SA mobile: the <video> has no src until the
  // card is actually visible, and we drop the src again once it has
  // been off-screen a while (frees decoders in long grids). Save-Data
  // and reduced-motion opt out entirely — the still image stays.
  const playsInline = videoKind === "upload" || videoKind === "direct";
  const hasVideo = Boolean(videoPreviewUrl) && videoKind != null;
  const { ref: mediaRef, inView } = useInView<HTMLDivElement>({ threshold: 0.5 });
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = React.useState<string | null>(null);
  const [videoReady, setVideoReady] = React.useState(false);

  React.useEffect(() => {
    if (!playsInline || !videoPreviewUrl) return;
    if (inView) {
      if (!shouldAutoplay()) return;
      setVideoSrc(videoPreviewUrl);
      const el = videoRef.current;
      if (el) {
        el.muted = true;
        el.play().catch(() => {});
      }
      return;
    }

    const el = videoRef.current;
    el?.pause();
    // Release the decoder + buffered data after it stays off-screen
    const timer = setTimeout(() => {
      setVideoSrc(null);
      setVideoReady(false);
      if (el) {
        el.removeAttribute("src");
        el.load();
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [inView, playsInline, videoPreviewUrl]);

  return (
    <article
      data-slot="tf-product-card"
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-tf-raised",
        "border border-tf-stone-200 shadow-tf-sm",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-tf-md hover:border-tf-stone-300",
        "focus-within:ring-2 focus-within:ring-tf-primary focus-within:ring-offset-2 focus-within:ring-offset-tf-surface",
        className,
      )}
      {...props}
    >
      {/* ── Image (+ video preview) ────────────────────── */}
      <div ref={mediaRef} className="relative aspect-[4/5] overflow-hidden bg-tf-stone-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            loading={priority ? "eager" : "lazy"}
            priority={priority}
            className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-tf-stone-300">
            <ImageOff aria-hidden="true" className="size-8" />
          </div>
        )}

        {/* Muted looping preview layered over the still. The image acts
            as the poster, and the video only fades in once it's actually
            playing so a black decode frame never flashes. */}
        {playsInline && videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            onPlaying={() => setVideoReady(true)}
            className={cn(
              "pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              videoReady ? "opacity-100" : "opacity-0",
            )}
          />
        )}

        {/* Video affordance — the only signal on YouTube cards.
            Sits under the verified tick when both are shown. */}
        {hasVideo && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute right-2.5 z-10 flex size-7 items-center justify-center rounded-full bg-tf-ink/60 backdrop-blur-sm",
              sellerVerified ? "top-[2.4rem]" : "top-2.5",
            )}
          >
            <Play className="ml-0.5 size-3.5 fill-white text-white" />
          </span>
        )}

        {/* Top-left: new + sale + promoted badges */}
        {(isNew || onSale || promoted) && (
          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
            {isNew && !onSale && (
              <span className="rounded-full bg-tf-primary px-2 py-0.5 text-[11px] font-bold leading-none text-white shadow-sm">
                New
              </span>
            )}
            {onSale && (
              <span className="rounded-full bg-tf-accent px-2 py-0.5 text-[11px] font-bold leading-none text-tf-ink shadow-sm">
                -{discountPct}%
              </span>
            )}
            {promoted && (
              <span className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium leading-none text-white">
                Ad
              </span>
            )}
          </div>
        )}

        {/* Top-right: verified badge */}
        {sellerVerified && (
          <span
            aria-label="Verified seller"
            className="absolute right-2.5 top-2.5 flex size-[22px] items-center justify-center rounded-full bg-white shadow-sm"
          >
            <BadgeCheck aria-hidden="true" className="size-3.5 text-tf-verified" />
          </span>
        )}

        {/* Bottom overlay: WhatsApp CTA — appears on hover */}
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Order "${title}" on WhatsApp`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 py-2.5",
              "bg-whatsapp text-white text-[12px] font-semibold",
              "translate-y-full transition-transform duration-200 group-hover:translate-y-0",
              "focus-visible:translate-y-0 outline-none focus-visible:ring-2 focus-visible:ring-white",
            )}
          >
            <WhatsAppIcon className="size-4 shrink-0" />
            Order on WhatsApp
          </a>
        )}
      </div>

      {/* ── Card body ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-tf-ink">
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {title}
          </Link>
        </h3>

        <div className="flex items-baseline gap-1.5 tabular-nums">
          <span className="font-tf-display text-[15px] font-bold text-tf-ink">
            {formatZAR(price)}
          </span>
          {onSale && (
            <s className="text-[11px] text-tf-stone-400">{formatZAR(compareAtPrice)}</s>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-1.5 pt-0.5">
          {sellerName && (
            <p className="min-w-0 truncate text-[11px] text-tf-stone-400">{sellerName}</p>
          )}
          <div className="flex shrink-0 items-center gap-1">
            {rating != null ? (
              <TfRatingChip rating={rating} count={ratingCount} bare />
            ) : location ? (
              <span className="shrink-0 rounded-full bg-tf-stone-100 px-1.5 py-0.5 text-[10px] text-tf-stone-500">
                {location}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export { TfProductCard };
