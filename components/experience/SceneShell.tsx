"use client";

import type { ReactNode } from "react";
import { OrnamentDivider } from "@/components/ornamental";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { EXPERIENCE_PROGRESS_STEPS, stepLabel } from "@/lib/experience/steps";
import type { GuestStep } from "@/lib/constants/steps";
import { StepIndicator } from "./StepIndicator";

interface SceneShellProps {
  step: GuestStep;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  framed?: boolean;
}

/** Full-viewport scene layout — glass panel over ornamental background. */
export function SceneShell({
  step,
  title,
  subtitle,
  children,
  footer,
  framed = false,
}: SceneShellProps) {
  const { isReady } = useFlowContext();
  const showProgress =
    step !== "welcome" && step !== "complete" && EXPERIENCE_PROGRESS_STEPS.includes(step);

  return (
    <section className="experience-scene" data-step={step} aria-label={stepLabel(step)}>
      <div className={`experience-glass ${framed ? "experience-glass--framed" : ""}`}>
        <header className="experience-header">
          <p className="experience-eyebrow">Henna Night · ليلة الحنة</p>
          {title ? <h1 className="experience-title">{title}</h1> : null}
          {subtitle ? <p className="experience-subtitle">{subtitle}</p> : null}
          {showProgress ? <StepIndicator currentStep={step} /> : null}
          <OrnamentDivider />
        </header>

        <div className="experience-body" data-ready={isReady}>
          {!isReady ? (
            <p className="experience-loading">Preparing your experience…</p>
          ) : (
            children
          )}
        </div>

        {footer ? <footer className="experience-footer">{footer}</footer> : null}
      </div>
    </section>
  );
}
