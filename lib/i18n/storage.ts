import { LOCALE_STORAGE_KEY, type Locale } from "./types";

export function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(LOCALE_STORAGE_KEY);
  return value === "ar" || value === "en" ? value : null;
}

export function setStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}
