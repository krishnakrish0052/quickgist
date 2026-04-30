export const locales = ["en", "hi", "es", "fr", "de", "ja", "pt", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
  pt: "Português",
  ar: "العربية"
};

export const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  hi: "🇮🇳",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  ja: "🇯🇵",
  pt: "🇧🇷",
  ar: "🇸🇦"
};

/** Vercel/Cloudflare country code → locale */
export const countryToLocale: Record<string, Locale> = {
  IN: "hi", PK: "hi", BD: "hi",
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es",
  FR: "fr", BE: "fr", CH: "fr",
  DE: "de", AT: "de",
  JP: "ja",
  BR: "pt", PT: "pt",
  SA: "ar", AE: "ar", EG: "ar", QA: "ar", KW: "ar", JO: "ar"
};

export const LOCALE_COOKIE = "quickgist_locale";
