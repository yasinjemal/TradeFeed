"use client";

import { useState, useTransition } from "react";

interface WhatsAppSequenceToggleProps {
  shopSlug: string;
  optedOut: boolean;
}

export function WhatsAppSequenceToggle({ shopSlug, optedOut: initialOptedOut }: WhatsAppSequenceToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [optedOut, setOptedOut] = useState(initialOptedOut);
  const [saved, setSaved] = useState(false);

  const handleToggle = () => {
    const newValue = !optedOut;
    setOptedOut(newValue);
    setSaved(false);

    startTransition(async () => {
      const res = await fetch(`/api/seller-sequences/opt-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopSlug, optOut: newValue }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        // Revert on error
        setOptedOut(!newValue);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-900 mb-1">WhatsApp Follow-ups</h2>
        <p className="text-sm text-stone-500">
          We send helpful tips and monthly activity summaries to your WhatsApp number.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-stone-800">
            Receive WhatsApp follow-up messages
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            Onboarding tips, activity reports, and growth suggestions
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!optedOut}
          disabled={isPending}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-50 ${
            !optedOut ? "bg-emerald-500" : "bg-stone-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              !optedOut ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {saved && (
        <p className="text-xs text-emerald-600 font-medium">✓ Preference saved</p>
      )}
    </div>
  );
}
