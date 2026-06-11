"use client";

import * as React from "react";
import { MessageCircle, Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { TfButton } from "@/components/tf/button";
import { formatZAR } from "@/components/tf/format";

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
  stock: number;
}

interface TfOrderPanelProps {
  productName: string;
  productUrl: string;
  shopName: string;
  whatsappNumber: string;
  variants: TfVariant[];
  option1Label: string;
  option2Label: string;
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
          ? "border-tf-primary bg-tf-verified-soft font-medium text-tf-deep"
          : "border-tf-stone-300 bg-tf-raised text-tf-stone-600 hover:border-tf-stone-400",
        disabled && "cursor-not-allowed opacity-40 line-through",
      )}
    >
      {children}
    </button>
  );
}

export function TfOrderPanel({
  productName,
  productUrl,
  shopName,
  whatsappNumber,
  variants,
  option1Label,
  option2Label,
}: TfOrderPanelProps) {
  const sizes = React.useMemo(
    () => Array.from(new Set(variants.map((v) => v.size))),
    [variants],
  );
  const hasColors = variants.some((v) => v.color);

  const [size, setSize] = React.useState<string | null>(sizes.length === 1 ? sizes[0]! : null);
  const [color, setColor] = React.useState<string | null>(null);
  const [qty, setQty] = React.useState(1);

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
  const unitCents = selected?.priceInCents ?? Math.min(...variants.map((v) => v.priceInCents));
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
    `Quantity: ${qty}`,
    `Price: ${formatZAR(unitCents / 100)} each — ${formatZAR(totalCents / 100)} total`,
    "",
    productUrl,
  ]
    .filter((l) => l !== null)
    .join("\n");
  const waHref = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(waMessage)}`;

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
        {/* Price */}
        <p className="flex items-baseline gap-2 tabular-nums">
          <span className="font-tf-display text-3xl font-semibold text-tf-ink">
            {formatZAR(unitCents / 100)}
          </span>
          {qty > 1 && (
            <span className="text-sm text-tf-stone-500">× {qty} = {formatZAR(totalCents / 100)}</span>
          )}
        </p>

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
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-tf-ink">Quantity</span>
            <div className="flex items-center rounded-full border border-tf-stone-300 bg-tf-raised">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="flex size-11 items-center justify-center rounded-full text-tf-stone-600 outline-none hover:bg-tf-stone-100 focus-visible:ring-2 focus-visible:ring-tf-primary disabled:opacity-40"
                disabled={qty <= 1}
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
        )}

        {/* Inline CTA (desktop & in-flow mobile) */}
        <div className="hidden lg:block">{cta(true)}</div>
        <p className="text-xs text-tf-stone-500">
          Opens WhatsApp with your order pre-filled — {shopName} confirms availability,
          payment and delivery with you there.
        </p>
      </div>

      {/* Sticky mobile bar — same wording, same promise */}
      <div className="fixed inset-x-0 bottom-[3.5rem] z-30 border-t border-tf-stone-200 bg-tf-raised/95 px-4 py-2.5 backdrop-blur-sm lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-tf-stone-500">{productName}</p>
            <p className="text-base font-semibold tabular-nums text-tf-ink">
              {formatZAR(totalCents / 100)}
            </p>
          </div>
          <div className="shrink-0">{cta(false)}</div>
        </div>
      </div>
    </>
  );
}
