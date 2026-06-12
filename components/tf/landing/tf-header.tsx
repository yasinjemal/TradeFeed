"use client";

import * as React from "react";

// ============================================================
// TfLandingHeader — the self-aware header shell. Renders flat
// and borderless at the top of the page; once the user scrolls
// it lifts into translucent glass (border + shadow + tint).
// Styling lives in .tf-header (globals.css); this component
// only flips the data attribute.
//
// rAF-throttled passive scroll listener — one boolean state
// change at the 4px threshold, no work per scroll frame.
// ============================================================

export function TfLandingHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = React.useState(false);
  const ticking = React.useRef(false);

  React.useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 4);
        ticking.current = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="tf-header sticky top-0 z-30" data-scrolled={scrolled}>
      {children}
    </header>
  );
}
