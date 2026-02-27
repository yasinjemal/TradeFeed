"use client";

import { useState, useTransition } from "react";
import { subscribeRestockAlertAction } from "@/app/actions/stock-alerts";

interface RestockAlertProps {
  productId: string;
  productName: string;
  shopId: string;
}

export function RestockAlert({ productId, productName, shopId }: RestockAlertProps) {
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 9) {
      setError("Please enter a valid phone number");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await subscribeRestockAlertAction({
        productId,
        productName,
        shopId,
        phone: trimmed,
      });
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        <span>🔔</span>
        <span>We&apos;ll notify you on WhatsApp when this item is back in stock!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <p className="text-xs font-medium text-stone-500">
        🔔 Get notified when back in stock
      </p>
      <div className="flex gap-2">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="WhatsApp number (e.g. 0812345678)"
          className="min-h-[44px] flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending}
          className="min-h-[44px] whitespace-nowrap rounded-xl bg-stone-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-50"
        >
          {isPending ? "…" : "Notify me"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
