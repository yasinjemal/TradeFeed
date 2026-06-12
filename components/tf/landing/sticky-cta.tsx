"use client";

import * as React from "react";
import Link from "next/link";

import { TfButton } from "@/components/tf/button";

// ============================================================
// TfLandingStickyCta — primary CTA slides in (fixed bottom)
// once the hero CTA scrolls out of view. Mobile only.
// ============================================================

interface TfLandingStickyCtaProps {
  href: string;
  label: string;
  /** id of the hero sentinel element to observe */
  sentinelId: string;
}

export function TfLandingStickyCta({ href, label, sentinelId }: TfLandingStickyCtaProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const sentinel = document.getElementById(sentinelId);
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!(entry?.isIntersecting ?? true)),
      { rootMargin: "-56px 0px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelId]);

  if (!visible) return null;

  return (
    <div
      className="tf-slide-up fixed inset-x-0 bottom-0 z-40 border-t border-tf-stone-200 bg-tf-raised/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden"
      role="region"
      aria-label="Sign up"
    >
      <TfButton asChild fullWidth size="lg">
        <Link href={href}>{label}</Link>
      </TfButton>
    </div>
  );
}
