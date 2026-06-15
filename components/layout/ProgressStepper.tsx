import type { GuestStep } from "@/lib/constants/steps";

interface ProgressStepperProps {
  currentStep: GuestStep;
}

/** Visual step indicator — placeholder until UI phase. */
export function ProgressStepper({ currentStep }: ProgressStepperProps) {
  return <nav aria-label="Progress" data-step={currentStep} />;
}
