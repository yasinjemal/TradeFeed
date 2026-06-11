"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// ============================================================
// TfReveal — the one scroll-choreography primitive of the TF
// motion system ("Counter-weight"). IntersectionObserver flips
// a class; CSS does all the animating (compositor-only).
//
// Safety properties:
// - prefers-reduced-motion users: CSS never hides anything.
// - Slow/failed JS: a 1.6s CSS failsafe force-shows content.
// - Fires once; observer disconnects immediately after.
//
// `stagger` animates direct children in 60ms steps instead of
// the wrapper as one block. `delay` offsets the whole reveal.
// ============================================================

interface TfRevealProps extends React.ComponentProps<"div"> {
  /** Stagger direct children instead of revealing as one block */
  stagger?: boolean;
  /** Extra delay in ms (use sparingly — load choreography only) */
  delay?: number;
  /** Render as a different element */
  as?: "div" | "section" | "ul" | "li" | "span";
}

export function TfReveal({
  stagger = false,
  delay = 0,
  as: Tag = "div",
  className,
  style,
  children,
  ...props
}: TfRevealProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    // Already on screen at mount (above the fold): reveal next frame
    // so the transition still plays as load choreography.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // @ts-expect-error — ref type narrows per tag; runtime is fine
      ref={ref}
      className={cn(stagger ? "tf-stagger" : "tf-reveal", inView && "tf-in", className)}
      style={delay ? ({ ...style, "--tf-d": `${delay}ms` } as React.CSSProperties) : style}
      {...props}
    >
      {children}
    </Tag>
  );
}
