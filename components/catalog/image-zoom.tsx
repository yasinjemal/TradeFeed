"use client";

import Image from "next/image";
import { useState, useCallback, useEffect } from "react";

interface ImageZoomProps {
  src: string;
  alt: string;
  onClose: () => void;
}

/**
 * Full-screen image lightbox with pinch/zoom feel.
 * Opens when a user taps the main product image.
 */
export function ImageZoom({ src, alt, onClose }: ImageZoomProps) {
  const [scale, setScale] = useState(1);

  const toggleZoom = useCallback(() => {
    setScale((s) => (s === 1 ? 2 : 1));
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        aria-label="Close"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Zoom hint */}
      {scale === 1 && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 rounded-full bg-white/10 px-4 py-1.5 text-xs text-white/70 backdrop-blur-sm">
          Tap image to zoom
        </p>
      )}

      {/* Image container */}
      <div
        className="relative h-full w-full cursor-zoom-in overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex min-h-full min-w-full items-center justify-center p-4 transition-transform duration-300 ease-out"
          style={{ transform: `scale(${scale})` }}
          onClick={toggleZoom}
        >
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={1200}
            className="max-h-[90vh] w-auto object-contain"
            quality={90}
            priority
          />
        </div>
      </div>
    </div>
  );
}
