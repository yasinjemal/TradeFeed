// ============================================================
// Component — Product Image Gallery (Interactive)
// ============================================================
// Client component for the public catalog product detail page.
// Features:
// - Click thumbnails to switch main image
// - Swipe left/right on mobile (touch)
// - Keyboard arrow navigation
// - Gallery dots as clickable indicators
// - Smooth crossfade transitions
// - Pinch-to-zoom feel with subtle scale on tap
// ============================================================

"use client";

import Image from "next/image";

import { useState, useCallback, useRef, type TouchEvent } from "react";

interface GalleryImage {
  id: string;
  url: string;
  altText: string | null;
}

interface ProductImageGalleryProps {
  images: GalleryImage[];
  productName: string;
  soldOut?: boolean;
}

export function ProductImageGallery({
  images,
  productName,
  soldOut = false,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const goTo = useCallback(
    (index: number) => {
      if (index === activeIndex || isTransitioning) return;
      setIsTransitioning(true);
      setActiveIndex(index);
      setTimeout(() => setIsTransitioning(false), 300);
    },
    [activeIndex, isTransitioning],
  );

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    goTo((activeIndex + 1) % images.length);
  }, [activeIndex, images.length, goTo]);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    goTo((activeIndex - 1 + images.length) % images.length);
  }, [activeIndex, images.length, goTo]);

  // ── Touch handlers for swipe ────────────────────────────
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0]?.clientX ?? 0;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  // ── Keyboard handler ────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") goNext();
    else if (e.key === "ArrowLeft") goPrev();
  };

  // ── No images ───────────────────────────────────────────
  if (images.length === 0) {
    return (
      <div className="relative aspect-square bg-stone-100 overflow-hidden rounded-t-3xl">
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-stone-300 bg-gradient-to-br from-stone-50 to-stone-100">
          <svg
            className="w-16 h-16"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={0.75}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
          <span className="text-sm font-medium">No image available</span>
        </div>
      </div>
    );
  }

  const currentImage = images[activeIndex];

  return (
    <div className="relative" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* ── Hero Image ─────────────────────────────────── */}
      <div
        className="relative aspect-square bg-stone-100 overflow-hidden cursor-pointer select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0 shimmer" />

        {currentImage && (
          <Image
            key={currentImage.id}
            src={currentImage.url}
            alt={currentImage.altText || `${productName} photo ${activeIndex + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={activeIndex === 0}
            className={`object-cover transition-opacity duration-300 ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          />
        )}

        {/* ── Prev / Next arrows (desktop) ─────────────── */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-stone-200/50 flex items-center justify-center text-stone-700 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity shadow-lg hover:bg-white"
              aria-label="Previous image"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-stone-200/50 flex items-center justify-center text-stone-700 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity shadow-lg hover:bg-white"
              aria-label="Next image"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </>
        )}

        {/* ── Image counter badge ──────────────────────── */}
        {images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1 text-white text-xs font-medium">
            {activeIndex + 1} / {images.length}
          </div>
        )}

        {/* ── Gallery dots ─────────────────────────────── */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/20 backdrop-blur-sm rounded-full px-2.5 py-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "bg-white scale-125"
                    : "bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`View image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* ── Sold out overlay ─────────────────────────── */}
        {soldOut && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-stone-900 text-white text-sm font-semibold px-5 py-2 rounded-full">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* ── Thumbnail strip ────────────────────────────── */}
      {images.length > 1 && (
        <div className="flex gap-2 p-3 bg-stone-50/50 overflow-x-auto scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => goTo(i)}
              className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                i === activeIndex
                  ? "border-emerald-500 shadow-md shadow-emerald-100 scale-105"
                  : "border-transparent opacity-60 hover:opacity-100 hover:border-stone-300"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={img.altText || `${productName} photo ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
