import * as React from "react";

import { TfProductCard } from "@/components/tf/product-card";
import { TfReveal } from "@/components/tf/motion/tf-reveal";
import type { TfGridProduct } from "@/components/tf/storefront/tf-product-grid";

// ============================================================
// TfDiptych — exactly two products, composed as a pair.
//
// Both eager (there are only two), centred so a half-empty row
// can never appear. Two is a composition, not a shortfall, and
// nothing on screen says "2".
// ============================================================

export function TfDiptych({
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
      <TfReveal
        as="ul"
        stagger
        className="mt-4 grid grid-cols-2 gap-3 sm:max-w-xl sm:gap-4"
      >
        {products.map((product) => (
          <li key={product.id}>
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
              priority
              className="h-full"
            />
          </li>
        ))}
      </TfReveal>
    </section>
  );
}
