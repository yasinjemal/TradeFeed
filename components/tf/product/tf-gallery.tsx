import * as React from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

// ============================================================
// TfGallery — swipeable product gallery. CSS scroll-snap (no
// JS), first image eager, the rest lazy. Square frames keep
// the grid consistent with background-removed photos.
// ============================================================

interface TfGalleryProps {
  images: { id: string; url: string; altText: string | null }[];
  productName: string;
  soldOut?: boolean;
}

export function TfGallery({ images, productName, soldOut = false }: TfGalleryProps) {
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
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-xl scrollbar-hide"
        aria-label={`${productName} photos`}
      >
        {images.map((img, i) => (
          <li
            key={img.id}
            className="relative aspect-square w-full shrink-0 snap-center overflow-hidden rounded-xl border border-tf-stone-200 bg-tf-stone-100"
          >
            <Image
              src={img.url}
              alt={img.altText ?? `${productName} — photo ${i + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={i === 0}
              loading={i === 0 ? "eager" : "lazy"}
              className="object-cover"
            />
          </li>
        ))}
      </ul>
      {images.length > 1 && (
        <span className="absolute bottom-3 right-3 rounded-full bg-tf-ink/70 px-2.5 py-1 text-xs font-medium tabular-nums text-tf-surface">
          {images.length} photos — swipe
        </span>
      )}
      {soldOut && (
        <span className="absolute left-3 top-3 rounded-full bg-tf-ink/80 px-3 py-1 text-xs font-semibold text-tf-surface">
          Sold out
        </span>
      )}
    </div>
  );
}
