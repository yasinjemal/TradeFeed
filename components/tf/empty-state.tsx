import * as React from "react";

import { cn } from "@/lib/utils";

// ============================================================
// TfEmptyState — direction, never a dead end. Icon, title,
// one-line description, and an action that moves the user on.
// ============================================================

interface TfEmptyStateProps extends React.ComponentProps<"div"> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function TfEmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: TfEmptyStateProps) {
  return (
    <div
      data-slot="tf-empty-state"
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-tf-stone-300 bg-tf-stone-50 px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      {icon && (
        <div
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-tf-verified-soft text-tf-primary [&_svg]:size-6"
        >
          {icon}
        </div>
      )}
      <h3 className="font-tf-display text-lg font-semibold text-tf-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-tf-stone-600">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export { TfEmptyState };
