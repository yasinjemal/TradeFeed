// ============================================================
// Component — Delete Combo Button
// ============================================================
// Client component that calls deleteComboAction with confirm.
// ============================================================

"use client";

import { deleteComboAction } from "@/app/actions/combo";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface DeleteComboButtonProps {
  shopSlug: string;
  comboId: string;
}

export function DeleteComboButton({ shopSlug, comboId }: DeleteComboButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("Delete this combo? This cannot be undone.")) return;

    startTransition(async () => {
      await deleteComboAction(shopSlug, comboId);
      router.push(`/dashboard/${shopSlug}/combos`);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-sm text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
    >
      {isPending ? "Deleting…" : "Delete Combo"}
    </button>
  );
}
