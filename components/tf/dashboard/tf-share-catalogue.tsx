"use client";

import * as React from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { TfButton } from "@/components/tf/button";

// ============================================================
// TfShareCatalogue — the seller's #1 job: get the link out.
// Copy, share straight to WhatsApp, or open the live catalogue.
// ============================================================

interface TfShareCatalogueProps {
  catalogUrl: string;
  shopName: string;
}

export function TfShareCatalogue({ catalogUrl, shopName }: TfShareCatalogueProps) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(catalogUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (older Android WebViews) — select-able text below covers it
    }
  };

  const waShare = `https://wa.me/?text=${encodeURIComponent(
    `Check out my shop ${shopName} on TradeFeed:\n${catalogUrl}`,
  )}`;

  return (
    <div className="rounded-xl bg-tf-deep p-4">
      <p className="text-sm font-medium text-tf-surface">Share your catalogue</p>
      <p className="mt-1 select-all break-all rounded-lg bg-white/10 px-3 py-2 font-mono text-xs text-emerald-100">
        {catalogUrl}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <TfButton variant="whatsapp" size="sm" asChild>
          <a href={waShare} target="_blank" rel="noopener noreferrer">
            Share on WhatsApp
          </a>
        </TfButton>
        <TfButton
          size="sm"
          onClick={copy}
          className="bg-white/10 text-tf-surface hover:bg-white/20 active:bg-white/20"
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copied" : "Copy link"}
        </TfButton>
        <TfButton
          size="sm"
          asChild
          className="bg-white/10 text-tf-surface hover:bg-white/20 active:bg-white/20"
        >
          <a href={catalogUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden="true" />
            View
          </a>
        </TfButton>
      </div>
    </div>
  );
}
