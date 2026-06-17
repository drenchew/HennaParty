"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

/** Switch between Arabic (default) and English. */
export function LanguageToggle() {
  const { locale, toggleLocale, t } = useLocale();

  return (
    <button
      type="button"
      className="language-toggle"
      onClick={toggleLocale}
      aria-label={locale === "ar" ? t("common.switchToEnglish") : t("common.switchToArabic")}
    >
      {locale === "ar" ? t("common.switchToEnglish") : t("common.switchToArabic")}
    </button>
  );
}
