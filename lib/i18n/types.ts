export type Locale = "ar" | "en";

export const DEFAULT_LOCALE: Locale = "ar";

export const LOCALE_STORAGE_KEY = "henna_locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "ar" || value === "en";
}
