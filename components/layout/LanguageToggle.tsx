"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

/** Switch between Arabic (default) and English — sits in the card header, scrolls with content. */
export function LanguageToggle() {
  const { locale, toggleLocale, t } = useLocale();
  const label =
    locale === "ar" ? t("common.switchToEnglish") : t("common.switchToArabic");

  return (
    <div className="language-toggle-bar">
      <span className="language-toggle-bar__line" aria-hidden />
      <span className="language-toggle-bar__gem" aria-hidden>
        ✦
      </span>
      <button
        type="button"
        className="language-toggle"
        onClick={toggleLocale}
        aria-label={label}
      >
        {label}
      </button>
      <span className="language-toggle-bar__gem" aria-hidden>
        ✦
      </span>
      <span className="language-toggle-bar__line" aria-hidden />
    </div>
  );
}
