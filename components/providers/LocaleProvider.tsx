"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createTranslator,
  DEFAULT_LOCALE,
  getStoredLocale,
  setStoredLocale,
  type Locale,
  type TranslateFn,
} from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: TranslateFn;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocaleState(getStoredLocale() ?? DEFAULT_LOCALE);
    setHydrated(true);
  }, []);

  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [dir, hydrated, locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setStoredLocale(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === "ar" ? "en" : "ar";
      setStoredLocale(next);
      return next;
    });
  }, []);

  const t = useMemo(() => createTranslator(locale), [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, dir, t, setLocale, toggleLocale }),
    [dir, locale, setLocale, t, toggleLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
