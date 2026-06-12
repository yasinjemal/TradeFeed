"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// ============================================================
// TfLiveTicker — rotates through short lines of real platform
// activity ("LUMA·luscious is live in Boksburg") with a soft
// rise-in and a breathing presence dot. The "self-aware" cue:
// the page knows who is trading on it right now.
//
// Honesty rule: only ever feed this real data (live sellers,
// real cities) — never fabricated activity.
//
// Reduced-motion users get the first line, static. No-JS gets
// the first line server-rendered.
// ============================================================

interface TfLiveTickerProps {
  /** Pre-formatted lines of real activity */
  items: string[];
  /** Rotation interval in ms */
  interval?: number;
  className?: string;
}

export function TfLiveTicker({ items, interval = 3500, className }: TfLiveTickerProps) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, interval);
    return () => clearInterval(id);
  }, [items.length, interval]);

  if (items.length === 0) return null;

  return (
    <p
      className={cn("flex items-center gap-2 text-xs text-tf-stone-500", className)}
      aria-live="off"
    >
      <span
        aria-hidden="true"
        className="tf-presence size-1.5 shrink-0 rounded-full bg-tf-verified"
      />
      {/* key change re-runs the rise-in animation per line */}
      <span key={index} className="tf-ticker-item truncate">
        {items[index]}
      </span>
    </p>
  );
}
