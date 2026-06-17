"use client";

import Link from "next/link";
import { FLOW_STEPS, STEP_LABELS, STEP_ROUTES, type GuestStep } from "@/lib/constants/steps";
import { useFlowContext } from "@/components/providers/FlowProvider";

interface ProgressStepperProps {
  currentStep: GuestStep;
}

export function ProgressStepper({ currentStep }: ProgressStepperProps) {
  const { canAccess, isComplete } = useFlowContext();
  const currentIndex = FLOW_STEPS.indexOf(currentStep as (typeof FLOW_STEPS)[number]);

  return (
    <nav className="flow-stepper" aria-label="Progress">
      <ol className="flow-stepper-list">
        {FLOW_STEPS.map((step, index) => {
          const accessible = canAccess(step);
          const complete = isComplete(step);
          const active = step === currentStep;
          const status = complete ? "complete" : active ? "current" : accessible ? "available" : "locked";

          return (
            <li key={step} className="flow-stepper-item" data-status={status}>
              {accessible ? (
                <Link
                  href={STEP_ROUTES[step]}
                  className="flow-stepper-link"
                  aria-current={active ? "step" : undefined}
                >
                  <span className="flow-stepper-dot">{complete ? "✓" : index + 1}</span>
                  <span className="flow-stepper-label">{STEP_LABELS[step]}</span>
                </Link>
              ) : (
                <span className="flow-stepper-link flow-stepper-link--locked">
                  <span className="flow-stepper-dot">{index + 1}</span>
                  <span className="flow-stepper-label">{STEP_LABELS[step]}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {currentIndex >= 0 && (
        <p className="flow-stepper-meta">
          Step {currentIndex + 1} of {FLOW_STEPS.length}
        </p>
      )}
    </nav>
  );
}
