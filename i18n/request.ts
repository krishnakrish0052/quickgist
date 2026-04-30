import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { locales, defaultLocale, countryToLocale, LOCALE_COOKIE, type Locale } from "@/i18n/routing";

function parseAcceptLanguage(header: string): Locale | undefined {
  const tags = header.split(",").map((t) => t.trim().split(";")[0].toLowerCase().slice(0, 2));
  for (const tag of tags) {
    if (locales.includes(tag as Locale)) return tag as Locale;
  }
  return undefined;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined;
  const validCookie = cookieLocale && locales.includes(cookieLocale) ? cookieLocale : undefined;

  const country = headerStore.get("x-vercel-ip-country") ?? headerStore.get("cf-ipcountry");
  const countryLocale = country ? countryToLocale[country.toUpperCase()] : undefined;

  const acceptLang = headerStore.get("accept-language") ?? "";
  const acceptLocale = parseAcceptLanguage(acceptLang);

  const locale: Locale = validCookie ?? countryLocale ?? acceptLocale ?? defaultLocale;

  const messages = (await import(`@/messages/${locale}.json`)).default;

  return { locale, messages };
});
