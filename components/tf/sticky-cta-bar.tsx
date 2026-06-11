import * as React from "react";

import { cn } from "@/lib/utils";
import { formatZAR } from "./format";

// ============================================================
// TfStickyCtaBar — fixed bottom action bar (mobile-first).
// Forest 900 surface, safe-area padding, hidden on lg+ by
// default. Pair the page with `pb-24 lg:pb-0` so content is
// never hidden behind it.
// ============================================================

interface TfStickyCtaBarProps extends React.ComponentProps<"div"> {
  /** Price in Rand, shown left of the action */
  price?: number;
  /** Small label above the price, e.g. product title or "Total" */
  label?: string;
  /** Keep visible on desktop too */
  showOnDesktop?: boolean;
}

function TfStickyCtaBar({
  price,
  label,
  showOnDesktop = false,
  className,
  children,
  ...props
}: TfStickyCtaBarProps) {
  return (
    <div
      data-slot="tf-sticky-cta-bar"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 bg-tf-deep shadow-tf-md",
        "px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        !showOnDesktop && "lg:hidden",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        {(label || price != null) && (
          <div className="min-w-0">
            {label && <p className="truncate text-xs text-tf-stone-300">{label}</p>}
            {price != null && (
              <p className="text-[17px] font-semibold tabular-nums text-tf-surface">
                {formatZAR(price)}
              </p>
            )}
          </div>
        )}
        <div className={cn("flex shrink-0 items-center gap-2", !label && price == null && "w-full")}>
          {children}
        </div>
      </div>
    </div>
  );
}

export { TfStickyCtaBar };
