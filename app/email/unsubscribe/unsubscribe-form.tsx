"use client";

import { FormEvent, useState } from "react";

type SubmissionState = "idle" | "submitting" | "success" | "error";

interface UnsubscribeFormProps {
  token: string;
}

export function UnsubscribeForm({ token }: UnsubscribeFormProps) {
  const [state, setState] = useState<SubmissionState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting" || state === "success") return;

    setState("submitting");

    try {
      const body = new URLSearchParams({ token });
      const response = await fetch("/api/email/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: body.toString(),
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
      });

      setState(response.ok ? "success" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center"
        role="status"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white"
        >
          ✓
        </span>
        <h2 className="mt-4 text-xl font-bold text-stone-900">
          You&apos;re unsubscribed
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          We saved your choice. TradeFeed product news and marketing emails
          will stop. Essential account, order, billing, privacy and security
          messages may still arrive.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h2 className="font-semibold text-stone-900">
          Stop TradeFeed product updates?
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Confirm below to unsubscribe from feature announcements,
          re-engagement emails and other TradeFeed marketing.
        </p>
        <p className="mt-3 text-xs leading-5 text-stone-500">
          This does not close your account or shop. Essential service messages
          may still be sent when needed.
        </p>
      </div>

      {state === "error" && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
          role="alert"
        >
          We could not save your preference. Nothing was changed. Please try
          again, or contact privacy@tradefeed.co.za.
        </div>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="min-h-12 w-full rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-60"
      >
        {state === "submitting"
          ? "Saving your choice…"
          : "Yes, unsubscribe me"}
      </button>
    </form>
  );
}
