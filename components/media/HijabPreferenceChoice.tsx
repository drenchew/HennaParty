"use client";

import { useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";

interface HijabPreferenceChoiceProps {
  value: boolean | null;
  onChange: (hijabi: boolean) => void;
  disabled?: boolean;
}

/** Choose standard vs hijabi-private photo & video section. */
export function HijabPreferenceChoice({
  value,
  onChange,
  disabled = false,
}: HijabPreferenceChoiceProps) {
  const { t } = useLocale();

  return (
    <div className="media-hijab-choice">
      <p className="media-hijab-choice__prompt">{t("media.hijabPrompt")}</p>
      <div
        className="media-hijab-choice__options"
        role="group"
        aria-label={t("media.hijabPrompt")}
      >
        <button
          type="button"
          className={`media-hijab-choice__option ${value === true ? "media-hijab-choice__option--selected" : ""}`}
          onClick={() => onChange(true)}
          disabled={disabled}
          aria-pressed={value === true}
        >
          <span className="media-hijab-choice__option-icon" aria-hidden>
            ✦
          </span>
          {t("media.hijabYes")}
        </button>
        <button
          type="button"
          className={`media-hijab-choice__option ${value === false ? "media-hijab-choice__option--selected" : ""}`}
          onClick={() => onChange(false)}
          disabled={disabled}
          aria-pressed={value === false}
        >
          <span className="media-hijab-choice__option-icon" aria-hidden>
            ✦
          </span>
          {t("media.hijabNo")}
        </button>
      </div>
      <p className="media-hijab-choice__note">{t("media.hijabNote")}</p>
    </div>
  );
}
