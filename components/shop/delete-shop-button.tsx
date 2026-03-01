"use client";

import { useState, useTransition } from "react";
import { deleteShopAction } from "@/app/actions/shop";

interface DeleteShopButtonProps {
  shopSlug: string;
  shopName: string;
}

export function DeleteShopButton({ shopSlug, shopName }: DeleteShopButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isMatch = confirmText.trim().toLowerCase() === shopName.toLowerCase();

  function handleDelete() {
    if (!isMatch) return;
    setError("");
    startTransition(async () => {
      const result = await deleteShopAction(shopSlug, confirmText);
      if (!result.success && result.error) {
        setError(result.error);
      }
    });
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
      >
        Delete this shop
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-4 rounded-xl bg-red-50 border border-red-200">
        <p className="text-sm text-red-800 font-medium">
          ⚠️ This will permanently delete your shop, all products, orders, and data. This cannot be undone.
        </p>
        <p className="text-sm text-red-600 mt-2">
          Type <span className="font-bold">{shopName}</span> to confirm:
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => {
            setConfirmText(e.target.value);
            setError("");
          }}
          placeholder={shopName}
          className="mt-2 w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
          disabled={isPending}
        />
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={!isMatch || isPending}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Deleting…" : "Permanently Delete Shop"}
        </button>
        <button
          onClick={() => {
            setIsOpen(false);
            setConfirmText("");
            setError("");
          }}
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
