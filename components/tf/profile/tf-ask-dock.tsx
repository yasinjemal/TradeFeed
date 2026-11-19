"use client";

import * as React from "react";
import { Send } from "lucide-react";

import { trackWhatsAppClickAction } from "@/app/actions/analytics";

// ============================================================
// TfAskDock — the dead end, converted.
//
// 43 live shops have no products. Until now their page offered a
// buyer nothing to do. This asks the one question a buyer with
// intent actually has, and turns the answer into a prefilled
// WhatsApp message. The buyer still leaves on WhatsApp, the click
// is still tracked, and the seller learns which product to list
// next — the strongest activation signal on the platform.
//
// POPIA: the number is never printed, only used in the handoff.
// ============================================================

export function TfAskDock({
  shopId,
  shopName,
  whatsappNumber,
}: {
  shopId: string;
  shopName: string;
  whatsappNumber: string;
}) {
  const [value, setValue] = React.useState("");
  const firstName = shopName.trim().split(/\s+/)[0] ?? shopName;
  const digits = whatsappNumber.replace(/[^0-9]/g, "");

  const send = () => {
    const want = value.trim();
    const text = want
      ? `Hi ${shopName}, do you have ${want}?`
      : `Hi ${shopName}, what do you have in stock?`;
    void trackWhatsAppClickAction(shopId);
    window.open(
      `https://wa.me/${digits}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <section
      aria-label={`Ask ${shopName} for something`}
      className="rounded-2xl border border-tf-stone-200 bg-tf-stone-50 p-4"
    >
      <h2 className="font-tf-display text-lg font-semibold text-tf-ink">
        Looking for something? Ask {firstName}.
      </h2>
      <p className="mt-1 text-sm text-tf-stone-600">
        Not everything is listed. Say what you need and it opens in WhatsApp.
      </p>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Nike Air Force 1, size 9"
          aria-label={`What are you looking for from ${shopName}?`}
          className="min-h-11 w-full flex-1 rounded-full border border-tf-stone-300 bg-tf-raised px-4 text-[15px] text-tf-ink placeholder:text-tf-stone-400 outline-none focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25"
        />
        <button
          type="submit"
          aria-label={`Ask ${shopName} on WhatsApp`}
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white outline-none transition-colors hover:bg-whatsapp-hover focus-visible:ring-2 focus-visible:ring-tf-primary focus-visible:ring-offset-2"
        >
          <Send aria-hidden="true" className="size-5" />
        </button>
      </form>
    </section>
  );
}
