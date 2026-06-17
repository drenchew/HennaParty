import { GUEST_STEPS, STEP_LABELS, type GuestStep } from "@/lib/constants/steps";

/** Ordered scenes in the cinematic scroll experience. */
export const EXPERIENCE_STEPS = GUEST_STEPS;

export type ExperienceStep = GuestStep;

export function stepToIndex(step: GuestStep): number {
  return EXPERIENCE_STEPS.indexOf(step);
}

export function indexToStep(index: number): GuestStep {
  return EXPERIENCE_STEPS[Math.max(0, Math.min(index, EXPERIENCE_STEPS.length - 1))];
}

export function stepLabel(step: GuestStep): string {
  return STEP_LABELS[step];
}

/** Steps shown in the ornamental progress indicator (excludes welcome & complete). */
export const EXPERIENCE_PROGRESS_STEPS = EXPERIENCE_STEPS.filter(
  (s) => s !== "welcome" && s !== "complete",
);
