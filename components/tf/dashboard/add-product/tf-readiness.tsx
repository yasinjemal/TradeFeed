"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ChevronDown, Circle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ListingReadiness, ReadinessKey } from "@/lib/products/create-listing";

// ============================================================
// TfReadiness — "4 of 5 ready" for marketplace discovery.
// The collapsed row names the next thing to fix and jumps to
// it; the expanded list shows all five. Publishing never waits
// on this: a listing goes on the seller's own catalogue with a
// name and a price. These five get it found on the marketplace.
// ============================================================

interface TfReadinessProps {
  readiness: ListingReadiness;
  /** Take the seller to the field that fixes this item. */
  onFix: (key: ReadinessKey) => void;
  /** The shop passes the shop-level part of the marketplace gate. */
  shopReady: boolean;
  shopSlug: string;
  className?: string;
}

export function TfReadiness({ readiness, onFix, shopReady, shopSlug, className }: TfReadinessProps) {
  const [open, setOpen] = React.useState(false);
  // One readiness panel per screen, so a fixed id is enough.
  const listId = "add-product-readiness-list";
  const next = readiness.missing[0];

  return (
    <section
      aria-label="Marketplace readiness"
      className={cn("rounded-2xl border border-tf-stone-200 bg-tf-raised shadow-tf-sm", className)}
    >
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-tf-display text-base font-semibold tabular-nums text-tf-ink" aria-live="polite">
            {readiness.doneCount} of {readiness.total} ready
            <span className="ml-1.5 font-sans text-sm font-normal text-tf-stone-600">for the marketplace</span>
          </p>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={listId}
            className="-mr-2 flex min-h-11 cursor-pointer items-center gap-1 rounded-[10px] px-2 text-sm font-medium text-tf-primary outline-none hover:bg-tf-verified-soft focus-visible:ring-2 focus-visible:ring-tf-primary"
          >
            {open ? "Hide" : "See all"}
            <ChevronDown
              aria-hidden="true"
              className={cn("size-4 transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")}
            />
          </button>
        </div>

        {/* Five-segment meter */}
        <div className="mt-1 flex gap-1" aria-hidden="true">
          {readiness.items.map((item) => (
            <span
              key={item.key}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none",
                item.done ? "bg-tf-primary" : "bg-tf-stone-200",
              )}
            />
          ))}
        </div>
      </div>

      {/* Next thing to fix — always visible */}
      <div className="px-4 pb-4 pt-3">
        {next ? (
          <button
            type="button"
            onClick={() => onFix(next.key)}
            className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-[10px] border border-tf-stone-200 bg-tf-stone-50 px-3 text-left text-sm text-tf-ink outline-none hover:border-tf-stone-300 focus-visible:ring-2 focus-visible:ring-tf-primary"
          >
            <Circle aria-hidden="true" className="size-4 shrink-0 text-tf-stone-400" />
            <span className="min-w-0 flex-1">
              <span className="text-tf-stone-600">Missing: </span>
              <span className="font-medium">{next.missing}</span>
              {readiness.missing.length > 1 && (
                <span className="text-tf-stone-600"> and {readiness.missing.length - 1} more</span>
              )}
            </span>
          </button>
        ) : (
          <p className="flex min-h-11 items-center gap-2.5 rounded-[10px] bg-tf-verified-soft px-3 text-sm font-medium text-tf-verified">
            <Check aria-hidden="true" className="size-4 shrink-0" />
            This listing has everything the marketplace asks for
          </p>
        )}

        <ul id={listId} hidden={!open} className="mt-2 divide-y divide-tf-stone-100">
          {readiness.items.map((item) => (
            <li key={item.key}>
              {item.done ? (
                <p className="flex min-h-11 items-center gap-2.5 px-1 text-sm text-tf-stone-600">
                  <Check aria-hidden="true" className="size-4 shrink-0 text-tf-primary" />
                  {item.label}
                  <span className="sr-only">done</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => onFix(item.key)}
                  className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-1 text-left text-sm text-tf-ink outline-none hover:bg-tf-stone-50 focus-visible:ring-2 focus-visible:ring-tf-primary"
                >
                  <Circle aria-hidden="true" className="size-4 shrink-0 text-tf-stone-400" />
                  <span className="flex-1 font-medium">{item.missing}</span>
                </button>
              )}
            </li>
          ))}
        </ul>

        {open && (
          <p className="mt-2 text-xs leading-relaxed text-tf-stone-600">
            You can publish to your own catalogue with a name and a price. These five get the listing
            found on the TradeFeed marketplace too.
          </p>
        )}

        {!shopReady && (
          <p className="mt-2 text-xs leading-relaxed text-tf-stone-600">
            Your shop setup is not finished, so your listings do not appear on the marketplace
            yet.{" "}
            <Link
              href={`/dashboard/${shopSlug}/readiness`}
              className="font-medium text-tf-primary underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-tf-primary"
            >
              Finish shop setup
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
