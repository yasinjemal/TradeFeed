import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { TfButton } from "@/components/tf/button";
import { TfReveal } from "@/components/tf/motion/tf-reveal";
import { TrackedWhatsAppLink } from "@/components/analytics/tracked-whatsapp-link";
import { formatZAR } from "@/components/tf/format";
import type { TfGridProduct } from "@/components/tf/storefront/tf-product-grid";

// ============================================================
// TfSingleShowcase — one product, presented as a flagship.
//
// A grid of one looks broken; a plinth of one looks curated. The
// word "product" and the number 1 never appear. The contact
// ellipse is a static pseudo-element, not a mask-driven shadow —
// remove-background returns opaque white JPEGs, so there is no
// transparency to cast from.
//
// "The Settle": the frame reveals, and the CTA beneath it lands
// one beat later (--tf-d: 120ms). That offset is the signature.
// ============================================================

export function TfSingleShowcase({
  product,
  shopSlug,
  shopId,
  shopName,
  whatsappNumber,
}: {
  product: TfGridProduct;
  shopSlug: string;
  shopId: string;
  shopName: string;
  whatsappNumber: string;
}) {
  const href = `/catalog/${shopSlug}/products/${product.slug ?? product.id}`;
  const price = formatZAR(product.minPriceCents / 100);
  const fromPrice =
    product.maxPriceCents != null && product.maxPriceCents !== product.minPriceCents;

  const waHref = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    `Hi ${shopName}, I would like to order the ${product.name}.`,
  )}`;

  return (
    <section aria-label={`What ${shopName} is selling`}>
      <h2 className="font-tf-display text-xl font-semibold text-tf-ink">
        What {shopName} is selling
      </h2>

      <div className="tf-plinth tf-shelf-settle relative mt-4">
        <TfReveal>
          <Link
            href={href}
            className="tf-card-tactile block overflow-hidden rounded-3xl border border-tf-stone-200 bg-tf-raised outline-none focus-visible:ring-2 focus-visible:ring-tf-primary"
          >
            <div className="relative aspect-[4/5] w-full bg-tf-stone-100">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.imageAlt ?? product.name}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, 560px"
                  className="tf-card-img object-cover"
                />
              ) : null}
            </div>
            <div className="p-5">
              <h3 className="font-tf-display text-2xl font-semibold leading-tight text-tf-ink">
                {product.name}
              </h3>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-tf-ink">
                {fromPrice ? `From ${price}` : price}
              </p>
            </div>
          </Link>
        </TfReveal>
      </div>

      <TfReveal className="tf-settle mt-6">
        <TfButton asChild variant="whatsapp" fullWidth size="lg">
          <TrackedWhatsAppLink
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            shopId={shopId}
            productId={product.id}
          >
            <MessageCircle aria-hidden="true" />
            Order this on WhatsApp
          </TrackedWhatsAppLink>
        </TfButton>
      </TfReveal>
    </section>
  );
}
