// ============================================================
// Featured Carousel — Horizontal scroll of promoted products
// ============================================================

"use client";

import type { MarketplaceProduct } from "@/lib/db/marketplace";
import { MarketplaceProductCard } from "./marketplace-product-card";

interface FeaturedCarouselProps {
  products: MarketplaceProduct[];
}

export function FeaturedCarousel({ products }: FeaturedCarouselProps) {
  if (products.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {products.map((product) => (
        <div
          key={`featured-${product.id}`}
          className="w-[200px] sm:w-[220px] shrink-0"
        >
          <MarketplaceProductCard product={product} compact />
        </div>
      ))}
    </div>
  );
}
