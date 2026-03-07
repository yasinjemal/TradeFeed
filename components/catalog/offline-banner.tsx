// ============================================================
// Offline Banner — Shows when the user has no internet
// ============================================================
// Displayed at the top of the catalog when the browser is offline.
// Uses the errors.offline translation key from next-intl.
// Auto-hides when back online.
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const t = useTranslations("errors");

  useEffect(() => {
    // Check initial state
    setOffline(!navigator.onLine);

    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="bg-amber-500/90 text-amber-950 px-4 py-2.5 text-center text-sm font-medium backdrop-blur-sm">
      <div className="flex items-center justify-center gap-2">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <span>{t("offline")}</span>
        <span className="hidden sm:inline text-amber-900/80">— {t("loadShedding")}</span>
      </div>
    </div>
  );
}
