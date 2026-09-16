"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveSellerAssistanceAction, cancelSellerAssistanceAction } from "@/app/actions/seller-assistance";

export function AssistanceControl(props: { approval: { userId: string; shopId: string; fingerprint: string } } | { campaignId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  return <div className="mt-3">
    <button disabled={pending} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => startTransition(async () => {
      const result = "approval" in props ? await approveSellerAssistanceAction(props.approval) : await cancelSellerAssistanceAction(props.campaignId);
      setMessage(result.message);
      if (result.success) router.refresh();
    })}>{pending ? "Saving…" : "approval" in props ? "Approve and queue this email" : "Cancel queued email"}</button>
    {message && <p role="status" className="mt-2 text-sm text-stone-300">{message}</p>}
  </div>;
}
