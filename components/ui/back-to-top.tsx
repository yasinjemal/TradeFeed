// ============================================================
// Component — Back to Top Button
// ============================================================
// Floating button that appears after scrolling down.
// Smoothly scrolls back to top on click.
// ============================================================

"use client";

import { useState, useEffect } from "react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 w-10 h-10 bg-white border border-stone-200 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-stone-500 hover:text-emerald-600 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
      aria-label="Back to top"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    </button>
  );
}
