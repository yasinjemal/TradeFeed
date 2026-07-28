"use client";

// ============================================================
// useInView — continuous viewport visibility for an element.
// Unlike TfReveal's observer (one-shot: fires once, disconnects)
// this keeps reporting enter AND exit, which is what video
// autoplay needs (play when visible, pause when scrolled away).
// SSR-safe: no observer on the server, inView stays false.
// ============================================================

import * as React from "react";

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useInView<T extends HTMLElement = HTMLElement>(
  options?: UseInViewOptions,
): { ref: React.RefObject<T | null>; inView: boolean } {
  const ref = React.useRef<T | null>(null);
  const [inView, setInView] = React.useState(false);
  const { threshold = 0.5, rootMargin = "0px" } = options ?? {};

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInView(entry.isIntersecting);
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, inView };
}
