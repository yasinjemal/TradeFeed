"use client";
import { useState } from "react";
import { useCart } from "@/lib/cart/cart-context";
import { TfCartPanel } from "@/components/tf/checkout/tf-cart-panel";
export function CatalogCart() {
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 rounded-lg border border-tf-stone-300 px-3 text-sm font-semibold text-tf-ink"
        aria-label={"Open cart, " + totalItems + " items"}
      >
        Cart ({totalItems})
      </button>
      <TfCartPanel isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
