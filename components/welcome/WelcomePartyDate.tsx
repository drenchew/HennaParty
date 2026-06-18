"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

/** Ornamental party date beneath the welcome title. */
export function WelcomePartyDate() {
  const { t } = useLocale();

  return (
    <p className="welcome-party-date" aria-label={t("welcome.partyDateFull")}>
      <span className="welcome-party-date__line" aria-hidden />
      <span className="welcome-party-date__gem" aria-hidden>
        ✦
      </span>
      <span className="welcome-party-date__card">
        <span className="welcome-party-date__day">{t("welcome.partyDateDay")}</span>
        <span className="welcome-party-date__month">{t("welcome.partyDateMonth")}</span>
      </span>
      <span className="welcome-party-date__gem" aria-hidden>
        ✦
      </span>
      <span className="welcome-party-date__line" aria-hidden />
    </p>
  );
}
