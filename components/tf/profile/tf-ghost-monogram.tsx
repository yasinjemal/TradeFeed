import * as React from "react";

import { cn } from "@/lib/utils";

// ============================================================
// TfGhostMonogram — one enormous ghosted word behind the name.
//
// Inline <svg><text>: zero bytes over the wire, never a missing
// image, CSP-clean, and — because the SVG scales to its viewBox
// rather than to the font's metrics — a Clash Display swap can
// never reflow it. Purely decorative, so aria-hidden.
// ============================================================

export function TfGhostMonogram({
  word,
  className,
}: {
  word: string;
  className?: string;
}) {
  // Keep the glyph box proportional to the word so short marks do
  // not stretch and long ones do not shrink to a hairline.
  const width = Math.max(word.length * 52, 160);

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${width} 120`}
      preserveAspectRatio="xMidYMin meet"
      className={cn("tf-monogram", className)}
    >
      <text
        x="50%"
        y="96"
        textAnchor="middle"
        /* The stone ramp inverts under .dark, so one token reads
           as a quiet ghost in both modes without a dark: variant. */
        className="fill-tf-stone-200"
        style={{
          fontFamily: "var(--font-tf-hero)",
          fontSize: "104px",
          fontWeight: 600,
          letterSpacing: "-0.04em",
        }}
      >
        {word}
      </text>
    </svg>
  );
}
