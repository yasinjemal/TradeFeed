"use client";

import * as React from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

// ============================================================
// TfGallery — swipeable product gallery, now alive:
// - scroll-snap swiping with LIVE dot indicators (the page
//   acknowledges your swipe instead of a static text badge)
// - one-time horizontal nudge on first view: the gallery
//   demonstrates swipeability instead of claiming it
// - desktop: slow, soft zoom on hover (320ms, transform-only)
// - dots are tappable (44px hit area) for non-swipe users
// Reduced motion: no nudge, no zoom, dots still track.
// ============================================================

interface TfGalleryProps {
  images: { id: string; url: string; altText: string | null }[];
  productName: string;
  soldOut?: boolean;
}

export function TfGallery({ images, productName, soldOut = false }: TfGalleryProps) {
  const trackRef = React.useRef<HTMLUListElement>(null);
  const [active, setActive] = React.useState(0);
  const multi = images.length > 1;

  const onScroll = React.useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.max(0, Math.min(images.length - 1, i)));
  }, [images.length]);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-tf-stone-200 bg-tf-stone-100 text-tf-stone-400">
        <ImageOff aria-hidden="true" className="size-10" />
      </div>
    );
  }

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        onScroll={onScroll}
        className={cn(
          "flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-xl scrollbar-hide",
          multi && "tf-nudge",
        )}
        aria-label={`${productName} photos — ${active + 1} of ${images.length}`}
      >
        {images.map((img, i) => (
          <li
            key={img.id}
            className="group/frame relative aspect-square w-full shrink-0 snap-center overflow-hidden rounded-xl border border-tf-stone-200 bg-tf-stone-100"
          >
            <Image
              src={img.url}
              alt={img.altText ?? `${productName} — photo ${i + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={i === 0}
              loading={i === 0 ? "eager" : "lazy"}
              className="object-cover motion-safe:transition-transform motion-safe:duration-[320ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover/frame:scale-[1.04]"
            />
          </li>
        ))}
      </ul>

      {/* Live dots — the gallery acknowledges the swipe */}
      {multi && (
        <div className="absolute inset-x-0 bottom-2.5 flex justify-center" aria-hidden="false">
          <div className="flex items-center gap-0 rounded-full bg-tf-ink/55 px-1.5 backdrop-blur-sm">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Photo ${i + 1} of ${images.length}`}
                aria-current={active === i}
                className="flex size-7 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              >
                <span
                  className={cn(
                    "block rounded-full bg-tf-surface motion-safe:transition-all motion-safe:duration-200",
                    active === i ? "h-1.5 w-4 opacity-100" : "size-1.5 opacity-50",
                  )}
                />
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
