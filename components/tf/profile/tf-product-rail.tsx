import * as React from "react";

import { cn } from "@/lib/utils";
import { TfProductCard } from "@/components/tf/product-card";
import { TfReveal } from "@/components/tf/motion/tf-reveal";
import type { TfGridProduct } from "@/components/tf/storefront/tf-product-grid";

// ============================================================
// TfProductRail — 3 to 7 products.
//
// Enough to browse, not enough to search. The lead card is wider
// and eager; everything after it is lazy. No search box, no sort,
// no category pills — a filter UI over five items advertises the
// five that are not there.
// ============================================================

export function TfProductRail({
  products,
  shopSlug,
  shopName,
  shopVerified,
  whatsappNumber,
}: {
  products: TfGridProduct[];
  shopSlug: string;
  shopName: string;
  shopVerified: boolean;
  whatsappNumber: string;
}) {
  return (
    <section aria-label={`What ${shopName} is selling`}>
      <h2 className="font-tf-display text-xl font-semibold text-tf-ink">
        What {shopName} is selling
      </h2>
      {/* tf-counter-rail lays one continuous bar under the whole row —
          the same surface the proof rail stands on. Each card then adds
          only its own contact shadow, so the shelf reads as one plank
          with objects on it rather than a strip of separate tiles.
          pb-7 keeps that bar inside the scroll container; at pb-2 the
          overflow clipped it. */}
      <TfReveal
        as="ul"
        stagger
        className="tf-rail tf-counter-rail tf-nudge -mx-4 mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-7 overscroll-x-contain"
      >
        {products.map((product, index) => (
          <li
            key={product.id}
            className={cn(
              "tf-shelf-contact shrink-0 snap-start",
              index === 0 ? "w-[76vw] max-w-[300px]" : "w-[66vw] max-w-[260px]",
            )}
          >
            {/* Settle on its own element: .tf-stagger > * already owns
                transform and animation on the <li>, including the
                tf-autoshow failsafe. See tf-product-grid.tsx. */}
            <div className="tf-shelf-settle h-full">
              <TfProductCard
                href={`/catalog/${shopSlug}/products/${product.slug ?? product.id}`}
                title={product.name}
                price={product.minPriceCents / 100}
                priceFrom={
                  product.maxPriceCents != null &&
                  product.minPriceCents !== product.maxPriceCents
                }
                imageUrl={product.imageUrl}
                imageAlt={product.imageAlt ?? product.name}
                videoPreviewUrl={product.videoUrl}
                videoKind={product.videoKind}
                sellerName={shopName}
                sellerVerified={shopVerified}
                whatsappNumber={whatsappNumber}
                priority={index === 0}
                shelf="rail"
                className="h-full"
              />
            </div>
          </li>
        ))}
      </TfReveal>
    </section>
  );
}
