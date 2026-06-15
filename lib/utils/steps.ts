import { GUEST_STEPS, type GuestStep } from "@/lib/constants/steps";

const STEP_INDEX: Record<GuestStep, number> = GUEST_STEPS.reduce(
  (acc, step, index) => {
    acc[step] = index;
    return acc;
  },
  {} as Record<GuestStep, number>,
);

/** Returns true if `current` is at or beyond `required` in the flow. */
export function isStepAtLeast(current: GuestStep, required: GuestStep): boolean {
  return STEP_INDEX[current] >= STEP_INDEX[required];
}

/** Next step in the linear journey, or null when already complete. */
export function getNextStep(current: GuestStep): GuestStep | null {
  const index = STEP_INDEX[current];
  if (index >= GUEST_STEPS.length - 1) return null;
  return GUEST_STEPS[index + 1];
}

/** Derive the furthest allowed step from server-side progress flags. */
export function deriveSuggestedStep(progress: {
  hasDua: boolean;
  duaAccepted: boolean;
  hasVideo: boolean;
  hasMessage: boolean;
  questionnaireComplete: boolean;
}): GuestStep {
  if (progress.questionnaireComplete) return "complete";
  if (progress.hasMessage) return "questionnaire";
  if (progress.hasVideo) return "photos";
  if (progress.duaAccepted) return "capsule";
  if (progress.hasDua) return "dua";
  return "welcome";
}

/** Merge server progress with client step hint (photos/advice have no DB milestone). */
export function resolveAllowedStep(
  progress: Parameters<typeof deriveSuggestedStep>[0],
  clientStep: GuestStep | null,
): GuestStep {
  const serverStep = deriveSuggestedStep(progress);
  if (!clientStep) return serverStep;
  return isStepAtLeast(clientStep, serverStep) ? clientStep : serverStep;
}
