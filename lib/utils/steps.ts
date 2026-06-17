import { GUEST_STEPS, type GuestStep } from "@/lib/constants/steps";

const STEP_INDEX: Record<GuestStep, number> = GUEST_STEPS.reduce(
  (acc, step, index) => {
    acc[step] = index;
    return acc;
  },
  {} as Record<GuestStep, number>,
);

export function isStepAtLeast(current: GuestStep, required: GuestStep): boolean {
  return STEP_INDEX[current] >= STEP_INDEX[required];
}

export function getNextStep(current: GuestStep): GuestStep | null {
  const index = STEP_INDEX[current];
  if (index >= GUEST_STEPS.length - 1) return null;
  return GUEST_STEPS[index + 1]!;
}

/** Used by Supabase API routes when wired up. */
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
  if (progress.duaAccepted) return "video";
  if (progress.hasDua) return "dua";
  return "welcome";
}
