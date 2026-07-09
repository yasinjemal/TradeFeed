"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";

import { TfButton } from "@/components/tf/button";

export function TfTrackingSearch() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = orderNumber.trim().toUpperCase();
    if (!value) return;
    startTransition(() => router.push(`/track/${encodeURIComponent(value)}`));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="tf-order-number" className="sr-only">Order number</label>
      <input
        id="tf-order-number"
        type="text"
        value={orderNumber}
        onChange={(event) => setOrderNumber(event.target.value)}
        placeholder="e.g. TF-20260709-A1B2"
        className="min-h-12 min-w-0 flex-1 rounded-[10px] border border-tf-stone-300 bg-tf-raised px-4 font-mono text-sm text-tf-ink placeholder:text-tf-stone-400 outline-none focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25"
        required
      />
      <TfButton type="submit" size="lg" disabled={isPending || !orderNumber.trim()}>
        <Search aria-hidden="true" className="size-4" />
        {isPending ? "Finding order…" : "Track order"}
      </TfButton>
    </form>
  );
}
