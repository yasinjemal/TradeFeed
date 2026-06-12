import * as React from "react";
import { ArrowRight, BadgeCheck, Camera, Link2, Sparkles } from "lucide-react";

// ============================================================
// TfPhoneMock — the hero proof: photo → AI listing → one
// shareable catalogue link. Pure CSS, no JS, no stock photos.
// ============================================================

export function TfPhoneMock() {
  return (
    <div
      className="flex items-center justify-center gap-3 sm:gap-5"
      role="img"
      aria-label="A product photo becomes an AI-written listing inside a shareable WhatsApp catalogue"
    >
      {/* Step: the photo */}
      <div className="flex w-24 shrink-0 flex-col items-center gap-2 sm:w-32">
        <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-tf-stone-200 bg-tf-raised shadow-tf-sm">
          <Camera aria-hidden="true" className="size-8 text-tf-stone-400" />
        </div>
        <span className="text-xs text-tf-stone-600">Your photo</span>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1 text-tf-primary">
        <Sparkles aria-hidden="true" className="size-4 motion-safe:animate-pulse" />
        <ArrowRight aria-hidden="true" className="size-5" />
        <span className="text-[10px] font-medium text-tf-stone-500">AI ~10s</span>
      </div>

      {/* Step: the catalogue on a phone */}
      <div className="w-[210px] shrink-0 rounded-[28px] border border-tf-stone-300 bg-tf-ink p-2 shadow-tf-md sm:w-[230px]">
        <div className="overflow-hidden rounded-[20px] bg-tf-surface">
          {/* Shop header */}
          <div className="bg-tf-deep px-3 pb-2.5 pt-3">
            <p className="flex items-center gap-1 text-[13px] font-semibold text-tf-surface">
              Thandi&apos;s Sneakers
              <BadgeCheck aria-hidden="true" className="size-3.5 text-emerald-300" />
            </p>
            <p className="mt-0.5 flex items-center gap-1 truncate rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-emerald-100">
              <Link2 aria-hidden="true" className="size-3 shrink-0" />
              tradefeed.co.za/thandis-sneakers
            </p>
          </div>
          {/* Listing written by AI */}
          <div className="space-y-2 p-2.5">
            <div className="rounded-lg border border-tf-stone-200 bg-tf-raised p-2">
              <div className="mb-1.5 flex aspect-[2/1] items-center justify-center rounded-md bg-tf-stone-100">
                <Camera aria-hidden="true" className="size-4 text-tf-stone-300" />
              </div>
              <p className="text-[11px] font-medium leading-tight text-tf-ink">
                Nike Air Max 90 — size 6 to 10
              </p>
              <p className="text-[12px] font-semibold tabular-nums text-tf-ink">R1 899</p>
              <p className="text-[9px] leading-snug text-tf-stone-500">
                Original, in box. Collection in Soweto or courier nationwide.
              </p>
            </div>
            <div className="flex items-center justify-center gap-1 rounded-lg bg-whatsapp py-1.5 text-[11px] font-semibold text-white">
              Order on WhatsApp
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
