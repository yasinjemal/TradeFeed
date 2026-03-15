// ============================================================
// Component — Seller Tip (Contextual Education)
// ============================================================
// Reusable inline tip to educate sellers near form inputs.
// Light emerald background, subtle, non-intrusive.
// ============================================================

import type { ReactNode } from "react";

interface SellerTipProps {
  children: ReactNode;
  icon?: string;
  variant?: "default" | "warning" | "success";
}

export function SellerTip({ children, icon = "💡", variant = "default" }: SellerTipProps) {
  const styles = {
    default: "bg-emerald-50/60 border-emerald-100 text-emerald-700",
    warning: "bg-amber-50/60 border-amber-100 text-amber-700",
    success: "bg-blue-50/60 border-blue-100 text-blue-700",
  };

  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${styles[variant]}`}>
      <span className="flex-shrink-0 text-sm leading-none mt-px">{icon}</span>
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}
