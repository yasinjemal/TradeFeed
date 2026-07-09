// ============================================================
// Cookie Consent Banner — POPIA Compliance
// ============================================================
// Dismissible cookie consent banner for SA POPIA compliance.
// Uses localStorage to remember user's choice.
// Only shows once — respects user preference.
//
// Keep the notice compact so it does not cover a product or primary action.
// ============================================================

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "tradefeed-cookie-consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if user hasn't consented yet
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-[70] max-w-[calc(100vw-2rem)] sm:max-w-sm"
      role="region"
      aria-label="Cookie notice"
    >
      <div>
        <div className="rounded-xl border border-stone-200 bg-white p-3 text-stone-600 shadow-lg shadow-stone-950/10">
          <div className="flex items-start gap-3">
            {/* Cookie icon */}
            <div className="hidden">
              <span className="text-lg">🍪</span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-stone-900">
                Your privacy
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-stone-600">
                We use cookies for sign-in and anonymous traffic insights.{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-emerald-700 hover:underline"
                >
                  Privacy
                </Link>
              </p>
            </div>
            <button
              onClick={accept}
              className="shrink-0 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
