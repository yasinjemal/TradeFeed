"use client";

import { useState, useTransition } from "react";
import { toggleCodAction } from "@/app/actions/shop-settings";
import { toast } from "sonner";

interface CodToggleProps {
  shopSlug: string;
  initialEnabled: boolean;
}

export function CodToggle({ shopSlug, initialEnabled }: CodToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      const result = await toggleCodAction(shopSlug, next);
      if (!result.success) {
        setEnabled(!next); // revert
        toast.error(result.error ?? "Failed to update");
      } else {
        toast.success(next ? "Cash on Delivery enabled" : "Cash on Delivery disabled");
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">Cash on Delivery</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Allow buyers to pay in cash when they receive their order.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={isPending}
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 ${
          enabled ? "bg-emerald-500" : "bg-slate-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
