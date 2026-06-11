import * as React from "react";

import { cn } from "@/lib/utils";

// ============================================================
// TfSkeleton — perceived speed on patchy data. Pulse animation
// is disabled under prefers-reduced-motion.
// ============================================================

function TfSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tf-skeleton"
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-lg bg-tf-stone-200/70 motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

/** Matches TfProductCard's layout so grids don't shift on load. */
function TfProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-tf-stone-200 bg-tf-raised",
        className,
      )}
      aria-hidden="true"
    >
      <TfSkeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <TfSkeleton className="h-4 w-4/5" />
        <TfSkeleton className="h-5 w-2/5" />
        <TfSkeleton className="h-3.5 w-3/5" />
      </div>
    </div>
  );
}

/** Matches TfVerifiedSellerCard's inline layout. */
function TfSellerCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-tf-stone-200 bg-tf-raised p-4",
        className,
      )}
      aria-hidden="true"
    >
      <TfSkeleton className="size-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <TfSkeleton className="h-4 w-2/5" />
        <TfSkeleton className="h-3.5 w-3/5" />
      </div>
    </div>
  );
}

export { TfSkeleton, TfProductCardSkeleton, TfSellerCardSkeleton };
