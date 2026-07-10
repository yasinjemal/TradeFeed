"use client";

import * as React from "react";
import { MessageCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { TfButton } from "@/components/tf/button";
import { formatZAR } from "@/components/tf/format";
import { useCart } from "@/lib/cart/cart-context";
import {
  applicableTier,
  effectiveUnitPriceCents,
  nextTierNudge,
  type BulkDiscountTier,
  type OrderType,
} from "@/lib/cart/pricing";
import { trackAddToCartAction } from "@/app/actions/analytics";

// ============================================================
// TfOrderPanel — variant selection + the order handoff.
// One promise, stated twice with the same words: the inline
// CTA and the sticky mobile bar both say "Order on WhatsApp",
// and the pre-filled message repeats exactly what was chosen.
// ============================================================

export interface TfVariant {
  id: string;
  size: string;
  color: string | null;
  priceInCents: number;
  retailPriceCents: number | null;
  stock: number;
}

interface TfOrderPanelProps {
  productId: string;
  productName: string;
  productUrl: string;
  shopId: string;
  shopName: string;
  whatsappNumber: string;
  variants: TfVariant[];
  option1Label: string;
  option2Label: string;
  /** First product image — shown as the cart line thumbnail */
  imageUrl?: string | null;
  minWholesaleQty?: number;
  bulkDiscountTiers?: BulkDiscountTier[];
}

function Pill({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "min-h-11 rounded-full border px-4 text-sm transition-colors motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-tf-primary",
        active
          ? "border-tf-ink bg-tf-ink font-medium text-white"
          : "border-tf-stone-200 bg-tf-raised text-tf-stone-600 hover:border-tf-stone-400 hover:text-tf-ink",
        disabled && "cursor-not-allowed opacity-40 line-through",
      )}
    >
      {children}
    </button>
  );
}

export function TfOrderPanel({
  productId,
  productName,
  productUrl,
  shopId,
  shopName,
  whatsappNumber,
  variants,
  option1Label,
  option2Label,
  imageUrl,
  minWholesaleQty = 1,
  bulkDiscountTiers = [],
}: TfOrderPanelProps) {
  const { addItem } = useCart();
  const sizes = React.useMemo(
    () => Array.from(new Set(variants.map((v) => v.size))),
    [variants],
  );
  const hasColors = variants.some((v) => v.color);
  // Retail availability is driven by product data, not shop config
  const hasRetail = variants.some((v) => v.retailPriceCents != null && v.retailPriceCents > 0);

  const [size, setSize] = React.useState<string | null>(sizes.length === 1 ? sizes[0]! : null);
  const [color, setColor] = React.useState<string | null>(null);
  const [orderType, setOrderType] = React.useState<OrderType>("wholesale");
  const minQty = orderType === "retail" ? 1 : Math.max(1, minWholesaleQty);
  const [qty, setQty] = React.useState(Math.max(1, minWholesaleQty));

  const switchOrderType = (type: OrderType) => {
    setOrderType(type);
    const nextMin = type === "retail" ? 1 : Math.max(1, minWholesaleQty);
    setQty((q) => Math.max(nextMin, q));
  };

  const colorsForSize = React.useMemo(() => {
    if (!hasColors) return [];
    const pool = size ? variants.filter((v) => v.size === size) : variants;
    return Array.from(new Set(pool.map((v) => v.color).filter(Boolean))) as string[];
  }, [variants, size, hasColors]);

  const selected = React.useMemo(() => {
    return (
      variants.find(
        (v) => (!size || v.size === size) && (!hasColors || !color || v.color === color),
      ) ?? null
    );
  }, [variants, size, color, hasColors]);

  const exactSelection = size != null && (!hasColors || colorsForSize.length === 0 || color != null);
  const baseWholesaleCents = selected?.priceInCents ?? Math.min(...variants.map((v) => v.priceInCents));
  const unitCents = effectiveUnitPriceCents({
    orderType,
    wholesalePriceCents: baseWholesaleCents,
    retailPriceCents: selected?.retailPriceCents ?? null,
    quantity: qty,
    bulkDiscountTiers,
  });
  const activeTier = orderType === "wholesale" ? applicableTier(qty, bulkDiscountTiers) : null;
  const tierNudge = orderType === "wholesale" ? nextTierNudge(qty, bulkDiscountTiers) : null;
  const maxQty = exactSelection && selected ? Math.max(1, selected.stock) : 99;
  const totalCents = unitCents * qty;
  const totalStock = variants.reduce((s, v) => s + v.stock, 0);
  const soldOut = totalStock === 0;

  const sizeInStock = (s: string) =>
    variants.some((v) => v.size === s && v.stock > 0);

  const waMessage = [
    `Hi ${shopName}! I'd like to order:`,
    "",
    `*${productName}*`,
    size ? `${option1Label}: ${size}` : null,
    color ? `${option2Label}: ${color}` : null,
    hasRetail ? `Order type: ${orderType === "retail" ? "Retail" : "Wholesale"}` : null,
    `Quantity: ${qty}`,
    `Price: ${formatZAR(unitCents / 100)} each — ${formatZAR(totalCents / 100)} total${activeTier ? ` (${activeTier.discountPercent}% bulk discount)` : ""}`,
    "",
    productUrl,
  ]
    .filter((l) => l !== null)
    .join("\n");
  const waHref = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(waMessage)}`;

  const canAddToCart = !soldOut && exactSelection && selected != null && selected.stock > 0;

  const handleAddToCart = () => {
    if (!canAddToCart || !selected) return;
    const lineUnitCents = effectiveUnitPriceCents({
      orderType,
      wholesalePriceCents: selected.priceInCents,
      retailPriceCents: selected.retailPriceCents,
      quantity: qty,
      bulkDiscountTiers,
    });
    addItem(
      {
        variantId: selected.id,
        productId,
        productName,
        imageUrl: imageUrl ?? undefined,
        size: selected.size,
        color: selected.color,
        option1Label,
        option2Label,
        priceInCents: lineUnitCents,
        maxStock: selected.stock,
        minWholesaleQty,
        orderType,
      },
      qty,
    );
    void trackAddToCartAction(shopId, productId);
    toast.success(`${productName} added to cart`, {
      description: `${qty}× ${selected.size}${selected.color ? ` / ${selected.color}` : ""} — ${formatZAR((lineUnitCents * qty) / 100)}${orderType === "retail" ? " (retail)" : ""}`,
      duration: 2500,
    });
  };

  const addToCartButton = (full: boolean) => (
    <TfButton
      type="button"
      variant="secondary"
      size={full ? "lg" : "icon"}
      fullWidth={full}
      onClick={handleAddToCart}
      disabled={!canAddToCart}
      aria-label={full ? undefined : "Add to cart"}
      title={canAddToCart ? undefined : soldOut ? "Sold out" : `Choose a ${option1Label.toLowerCase()} first`}
    >
      <ShoppingBag aria-hidden="true" className="size-5" />
      {full && "Add to cart"}
    </TfButton>
  );

  const cta = (full: boolean) => (
    <TfButton
      asChild
      variant="whatsapp"
      size="lg"
      fullWidth={full}
      aria-disabled={soldOut}
      className={cn(soldOut && "pointer-events-none opacity-50")}
    >
      <a href={soldOut ? undefined : waHref} target="_blank" rel="noopener noreferrer">
        <MessageCircle aria-hidden="true" />
        Order on WhatsApp
      </a>
    </TfButton>
  );

  return (
    <>
      <div className="space-y-4">
        {/* Wholesale / retail toggle — only when the product carries both prices */}
        {hasRetail && (
          <fieldset>
            <legend className="sr-only">Order type</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["wholesale", `Wholesale${minWholesaleQty > 1 ? ` (min ${minWholesaleQty})` : ""}`],
                  ["retail", "Retail (single items)"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-center rounded-[10px] border px-2 text-sm transition-colors motion-reduce:transition-none",
                    orderType === value
                      ? "border-tf-primary bg-tf-verified-soft font-medium text-tf-verified"
                      : "border-tf-stone-300 bg-tf-raised text-tf-stone-600 hover:border-tf-stone-400",
                  )}
                >
                  <input
                    type="radio"
                    name="tf-order-type"
                    checked={orderType === value}
                    onChange={() => switchOrderType(value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* Price */}
        <p className="flex items-baseline gap-3 tabular-nums">
          <span
            className="font-tf-hero text-tf-ink"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 1, letterSpacing: "-0.04em", fontWeight: 700 }}
          >
            {formatZAR(unitCents / 100)}
          </span>
          {activeTier && (
            <span className="rounded-full bg-tf-verified-soft px-2 py-0.5 text-xs font-medium text-tf-verified">
              {activeTier.discountPercent}% bulk discount
            </span>
          )}
          {qty > 1 && (
            <span className="text-sm text-tf-stone-500">× {qty} = <span className="font-semibold text-tf-ink">{formatZAR(totalCents / 100)}</span></span>
          )}
        </p>

        {/* Bulk tiers — quiet chips, wholesale only */}
        {orderType === "wholesale" && bulkDiscountTiers.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Bulk discounts">
            {[...bulkDiscountTiers]
              .sort((a, b) => a.minQuantity - b.minQuantity)
              .map((tier) => (
                <span
                  key={tier.minQuantity}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium tabular-nums",
                    activeTier?.minQuantity === tier.minQuantity
                      ? "border-tf-verified/40 bg-tf-verified-soft text-tf-verified"
                      : "border-tf-stone-200 bg-tf-stone-50 text-tf-stone-600",
                  )}
                >
                  {tier.minQuantity}+ units · {tier.discountPercent}% off
                </span>
              ))}
          </div>
        )}

        {/* Option 1 */}
        {sizes.length > 1 && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-tf-ink">{option1Label}</legend>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <Pill
                  key={s}
                  active={size === s}
                  disabled={!sizeInStock(s)}
                  onClick={() => {
                    setSize(size === s ? null : s);
                    setColor(null);
                  }}
                >
                  {s}
                </Pill>
              ))}
            </div>
          </fieldset>
        )}

        {/* Option 2 */}
        {colorsForSize.length > 0 && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-tf-ink">{option2Label}</legend>
            <div className="flex flex-wrap gap-2">
              {colorsForSize.map((c) => (
                <Pill key={c} active={color === c} onClick={() => setColor(color === c ? null : c)}>
                  {c}
                </Pill>
              ))}
            </div>
          </fieldset>
        )}

        {/* Quantity */}
        {!soldOut && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-tf-ink">Quantity</span>
              <div className="flex items-center rounded-full border border-tf-stone-300 bg-tf-raised">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(minQty, q - 1))}
                  aria-label="Decrease quantity"
                  className="flex size-11 items-center justify-center rounded-full text-tf-stone-600 outline-none hover:bg-tf-stone-100 focus-visible:ring-2 focus-visible:ring-tf-primary disabled:opacity-40"
                  disabled={qty <= minQty}
                >
                  <Minus className="size-4" />
                </button>
                <span className="min-w-8 text-center text-sm font-medium tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  aria-label="Increase quantity"
                  className="flex size-11 items-center justify-center rounded-full text-tf-stone-600 outline-none hover:bg-tf-stone-100 focus-visible:ring-2 focus-visible:ring-tf-primary disabled:opacity-40"
                  disabled={qty >= maxQty}
                >
                  <Plus className="size-4" />
                </button>
              </div>
              {exactSelection && selected && selected.stock > 0 && selected.stock <= 5 && (
                <span className="text-xs font-medium tabular-nums text-tf-accent-ink">
                  Only {selected.stock} left
                </span>
              )}
            </div>
            {orderType === "wholesale" && minWholesaleQty > 1 && (
              <p className="text-xs text-tf-stone-500">Minimum order: {minWholesaleQty} units</p>
            )}
            {tierNudge && qty < maxQty && (
              <p className="text-xs font-medium text-tf-verified" aria-live="polite">
                Add {tierNudge.addMore} more for {tierNudge.discountPercent}% off
              </p>
            )}
          </div>
        )}

        {/* Inline CTAs — WhatsApp is the promise, cart is the second path */}
        <div className="hidden space-y-2 lg:block">
          {cta(true)}
          {addToCartButton(true)}
        </div>
        <p className="text-xs text-tf-stone-400">
          Opens WhatsApp pre-filled &mdash; {shopName} confirms availability &amp; delivery.
        </p>
      </div>

      {/* Sticky mobile bar — same wording, same promise */}
      <div className="tf-slide-up fixed inset-x-0 bottom-[3.5rem] z-30 border-t border-tf-stone-200 bg-tf-raised/95 px-4 py-2.5 backdrop-blur-sm lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-tf-stone-500">{productName}</p>
            <p className="text-base font-semibold tabular-nums text-tf-ink">
              {formatZAR(totalCents / 100)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {addToCartButton(false)}
            {cta(false)}
          </div>
        </div>
      </div>
    </>
  );
}
