"use client";

import type { ReactNode } from "react";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { OrnamentDivider } from "@/components/ornamental";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { EXPERIENCE_PROGRESS_STEPS } from "@/lib/experience/steps";
import type { GuestStep } from "@/lib/constants/steps";
import { StepIndicator } from "./StepIndicator";

interface SceneShellProps {
  step: GuestStep;
  title?: ReactNode;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  framed?: boolean;
  /** Welcome scene uses a custom hero layout without the default eyebrow. */
  welcomeHero?: boolean;
  /** Optional ornament shown between title and subtitle on the welcome hero. */
  heroDate?: ReactNode;
}

/** Full-viewport scene layout — glass panel over ornamental background. */
export function SceneShell({
  step,
  title,
  subtitle,
  children,
  footer,
  framed = false,
  welcomeHero = false,
  heroDate,
}: SceneShellProps) {
  const { isReady } = useFlowContext();
  const { t } = useLocale();
  const showProgress =
    step !== "welcome" && step !== "complete" && EXPERIENCE_PROGRESS_STEPS.includes(step);

  const stepKey = step === "complete" ? "complete" : step;

  return (
    <section
      className="experience-scene"
      data-step={step}
      aria-label={t(`steps.${stepKey}`)}
    >
      <div
        className={`experience-glass ${framed ? "experience-glass--framed" : ""} ${welcomeHero ? "experience-glass--welcome" : ""}`}
      >
        <div className="experience-toolbar">
          <LanguageToggle />
        </div>
        <header
          className={`experience-header ${welcomeHero ? "experience-header--welcome" : ""}`}
        >
          {!welcomeHero ? (
            <p className="experience-eyebrow">{t("common.hennaNight")}</p>
          ) : null}
          {title ? (
            <h1
              className={`experience-title ${welcomeHero ? "welcome-hero-title" : ""}`}
            >
              {title}
            </h1>
          ) : null}
          {welcomeHero && heroDate ? heroDate : null}
          {subtitle ? (
            <p
              className={`experience-subtitle ${welcomeHero ? "welcome-hero-subtitle" : ""}`}
            >
              {subtitle}
            </p>
          ) : null}
          {showProgress ? <StepIndicator currentStep={step} /> : null}
          {!welcomeHero ? <OrnamentDivider /> : null}
        </header>

        <div className="experience-body" data-ready={isReady}>
          {!isReady ? (
            <p className="experience-loading">{t("common.loading")}</p>
          ) : (
            children
          )}
        </div>

        {footer ? <footer className="experience-footer">{footer}</footer> : null}
      </div>
    </section>
  );
}
