import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Quote,
  ShieldCheck,
  Star,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { TfReveal } from "@/components/tf/motion/tf-reveal";
import type { ProofCard } from "@/lib/seller/proof-ladder";

// ============================================================
// TfProofRail — evidence on a counter.
//
// Depth is layout, never animation: each card is fractionally
// smaller and lower than the one before it, over one soft shadow
// bar. Composited once, no scroll work, and it survives
// prefers-reduced-motion untouched because it never moved.
//
// The ladder guarantees every card carries a real fact and that
// a thin rail does not render at all — see lib/seller/proof-ladder.
// ============================================================

const CARD_BASE =
  "tf-counter-card flex h-full w-[68vw] max-w-[248px] shrink-0 snap-start flex-col justify-between rounded-2xl border border-tf-stone-200 bg-tf-raised p-4 shadow-tf-sm";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-tf-stone-500">
      {children}
    </p>
  );
}

function ProofCardBody({ card }: { card: ProofCard }) {
  switch (card.kind) {
    case "review":
      return (
        <>
          <div>
            <div className="flex items-center gap-1 text-tf-accent-ink">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  aria-hidden="true"
                  className={cn(
                    "size-3.5",
                    i < card.rating ? "fill-current" : "text-tf-stone-300",
                  )}
                />
              ))}
              <span className="sr-only">{card.rating} out of 5</span>
            </div>
            <p className="mt-2 font-tf-editorial text-[15px] leading-snug text-tf-ink">
              “{card.quote}”
            </p>
          </div>
          <p className="mt-3 text-xs text-tf-stone-500">
            {card.buyerName ?? "Verified buyer"}
          </p>
        </>
      );

    case "photo":
      return (
        <div className="relative -m-4 h-full min-h-[180px] overflow-hidden rounded-2xl bg-tf-stone-100">
          <Image
            src={card.url}
            alt={card.alt}
            fill
            loading="lazy"
            sizes="(max-width: 640px) 68vw, 248px"
            className="object-cover"
          />
        </div>
      );

    case "stat":
      return (
        <>
          <Eyebrow>{card.label}</Eyebrow>
          <p className="mt-2 font-tf-hero text-4xl font-semibold tabular-nums text-tf-ink">
            {card.value.toLocaleString("en-ZA")}
            {card.suffix}
          </p>
          <CalendarDays aria-hidden="true" className="mt-3 size-4 text-tf-stone-400" />
        </>
      );

    case "place":
      return (
        <>
          <MapPin aria-hidden="true" className="size-5 text-tf-primary" />
          <div className="mt-3">
            <Eyebrow>Based in</Eyebrow>
            <p className="mt-1 text-lg font-semibold text-tf-ink">{card.city}</p>
            {card.mode && (
              <p className="mt-1 text-xs text-tf-stone-600">
                {card.mode === "both"
                  ? "Delivery or collection"
                  : card.mode === "collection"
                    ? "Collection available"
                    : "Delivers from here"}
              </p>
            )}
          </div>
        </>
      );

    case "quote":
      return (
        <>
          <Quote aria-hidden="true" className="size-5 text-tf-stone-300" />
          <p className="mt-2 font-tf-editorial text-[15px] leading-snug text-tf-ink">
            {card.text}
          </p>
        </>
      );

    case "hours":
      return (
        <>
          <Clock3 aria-hidden="true" className="size-5 text-tf-primary" />
          <div className="mt-3">
            <Eyebrow>Open</Eyebrow>
            <p className="mt-1 text-sm font-medium text-tf-ink">{card.summary}</p>
          </div>
        </>
      );

    case "safe":
      return (
        <>
          <ShieldCheck aria-hidden="true" className="size-5 text-tf-verified" />
          <div className="mt-3">
            <Eyebrow>Buying safely</Eyebrow>
            <p className="mt-1 text-sm leading-snug text-tf-stone-600">
              PayFast secure checkout. Your details stay private — POPIA compliant.
            </p>
          </div>
        </>
      );

    case "more":
      return (
        <>
          <Eyebrow>Everything else</Eyebrow>
          <p className="mt-2 text-lg font-semibold text-tf-ink">
            {card.count} more {card.count === 1 ? "product" : "products"}
          </p>
          <ArrowRight aria-hidden="true" className="mt-3 size-5 text-tf-primary" />
        </>
      );
  }
}

export function TfProofRail({
  cards,
  heading,
}: {
  cards: ProofCard[];
  heading: string;
}) {
  if (cards.length === 0) return null;

  return (
    <section aria-label={heading}>
      <h2 className="font-tf-display text-xl font-semibold text-tf-ink">{heading}</h2>
      <TfReveal
        as="ul"
        stagger
        className="tf-counter-rail tf-rail tf-nudge -mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 overscroll-x-contain"
      >
        {cards.map((card, index) => {
          const key = "id" in card ? `${card.kind}:${card.id}` : card.kind;
          const style = { "--tf-i": index } as React.CSSProperties;

          // The stagger ladder targets direct children of the rail, so
          // every card must BE the <li> — a wrapper with display:contents
          // would drop both the stagger and the counter transform.
          return (
            <li key={key} className={cn(CARD_BASE, "relative")} style={style}>
              <ProofCardBody card={card} />
              {card.kind === "more" && (
                <Link
                  href={card.href}
                  aria-label={`See all ${card.count} products`}
                  className="absolute inset-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-tf-primary"
                />
              )}
            </li>
          );
        })}
      </TfReveal>
    </section>
  );
}
