"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { locales, localeNames, LOCALE_COOKIE, type Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleChange(newLocale: Locale) {
    startTransition(() => {
      document.cookie = `${LOCALE_COOKIE}=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
      window.location.reload();
    });
  }

  return (
    <div className="relative inline-block">
      <select
        value={currentLocale}
        onChange={(e) => handleChange(e.target.value as Locale)}
        disabled={isPending}
        aria-label="Select language"
        className="appearance-none bg-stone-800/50 text-stone-300 text-xs font-medium px-3 py-1.5 pr-7 rounded-lg border border-stone-700 hover:border-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors cursor-pointer disabled:opacity-50"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeNames[locale]}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );
}
