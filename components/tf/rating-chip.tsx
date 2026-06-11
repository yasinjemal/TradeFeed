import * as React from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

// ============================================================
// TfRatingChip — the one place amber lives outside sale/urgency.
// "4.9 (127)" in tabular figures; screen-reader friendly label.
// ============================================================

interface TfRatingChipProps extends React.ComponentProps<"span"> {
  rating: number;
  count?: number;
  /** Bare = no pill background (for tight card footers) */
  bare?: boolean;
}

function TfRatingChip({ rating, count, bare = false, className, ...props }: TfRatingChipProps) {
  const value = rating.toFixed(1);
  return (
    <span
      data-slot="tf-rating-chip"
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium tabular-nums text-tf-accent-ink",
        !bare && "rounded-full bg-tf-accent-soft px-2.5 py-1 leading-none",
        className,
      )}
      aria-label={`Rated ${value} out of 5${count != null ? ` from ${count} review${count === 1 ? "" : "s"}` : ""}`}
      {...props}
    >
      <Star aria-hidden="true" className="size-3.5 fill-tf-accent text-tf-accent" />
      {value}
      {count != null && <span className="font-normal text-tf-stone-500">({count})</span>}
    </span>
  );
}

export { TfRatingChip };
