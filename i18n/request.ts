import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, locales, LOCALE_COOKIE, type Locale } from "./config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  // 1. Check cookie first (user preference)
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return {
      locale: cookieLocale,
      messages: (await import(`../messages/${cookieLocale}.json`)).default,
    };
  }

  // 2. Fall back to Accept-Language header
  const acceptLang = headerStore.get("accept-language") ?? "";
  const detected = acceptLang
    .split(",")
    .map((part) => part.split(";")[0]?.trim().split("-")[0])
    .find((code): code is Locale => locales.includes(code as Locale));

  const locale = detected ?? defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
