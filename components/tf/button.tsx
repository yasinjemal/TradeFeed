import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

// ============================================================
// TfButton — primary / secondary / ghost / whatsapp
// 44px minimum tap target on every size, visible focus ring,
// transitions disabled under prefers-reduced-motion.
// ============================================================

const tfButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-medium transition-colors motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-tf-primary focus-visible:ring-offset-2 focus-visible:ring-offset-tf-surface [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-tf-primary text-white hover:bg-tf-primary-hover active:bg-tf-deep",
        secondary:
          "border border-tf-stone-300 bg-tf-raised text-tf-ink hover:border-tf-stone-400 hover:bg-tf-stone-50",
        ghost: "text-tf-primary hover:bg-tf-verified-soft",
        whatsapp: "bg-whatsapp text-white hover:bg-whatsapp-hover",
        danger: "bg-tf-error text-white hover:opacity-90",
      },
      size: {
        default: "min-h-11 px-5 text-[15px]",
        lg: "min-h-12 px-6 text-base",
        sm: "min-h-11 px-4 text-sm", // visually compact, still a 44px target
        icon: "size-11",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function TfButton({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof tfButtonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="tf-button"
      className={cn(tfButtonVariants({ variant, size, fullWidth, className }))}
      {...props}
    />
  );
}

export { TfButton, tfButtonVariants };
