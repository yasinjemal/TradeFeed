"use client";

import * as React from "react";

// ============================================================
// TfCountUp — live platform numbers count up once when they
// scroll into view. Motion with meaning: these are real DB
// counts, and counting communicates "live", not decoration.
// Reduced-motion or no-JS: renders the final number instantly.
// ============================================================

interface TfCountUpProps {
  value: number;
  /** Duration in ms (default 900, capped well under attention cost) */
  duration?: number;
  className?: string;
}

export function TfCountUp({ value, duration = 900, className }: TfCountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = React.useState(value);
  const started = React.useRef(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || started.current) return;
      started.current = true;
      observer.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        // ease-out cubic — settles softly like the rest of the system
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(Math.round(value * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      setDisplay(0);
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString("en-ZA")}
    </span>
  );
}
