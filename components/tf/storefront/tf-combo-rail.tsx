import Image from "next/image";
import Link from "next/link";
import { Boxes } from "lucide-react";

import { formatZAR } from "@/components/tf/format";

// ============================================================
// TfComboRail — combo deals as a horizontal rail of quiet cards.
// Each card links to the combo detail page. Savings vs retail
// are shown as a plain "Save R…" line, not a shouting badge.
// ============================================================

export interface TfCombo {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  retailPriceCents: number | null;
  stock: number;
  items: { id: string; productName: string; variantLabel: string | null; quantity: number }[];
  images: { url: string; altText: string | null }[];
}

export function TfComboRail({ combos, shopSlug }: { combos: TfCombo[]; shopSlug: string }) {
  if (combos.length === 0) return null;

  return (
    <section aria-label="Combo deals">
      <h2 className="mb-2.5 flex items-center gap-2 font-tf-display text-lg font-semibold text-tf-ink">
        <Boxes aria-hidden="true" className="size-5 text-tf-primary" />
        Combo deals
      </h2>
      <div className="-mx-3 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-4 sm:px-4">
        <ul className="flex w-max gap-3">
          {combos.map((combo) => {
            const savings =
              combo.retailPriceCents != null && combo.retailPriceCents > combo.priceCents
                ? combo.retailPriceCents - combo.priceCents
                : null;
            const itemCount = combo.items.reduce((sum, item) => sum + item.quantity, 0);
            const image = combo.images[0];
            return (
              <li key={combo.id} className="w-[220px] shrink-0">
                <Link
                  href={`/catalog/${shopSlug}/combos/${combo.id}`}
                  className="tf-card-tactile flex h-full flex-col overflow-hidden rounded-2xl border border-tf-stone-200 bg-tf-raised shadow-tf-sm outline-none focus-visible:ring-2 focus-visible:ring-tf-primary"
                >
                  <div className="relative aspect-[4/3] w-full bg-tf-stone-100">
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.altText ?? combo.name}
                        fill
                        sizes="220px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-tf-stone-400">
                        <Boxes aria-hidden="true" className="size-8" />
                      </div>
                    )}
                    {combo.stock === 0 && (
                      <span className="absolute inset-x-0 bottom-0 bg-tf-ink/80 py-1 text-center text-[11px] font-medium text-tf-surface">
                        Sold out
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <p className="line-clamp-2 text-sm font-medium text-tf-ink">{combo.name}</p>
                    <p className="text-xs text-tf-stone-500">
                      {itemCount} item{itemCount === 1 ? "" : "s"} bundled
                    </p>
                    <p className="mt-auto pt-1">
                      <span className="text-base font-semibold tabular-nums text-tf-ink">
                        {formatZAR(combo.priceCents / 100)}
                      </span>
                      {savings != null && (
                        <span className="ml-2 text-xs font-medium text-tf-verified">
                          Save {formatZAR(savings / 100)}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
