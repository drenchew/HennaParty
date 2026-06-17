"use client";

import { EXPERIENCE_PROGRESS_STEPS } from "@/lib/experience/steps";
import type { GuestStep } from "@/lib/constants/steps";
import { useFlowContext } from "@/components/providers/FlowProvider";

interface StepIndicatorProps {
  currentStep: GuestStep;
}

/** Ornamental progress dots — tatreez-inspired, not a SaaS stepper. */
export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const { isComplete } = useFlowContext();
  const currentIndex = EXPERIENCE_PROGRESS_STEPS.indexOf(
    currentStep as (typeof EXPERIENCE_PROGRESS_STEPS)[number],
  );

  return (
    <nav className="experience-steps" aria-label="Progress">
      <ol className="experience-steps__list">
        {EXPERIENCE_PROGRESS_STEPS.map((step, index) => {
          let status: "complete" | "current" | "upcoming" = "upcoming";
          if (isComplete(step)) status = "complete";
          else if (index === currentIndex) status = "current";

          return (
            <li key={step} className="experience-steps__item" data-status={status}>
              <span className="experience-steps__dot" aria-hidden />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
