"use client";

import { useState } from "react";

interface ShareShopButtonProps {
  shopName: string;
  shopSlug: string;
}

export function ShareShopButton({ shopName, shopSlug }: ShareShopButtonProps) {
  const [copied, setCopied] = useState(false);
  const url = `https://tradefeed.co.za/catalog/${shopSlug}`;

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${shopName} on TradeFeed`,
          text: `Check out ${shopName} on TradeFeed! 🛍️`,
          url,
        });
        return;
      } catch {
        // User cancelled or not supported — fall through to copy
      }
    }

    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700 active:scale-[0.97]"
      aria-label={copied ? "Link copied!" : "Share shop"}
      title={copied ? "Link copied!" : "Share shop"}
    >
      {copied ? (
        <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
        </svg>
      )}
    </button>
  );
}
