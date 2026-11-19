import * as React from "react";

import {
  TfStorefrontGrid,
  type TfGridProduct,
} from "@/components/tf/storefront/tf-product-grid";
import type { TfStageMode } from "@/lib/seller/stage-mode";
import { TfDiptych } from "./tf-diptych";
import { TfProductRail } from "./tf-product-rail";
import { TfSingleShowcase } from "./tf-single-showcase";

// ============================================================
// TfInventoryBlock — the one place the density ladder lives.
//
// The ladder changes SHAPE, not length: 0 renders nothing at all
// (no dashed box, no "0 products", no product-shaped container
// for a hole to appear in), 1 is a plinth, 2 a diptych, 3-7 a
// rail, 8+ the full grid with its search and sort finally
// justified by having something to search.
// ============================================================

export function TfInventoryBlock({
  mode,
  products,
  shopId,
  shopSlug,
  shopName,
  shopVerified,
  whatsappNumber,
}: {
  mode: TfStageMode;
  products: TfGridProduct[];
  shopId: string;
  shopSlug: string;
  shopName: string;
  shopVerified: boolean;
  whatsappNumber: string;
}) {
  switch (mode) {
    case "ask":
      // Nothing. The Ask Dock and the Proof Rail carry this rung.
      return null;

    case "plinth": {
      const first = products[0];
      if (!first) return null;
      return (
        <TfSingleShowcase
          product={first}
          shopId={shopId}
          shopSlug={shopSlug}
          shopName={shopName}
          whatsappNumber={whatsappNumber}
        />
      );
    }

    case "diptych":
      return (
        <TfDiptych
          products={products}
          shopSlug={shopSlug}
          shopName={shopName}
          shopVerified={shopVerified}
          whatsappNumber={whatsappNumber}
        />
      );

    case "rail":
      return (
        <TfProductRail
          products={products}
          shopSlug={shopSlug}
          shopName={shopName}
          shopVerified={shopVerified}
          whatsappNumber={whatsappNumber}
        />
      );

    case "grid":
    case "grid-dense":
      return (
        <TfStorefrontGrid
          products={products}
          shopSlug={shopSlug}
          sellerName={shopName}
          sellerVerified={shopVerified}
          whatsappNumber={whatsappNumber}
          dense={mode === "grid-dense"}
          // The shelf is the profile's own; the same grid renders on the
          // live TF storefront, which must stay exactly as it is.
          shelf
        />
      );
  }
}
