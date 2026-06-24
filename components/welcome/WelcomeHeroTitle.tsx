"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

const SPARK_COUNT = 14;

/** Welcome headline with Ayda / عايدة in a fiery sparkle glow. */
export function WelcomeHeroTitle() {
  const { locale, t } = useLocale();
  const name = (
    <span className="welcome-hero-name-wrap">
      <span className="welcome-hero-name">{t("welcome.heroName")}</span>
      <span className="welcome-hero-name__sparkles" aria-hidden>
        {Array.from({ length: SPARK_COUNT }, (_, index) => (
          <span key={index} className="welcome-hero-name__spark" data-i={index} />
        ))}
      </span>
    </span>
  );

  if (locale === "ar") {
    return (
      <>
        {t("welcome.heroTitlePrefix")} {name}
      </>
    );
  }

  return (
    <>
      {name} {t("welcome.heroTitleSuffix")}
    </>
  );
}
