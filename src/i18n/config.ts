export const locales = ["en", "fr", "ar"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

export const defaultLocale: Locale = "en";

export const rtlLocales: Locale[] = ["ar"];

export function isRTL(locale: Locale) {
  return rtlLocales.includes(locale);
}
