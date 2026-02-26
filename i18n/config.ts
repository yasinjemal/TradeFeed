// ============================================================
// i18n Configuration — Supported Locales
// ============================================================
// South Africa has 11 official languages. We start with 5:
// English (default), Zulu, Xhosa, Afrikaans, Sotho
// ============================================================

export const locales = ["en", "zu", "xh", "af", "st"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  zu: "isiZulu",
  xh: "isiXhosa",
  af: "Afrikaans",
  st: "Sesotho",
};

export const LOCALE_COOKIE = "TRADEFEED_LOCALE";
