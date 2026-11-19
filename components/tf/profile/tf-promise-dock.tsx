import * as React from "react";
import Link from "next/link";
import { Clock, PackageCheck, RotateCcw, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { TfReveal } from "@/components/tf/motion/tf-reveal";
import { TrackedWhatsAppLink } from "@/components/analytics/tracked-whatsapp-link";
import { buildPromiseRows, type FulfilmentInput } from "@/lib/seller/fulfilment-promise";

// ============================================================
// TfPromiseDock — the four questions a buyer has before tapping,
// answered above the fold: when does it ship, how do I get it,
// what if it's wrong, and who holds my money.
//
// Four rows, always four. A row never disappears — a missing row
// reads as a hole — and a row never invents a promise either. An
// unconfirmed shop gets a real buyer action instead.
// ============================================================

const ROW_ICON = {
  dispatch: Clock,
  fulfilment: PackageCheck,
  returns: RotateCcw,
  pays: ShieldCheck,
} as const;

export interface TfPromiseDockProps {
  shop: FulfilmentInput;
  shopId: string;
  waHref: string;
  isOwner: boolean;
  ownerSettingsHref: string | null;
}

export function TfPromiseDock({
  shop,
  shopId,
  waHref,
  isOwner,
  ownerSettingsHref,
}: TfPromiseDockProps) {
  const rows = buildPromiseRows(shop);

  return (
    <TfReveal
      as="section"
      stagger
      aria-label="What this seller promises"
      className="overflow-hidden rounded-2xl border border-tf-stone-200 bg-tf-raised shadow-tf-sm"
    >
      {rows.map((row) => {
        const Icon = ROW_ICON[row.id];
        return (
          <div
            key={row.id}
            className="tf-rule-row flex items-start gap-3 px-4 py-3.5"
          >
            <Icon
              aria-hidden="true"
              className={cn(
                "mt-0.5 size-[18px] shrink-0",
                row.tone === "promise" ? "text-tf-verified" : "text-tf-stone-400",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-tf-stone-500">
                {row.label}
              </p>
              {row.tone === "ask" ? (
                <TrackedWhatsAppLink
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  shopId={shopId}
                  className="mt-0.5 inline-block text-[15px] font-medium text-tf-primary underline-offset-4 hover:underline"
                >
                  {row.value}
                </TrackedWhatsAppLink>
              ) : (
                <p
                  className={cn(
                    "mt-0.5 text-[15px] leading-snug",
                    row.tone === "missing"
                      ? "text-tf-stone-400"
                      : "font-medium text-tf-ink",
                  )}
                >
                  {row.value}
                </p>
              )}

              {/* Seller-facing, server-gated — never rendered to buyers,
                  never merely CSS-hidden, because this page is cached. */}
              {isOwner && row.tone !== "promise" && ownerSettingsHref && (
                <Link
                  href={ownerSettingsHref}
                  className="mt-1 inline-block text-xs font-medium text-tf-warning underline underline-offset-2"
                >
                  {row.id === "returns"
                    ? "Add a return policy — without it your products are hidden from marketplace search"
                    : "Confirm your delivery details"}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </TfReveal>
  );
}
