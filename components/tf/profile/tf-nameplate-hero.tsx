import * as React from "react";
import Image from "next/image";
import { BadgeCheck, MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { TfButton } from "@/components/tf/button";
import { TfReveal } from "@/components/tf/motion/tf-reveal";
import { TrackedWhatsAppLink } from "@/components/analytics/tracked-whatsapp-link";
import { FollowShopButton } from "@/components/catalog/follow-shop-button";
import { resolveNameplateScale } from "@/lib/seller/stage-mode";
import { TfGhostMonogram } from "./tf-ghost-monogram";

// ============================================================
// TfNameplateHero — the seller, set in type, at full scale.
//
// Deliberately IMAGELESS above the fold apart from a 56px logo.
// navigator.connection.saveData cannot be read while rendering
// on the server, so any decorative hero image is already in
// flight before a client component could decline it. A buyer on
// prepaid data pays for it either way. Typography costs nothing
// and — on a shop with no banner, no products and no about text,
// which is 92 of 116 live shops — looks considerably better.
// ============================================================

const NAMEPLATE_SIZE = {
  lg: "text-[clamp(2.5rem,11vw,4.5rem)]",
  md: "text-[clamp(2.1rem,9vw,3.6rem)]",
  sm: "text-[clamp(1.75rem,7.5vw,3rem)]",
} as const;

export interface TfNameplateHeroProps {
  shopId: string;
  name: string;
  tagline: string | null;
  logoUrl: string | null;
  verified: boolean;
  /** null when no derived word adds anything beyond the name. */
  monogramWord: string | null;
  /** "Soweto, Gauteng · since 2024 · 127 orders" — facts only. */
  facts: string[];
  waHref: string;
}

export function TfNameplateHero({
  shopId,
  name,
  tagline,
  logoUrl,
  verified,
  monogramWord,
  facts,
  waHref,
}: TfNameplateHeroProps) {
  const scale = resolveNameplateScale(name);
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <section
      aria-label={name}
      className="relative isolate -mx-4 overflow-x-clip bg-tf-surface px-4 pb-8 pt-10 sm:mx-0 sm:rounded-3xl sm:px-8"
    >
      <div className="tf-ambient" aria-hidden="true" />
      {monogramWord && (
        <TfGhostMonogram word={monogramWord} className="h-28 opacity-70 sm:h-36" />
      )}

      <div className="relative z-10">
        {/* ── Eyebrow: who, with the tick ─────────────── */}
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-tf-stone-200">
              <Image
                src={logoUrl}
                alt=""
                fill
                sizes="56px"
                priority
                className="object-cover"
              />
            </span>
          ) : (
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-tf-deep font-tf-display text-lg font-semibold text-tf-surface"
            >
              {initials || "TF"}
            </span>
          )}

          {verified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-tf-verified-soft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-tf-verified ring-1 ring-tf-verified/40">
              <BadgeCheck aria-hidden="true" className="tf-pop size-4" />
              Verified seller
            </span>
          )}
        </div>

        {/* ── The nameplate ───────────────────────────── */}
        <h1
          className={cn(
            "font-tf-hero mt-5 text-balance font-semibold leading-[0.9] tracking-[-0.03em] text-tf-ink",
            NAMEPLATE_SIZE[scale],
          )}
          // Two lines of headroom reserved from the clamp, so a late
          // Clash Display swap cannot shove the CTA down the page.
          style={{ minHeight: "1.8em" }}
        >
          {name}
        </h1>

        {tagline && (
          <p className="mt-3 max-w-prose text-base leading-relaxed text-tf-stone-600">
            {tagline}
          </p>
        )}

        {facts.length > 0 && (
          <p className="mt-3 text-sm tabular-nums text-tf-stone-500">
            {facts.join(" · ")}
          </p>
        )}

        {/* ── The order CTA, guaranteed above the fold ── */}
        <TfReveal delay={80} className="mt-6 flex flex-wrap items-center gap-3">
          <TfButton asChild variant="whatsapp" size="lg" className="shadow-tf-md">
            <TrackedWhatsAppLink
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              shopId={shopId}
            >
              <MessageCircle aria-hidden="true" />
              Message {name.split(/\s+/)[0]}
            </TrackedWhatsAppLink>
          </TfButton>
          <FollowShopButton shopId={shopId} />
        </TfReveal>
      </div>
    </section>
  );
}
