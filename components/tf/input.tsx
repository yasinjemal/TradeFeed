import * as React from "react";

import { cn } from "@/lib/utils";

// ============================================================
// TfInput — 44px min height, warm borders, visible focus ring.
// ============================================================

function TfInput({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="tf-input"
      className={cn(
        "flex min-h-11 w-full rounded-[10px] border border-tf-stone-300 bg-tf-raised px-4 py-2 text-[15px] text-tf-ink placeholder:text-tf-stone-400",
        "transition-colors motion-reduce:transition-none outline-none",
        "focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25",
        "aria-invalid:border-tf-error aria-invalid:ring-2 aria-invalid:ring-tf-error/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { TfInput };
