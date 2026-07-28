"use client";

import * as React from "react";
import Image from "next/image";
import { ImageOff, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { shouldAutoplay } from "@/lib/video/autoplay";

// ============================================================
// TfGallery — swipeable product media gallery, now alive:
// - scroll-snap swiping with LIVE dot indicators (the page
//   acknowledges your swipe instead of a static text badge)
// - one-time horizontal nudge on first view: the gallery
//   demonstrates swipeability instead of claiming it
// - desktop: slow, soft zoom on image hover (320ms, transform-only)
// - dots are tappable (44px hit area) for non-swipe users
//
// Video support (one per product, SECOND slide — images[0] stays
// the LCP/OG anchor):
// - upload/direct: native <video>, auto-plays muted when its
//   slide becomes active (Save-Data & reduced-motion respected),
//   pauses when swiped away; controls stay for manual play
// - YouTube: lite embed — thumbnail + play button; the nocookie
//   iframe is created only on tap and absolute-fills the fixed-
//   aspect frame (zero CLS, zero upfront iframe weight)
// Reduced motion: no nudge, no zoom, no autoplay; dots track.
// ============================================================

interface TfGalleryImage {
  id: string;
  url: string;
  altText: string | null;
}

export interface TfGalleryVideo {
  id: string;
  kind: "upload" | "direct" | "youtube";
  /** Playback URL (upload/direct) or canonical watch URL (youtube) */
  url: string;
  /** nocookie embed URL with autoplay params — youtube only */
  embedUrl?: string;
  thumbnailUrl?: string | null;
}

type Slide =
  | { type: "image"; id: string; image: TfGalleryImage }
  | { type: "video"; id: string; video: TfGalleryVideo };

interface TfGalleryProps {
  images: TfGalleryImage[];
  video?: TfGalleryVideo | null;
  productName: string;
  soldOut?: boolean;
}

export function TfGallery({ images, video, productName, soldOut = false }: TfGalleryProps) {
  const trackRef = React.useRef<HTMLUListElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [active, setActive] = React.useState(0);
  const [youtubeStarted, setYoutubeStarted] = React.useState(false);

  // Slide order: first image leads (LCP/OG anchor), video second,
  // remaining images after. Video leads only when there are no images.
  const slides = React.useMemo<Slide[]>(() => {
    const imageSlides: Slide[] = images.map((image) => ({ type: "image", id: image.id, image }));
    if (!video) return imageSlides;
    const videoSlide: Slide = { type: "video", id: `video-${video.id}`, video };
    if (imageSlides.length === 0) return [videoSlide];
    return [imageSlides[0]!, videoSlide, ...imageSlides.slice(1)];
  }, [images, video]);

  const videoSlideIndex = React.useMemo(
    () => slides.findIndex((s) => s.type === "video"),
    [slides],
  );

  const multi = slides.length > 1;

  const onScroll = React.useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.max(0, Math.min(slides.length - 1, i)));
  }, [slides.length]);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // Native video follows the active slide: play muted on arrival,
  // pause on departure. muted is set imperatively BEFORE play() —
  // React's SSR of the muted attribute is unreliable and unmuted
  // play() gets rejected by autoplay policy. play() may still
  // reject (iOS Low Power Mode) — swallow it; controls remain.
  React.useEffect(() => {
    const el = videoRef.current;
    if (!el || videoSlideIndex === -1) return;
    if (active === videoSlideIndex) {
      if (shouldAutoplay()) {
        el.muted = true;
        el.play().catch(() => {});
      }
    } else {
      el.pause();
    }
  }, [active, videoSlideIndex]);

  if (slides.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-[1.75rem] border border-tf-stone-200 bg-tf-stone-100 text-tf-stone-400">
        <ImageOff aria-hidden="true" className="size-10" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] shadow-[0_28px_80px_rgba(20,20,16,0.14)] ring-1 ring-tf-stone-200/80">
      <ul
        ref={trackRef}
        onScroll={onScroll}
        className={cn(
          "flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-[1.75rem] scrollbar-hide",
          multi && "tf-nudge",
        )}
        aria-label={`${productName} media — ${active + 1} of ${slides.length}`}
      >
        {slides.map((slide, i) => (
          <li
            key={slide.id}
            className="group/frame relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden rounded-[1.75rem] bg-tf-stone-100 sm:aspect-square"
          >
            {slide.type === "image" ? (
              <Image
                src={slide.image.url}
                alt={slide.image.altText ?? `${productName} — photo ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={i === 0}
                loading={i === 0 ? "eager" : "lazy"}
                className="object-cover motion-safe:transition-transform motion-safe:duration-[320ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover/frame:scale-[1.04]"
              />
            ) : slide.video.kind === "youtube" ? (
              youtubeStarted && slide.video.embedUrl ? (
                <>
                  <iframe
                    src={slide.video.embedUrl}
                    title={`${productName} — video`}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                  {/* Embedding-disabled videos show YouTube's error — give an out */}
                  <a
                    href={slide.video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-3 right-3 rounded-full bg-tf-ink/70 px-2.5 py-1 text-[11px] font-medium text-tf-surface transition-colors hover:bg-tf-ink/90"
                  >
                    Watch on YouTube
                  </a>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setYoutubeStarted(true)}
                  aria-label={`Play ${productName} video`}
                  className="group/yt absolute inset-0 h-full w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tf-primary"
                >
                  {slide.video.thumbnailUrl && (
                    <Image
                      src={slide.video.thumbnailUrl}
                      alt={`${productName} — video preview`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover/yt:bg-black/35">
                    <span className="flex size-16 items-center justify-center rounded-full bg-tf-raised/90 shadow-tf-md backdrop-blur-sm">
                      <Play aria-hidden="true" className="ml-1 size-7 fill-tf-ink text-tf-ink" />
                    </span>
                  </span>
                  <span className="absolute bottom-3 left-3 rounded-full bg-tf-ink/70 px-2.5 py-1 text-[11px] font-medium text-tf-surface">
                    Video
                  </span>
                </button>
              )
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={slide.video.url}
                  poster={slide.video.thumbnailUrl ?? undefined}
                  controls
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-tf-ink/70 px-2.5 py-1 text-[11px] font-medium text-tf-surface">
                  Video
                </span>
              </>
            )}
          </li>
        ))}
      </ul>

      {/* Live dots — the gallery acknowledges the swipe */}
      {multi && (
        <div className="absolute inset-x-0 bottom-2.5 flex justify-center" aria-hidden="false">
          <div className="flex items-center gap-0 rounded-full bg-tf-ink/55 px-1.5 backdrop-blur-sm">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${slide.type === "video" ? "Video" : "Photo"} ${i + 1} of ${slides.length}`}
                aria-current={active === i}
                className="flex size-7 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              >
                {slide.type === "video" ? (
                  <Play
                    aria-hidden="true"
                    className={cn(
                      "size-2.5 fill-tf-surface text-tf-surface motion-safe:transition-opacity",
                      active === i ? "opacity-100" : "opacity-50",
                    )}
                  />
                ) : (
                  <span
                    className={cn(
                      "block rounded-full bg-tf-surface motion-safe:transition-all motion-safe:duration-200",
                      active === i ? "h-1.5 w-4 opacity-100" : "size-1.5 opacity-50",
                    )}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {soldOut && (
        <span className="absolute left-3 top-3 rounded-full bg-tf-ink/80 px-3 py-1 text-xs font-semibold text-tf-surface">
          Sold out
        </span>
      )}
    </div>
  );
}
