// ============================================================
// Component — Mobile Navigation Drawer (Landing Page)
// ============================================================
// Hamburger button (visible md:hidden) + slide-out drawer
// with nav links and auth actions.
// ============================================================

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MobileNavProps {
  ctaHref: string;
  ctaLabel: string;
  isSignedIn: boolean;
}

export function MobileNav({ ctaHref, ctaLabel, isSignedIn }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Hamburger Button — visible on mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/[0.06] transition-colors text-stone-400"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Drawer overlay + panel */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
          />

          {/* Slide-in panel */}
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-stone-950 border-l border-stone-800/50 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            {/* Close button */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800/50">
              <span className="font-bold text-lg tracking-tight">
                Trade<span className="text-emerald-400">Feed</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/[0.06] transition-colors text-stone-400"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-4 py-6 space-y-1">
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "FAQ", href: "#faq" },
                { label: "Marketplace", href: "/marketplace" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-stone-300 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Auth actions */}
            <div className="px-4 pb-6 space-y-2 border-t border-stone-800/50 pt-4">
              {isSignedIn ? (
                <Link
                  href={ctaHref}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
                >
                  {ctaLabel} →
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center w-full px-5 py-3 text-sm text-stone-400 hover:text-white border border-stone-800 rounded-xl transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-5 py-3 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    Start Free →
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
