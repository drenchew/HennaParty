"use client";

import type { ReactNode } from "react";
import { ProgressStepper } from "@/components/layout/ProgressStepper";
import { STEP_LABELS, type GuestStep } from "@/lib/constants/steps";
import { useFlowContext } from "@/components/providers/FlowProvider";

interface FlowLayoutProps {
  step: GuestStep;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Reusable shell: header, stepper, content, optional footer actions. */
export function FlowLayout({ step, title, subtitle, children, footer }: FlowLayoutProps) {
  const { isReady } = useFlowContext();

  return (
    <div className="flow-page">
      <header className="flow-header">
        <p className="flow-eyebrow">Henna Night</p>
        <h1 className="flow-title">{title}</h1>
        {subtitle && <p className="flow-subtitle">{subtitle}</p>}
      </header>

      {step !== "welcome" && step !== "complete" && (
        <ProgressStepper currentStep={step} />
      )}

      <div className="flow-content" data-ready={isReady}>
        {!isReady ? <p className="flow-loading">Preparing your experience…</p> : children}
      </div>

      {footer && <footer className="flow-footer">{footer}</footer>}

      <p className="flow-step-label" aria-hidden>
        {STEP_LABELS[step]}
      </p>
    </div>
  );
}
