"use client";

import * as React from "react";
import { BadgeCheck } from "lucide-react";

interface TfMarqueeItem {
  name: string;
  city: string | null;
  isVerified: boolean;
}

interface TfMarqueeProps {
  items: TfMarqueeItem[];
  className?: string;
  /** Speed multiplier — higher = slower (default 40s) */
  duration?: number;
}

export function TfMarquee({ items, className, duration = 40 }: TfMarqueeProps) {
  if (items.length === 0) return null;

  // Repeat until we have at least 12 entries for a seamless loop
  const fill = Math.ceil(12 / items.length);
  const track = Array.from({ length: fill * 2 }, () => items).flat();

  return (
    <div
      className={`overflow-hidden ${className ?? ""}`}
      aria-hidden="true"
    >
      <div
        className="tf-marquee-track flex items-center gap-10 whitespace-nowrap"
        style={{ "--tf-marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        {track.map((item, i) => (
          <span
            key={i}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm text-tf-stone-600"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-tf-primary opacity-50" />
            <span className="font-medium text-tf-ink">{item.name}</span>
            {item.city && (
              <span className="text-tf-stone-400 text-xs">· {item.city}</span>
            )}
            {item.isVerified && (
              <BadgeCheck className="size-3.5 shrink-0 text-tf-verified" />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
