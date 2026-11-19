import Image from "next/image";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatZAR } from "@/components/tf/format";

// ============================================================
// TfBuyersSee — a live preview of the listing as buyers get it.
// The card on the left copies TfProductCard's body (same ratio,
// type and price formatting), so what the seller sees while
// typing is what lands on their catalogue. The right side lists
// what a buyer can pick on the product page.
//
// Only real data appears here. There is no "was" price, because
// the catalogue has no compare-at price to show buyers.
// ============================================================

export interface TfBuyersSeeProps {
  name: string;
  /** Raw price field value, in rands. */
  priceInRands: string;
  /** Local preview or CDN URL of the chosen photo. */
  imageUrl: string | null;
  shopName: string;
  /** Label of the first option axis, e.g. "Size" or "Storage". */
  optionLabel: string;
  /** Real sizes the seller added; empty when there is a single option. */
  sizes: { size: string; stock: number }[];
  totalStock: number;
  /** False when the seller has switched "Show on catalogue" off. */
  visible: boolean;
  className?: string;
}

export function TfBuyersSee({
  name,
  priceInRands,
  imageUrl,
  shopName,
  optionLabel,
  sizes,
  totalStock,
  visible,
  className,
}: TfBuyersSeeProps) {
  const price = Number.parseFloat(priceInRands.replace(",", "."));
  const hasPrice = Number.isFinite(price) && price > 0;
  const title = name.trim();
  const soldOut = totalStock <= 0;

  return (
    <section
      aria-label="Buyers see"
      className={cn("rounded-2xl border border-tf-stone-200 bg-tf-raised p-4 shadow-tf-sm", className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-tf-display text-base font-semibold text-tf-ink">Buyers see</h2>
        <p className="text-xs text-tf-stone-600">
          {visible ? "Updates as you type" : "Hidden until you publish"}
        </p>
      </div>

      <div className="mt-3 flex gap-4">
        {/* ── The catalogue card ─────────────────────────── */}
        <div
          aria-hidden="true"
          className={cn(
            "w-[9.5rem] shrink-0 overflow-hidden rounded-2xl border border-tf-stone-200 bg-tf-raised shadow-tf-sm",
            !visible && "opacity-60",
          )}
        >
          <div className="relative aspect-[4/5] bg-tf-stone-100">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                fill
                unoptimized={imageUrl.startsWith("blob:")}
                loading="eager"
                sizes="152px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-tf-stone-300">
                <ImageOff className="size-8" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1 p-3">
            <p
              className={cn(
                "line-clamp-2 min-h-[2.2rem] text-[13px] font-medium leading-snug",
                title ? "text-tf-ink" : "text-tf-stone-400",
              )}
            >
              {title || "Product name"}
            </p>
            <p
              className={cn(
                "font-tf-display text-[15px] font-bold tabular-nums",
                hasPrice ? "text-tf-ink" : "text-tf-stone-400",
              )}
            >
              {hasPrice ? formatZAR(price) : "R —"}
            </p>
            <p className="truncate text-[11px] text-tf-stone-400">{shopName}</p>
          </div>
        </div>

        {/* ── What they can pick ─────────────────────────── */}
        <dl className="min-w-0 flex-1 space-y-3 text-sm">
          <div>
            <dt className="text-xs text-tf-stone-600">Price</dt>
            <dd className="font-tf-display text-xl font-bold tabular-nums text-tf-ink">
              {hasPrice ? formatZAR(price) : <span className="text-tf-stone-400">Not set</span>}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-tf-stone-600">
              {sizes.length > 0 ? `${optionLabel} to choose` : "Availability"}
            </dt>
            <dd className="mt-1">
              {sizes.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {sizes.map((entry) => (
                    <li
                      key={entry.size}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium",
                        entry.stock > 0
                          ? "border-tf-stone-300 text-tf-ink"
                          : "border-tf-stone-200 text-tf-stone-400 line-through",
                      )}
                    >
                      {entry.size}
                    </li>
                  ))}
                </ul>
              ) : (
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                    soldOut
                      ? "bg-tf-accent-soft text-tf-accent-ink"
                      : "bg-tf-verified-soft text-tf-verified",
                  )}
                >
                  {soldOut ? "Sold out" : `${totalStock} in stock`}
                </span>
              )}
            </dd>
          </div>

          {sizes.length > 0 && (
            <p className={cn("text-xs", soldOut ? "text-tf-accent-ink" : "text-tf-stone-600")}>
              {soldOut ? "Every option is sold out" : `${totalStock} in stock across ${sizes.length} option${sizes.length === 1 ? "" : "s"}`}
            </p>
          )}
        </dl>
      </div>
    </section>
  );
}
