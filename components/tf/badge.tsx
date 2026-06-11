import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { BadgeCheck, MapPin, Tag } from "lucide-react";

import { cn } from "@/lib/utils";

// ============================================================
// TfBadge — pills. Amber is reserved for sale/urgency; verified
// is always the emerald tick. Text colors are AA on their fills.
// ============================================================

const tfBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium leading-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        verified: "bg-tf-verified-soft text-tf-deep",
        sale: "bg-tf-accent-soft text-tf-accent-ink",
        urgency: "bg-tf-accent-soft text-tf-accent-ink",
        neutral: "bg-tf-stone-100 text-tf-stone-600",
        location: "bg-tf-stone-100 text-tf-stone-600",
        outline: "border border-tf-stone-200 bg-tf-raised text-tf-stone-600",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

type TfBadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof tfBadgeVariants> & {
    /** Render the variant's default leading icon */
    icon?: boolean;
  };

function TfBadge({ className, variant, icon = false, children, ...props }: TfBadgeProps) {
  return (
    <span
      data-slot="tf-badge"
      className={cn(tfBadgeVariants({ variant, className }))}
      {...props}
    >
      {icon && variant === "verified" && <BadgeCheck aria-hidden="true" />}
      {icon && variant === "location" && <MapPin aria-hidden="true" />}
      {icon && (variant === "sale" || variant === "urgency") && <Tag aria-hidden="true" />}
      {children}
    </span>
  );
}

export { TfBadge, tfBadgeVariants };
