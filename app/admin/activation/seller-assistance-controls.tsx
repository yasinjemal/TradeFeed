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
      className="min-h-11 rounded-lg border border-stone-600 px-4 py-2 text-sm text-stone-100 disabled:opacity-50"
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
        className="min-h-11 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
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
