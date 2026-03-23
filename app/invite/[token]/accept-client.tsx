// ============================================================
// Client — Accept Invite Button
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInviteAction } from "@/app/actions/staff";

interface Props {
  token: string;
  shopName: string;
  shopSlug: string;
  role: string;
}

export function AcceptInviteClient({ token, shopName, shopSlug, role }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    setError("");
    startTransition(async () => {
      const result = await acceptInviteAction(token);
      if (result.success) {
        router.push(`/dashboard/${shopSlug}`);
      } else {
        setError(result.error ?? "Failed to accept invitation.");
      }
    });
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-stone-600">
        Accept to start managing <strong>{shopName}</strong> as a{" "}
        <strong>{role === "MANAGER" ? "Manager" : "Staff member"}</strong>.
      </p>

      <button
        onClick={handleAccept}
        disabled={isPending}
        className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Joining…" : "Accept & Join Shop →"}
      </button>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}
    </div>
  );
}
