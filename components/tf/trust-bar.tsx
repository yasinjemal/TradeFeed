import * as React from "react";
import { LockKeyhole, PackageCheck, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

// ============================================================
// TfTrustBar — PayFast secure · POPIA compliant · N orders
// fulfilled. Repeats on product pages, storefronts, checkout.
// ============================================================

interface TfTrustBarProps extends React.ComponentProps<"div"> {
  ordersFulfilled?: number;
  /** Compact single-line version for tight layouts */
  compact?: boolean;
}

function TfTrustBar({ ordersFulfilled, compact = false, className, ...props }: TfTrustBarProps) {
  const items: { icon: React.ReactNode; label: string }[] = [
    {
      icon: <LockKeyhole aria-hidden="true" className="size-4 text-tf-primary" />,
      label: "PayFast secure payments",
    },
    {
      icon: <ShieldCheck aria-hidden="true" className="size-4 text-tf-primary" />,
      label: "POPIA compliant",
    },
  ];
  if (ordersFulfilled != null && ordersFulfilled > 0) {
    items.push({
      icon: <PackageCheck aria-hidden="true" className="size-4 text-tf-primary" />,
      label: `${ordersFulfilled.toLocaleString("en-ZA")} orders fulfilled`,
    });
  }

  return (
    <div
      data-slot="tf-trust-bar"
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-tf-stone-200 bg-tf-stone-50 px-4",
        compact ? "py-2" : "py-3",
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 text-xs text-tf-stone-600 tabular-nums"
        >
          {item.icon}
          {item.label}
        </span>
      ))}
    </div>
  );
}

export { TfTrustBar };
