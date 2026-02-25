// ============================================================
// Cookie Consent Banner — POPIA Compliance
// ============================================================
// Dismissible cookie consent banner for SA POPIA compliance.
// Uses localStorage to remember user's choice.
// Only shows once — respects user preference.
//
// NOTE: TradeFeed only uses essential cookies (Clerk auth session).
// No third-party tracking. This banner is for transparency.
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
      className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-0"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="sm:max-w-lg sm:mx-auto sm:mb-6">
        <div className="bg-stone-900 text-stone-300 rounded-2xl shadow-2xl shadow-black/30 border border-stone-800 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            {/* Cookie icon */}
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-lg">🍪</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-200 mb-1">
                We respect your privacy
              </p>
              <p className="text-xs text-stone-400 leading-relaxed">
                TradeFeed uses essential cookies for authentication and Google Analytics
                for anonymised traffic insights. We don&apos;t share data with advertisers.{" "}
                <Link
                  href="/privacy"
                  className="text-emerald-400 hover:underline"
                >
                  Privacy Policy
                </Link>
              </p>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={accept}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all active:scale-[0.98]"
                >
                  Got it
                </button>
                <Link
                  href="/privacy"
                  className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
                >
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
