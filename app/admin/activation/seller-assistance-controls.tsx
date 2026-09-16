"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveSellerAssistanceAction,
  cancelSellerAssistanceAction,
} from "@/app/actions/seller-assistance";

export function AssistanceRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="min-h-11 rounded-xl border border-stone-700 bg-stone-900 px-4 py-2 text-sm font-medium text-stone-200 transition-colors hover:border-stone-500 hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400 disabled:opacity-50"
    >
      {pending ? "Checking..." : "Refresh progress"}
    </button>
  );
}

export function AssistanceControl(
  props:
    | { approval: { userId: string; shopId: string; fingerprint: string } }
    | { campaignId: string },
) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={pending || saved}
        className="min-h-11 w-full rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400 disabled:opacity-50 sm:w-auto"
        onClick={() =>
          startTransition(async () => {
            try {
              const result =
                "approval" in props
                  ? await approveSellerAssistanceAction(props.approval)
                  : await cancelSellerAssistanceAction(props.campaignId);
              setMessage(result.message);
              if (result.success) {
                setSaved(true);
                router.refresh();
              }
            } catch {
              setMessage(
                "Unable to confirm the result. Refresh progress before trying again.",
              );
            }
          })
        }
      >
        {pending
          ? "Saving..."
          : saved
            ? "Saved"
            : "approval" in props
              ? "Approve email"
              : "Cancel queued email"}
      </button>
      {message && (
        <p role="status" className="mt-2 text-sm text-stone-300">
          {message}
        </p>
      )}
    </div>
  );
}
