"use client";

import { useState, useTransition } from "react";
import { updateEmailMarketingPreferenceAction } from "@/app/actions/email-marketing-preferences";

interface EmailMarketingToggleProps {
  shopSlug: string;
  optedIn: boolean;
}

export function EmailMarketingToggle({
  shopSlug,
  optedIn: initialOptedIn,
}: EmailMarketingToggleProps) {
  const [optedIn, setOptedIn] = useState(initialOptedIn);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updatePreference(nextOptedIn: boolean) {
    if (isPending || nextOptedIn === optedIn) return;

    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await updateEmailMarketingPreferenceAction(
        shopSlug,
        nextOptedIn,
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      setOptedIn(result.optedIn);
      setMessage(
        result.optedIn
          ? "You’re subscribed to optional TradeFeed product news."
          : "You won’t receive optional TradeFeed product news.",
      );
    });
  }

  return (
    <section
      className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6"
      aria-labelledby="product-news-heading"
    >
      <div className="flex items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Optional
          </p>
          <h2
            id="product-news-heading"
            className="mt-1 text-lg font-semibold text-stone-900"
          >
            TradeFeed product news
          </h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Get occasional emails about meaningful new TradeFeed features,
            seller tools, and practical ideas for growing your catalogue.
            This is separate from essential order, stock, review, security,
            and account emails.
          </p>
          <p className="mt-2 text-xs text-stone-500">
            Off unless you choose to subscribe. You can change this at any
            time.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-label="Receive optional TradeFeed product news by email"
          aria-checked={optedIn}
          disabled={isPending}
          onClick={() => updatePreference(!optedIn)}
          className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${
            optedIn ? "bg-emerald-600" : "bg-stone-300"
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              optedIn ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="mt-4 min-h-5" aria-live="polite">
        {isPending && (
          <p className="text-xs text-stone-500">Saving your choice…</p>
        )}
        {!isPending && message && (
          <p className="text-xs font-medium text-emerald-700">{message}</p>
        )}
        {!isPending && error && (
          <p className="text-xs font-medium text-red-600">{error}</p>
        )}
      </div>
    </section>
  );
}
