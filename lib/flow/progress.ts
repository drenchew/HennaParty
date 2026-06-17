import { GUEST_STEPS, STEP_ROUTES, type GuestStep } from "@/lib/constants/steps";
import type { FlowState } from "./types";

const STEP_INDEX: Record<GuestStep, number> = GUEST_STEPS.reduce(
  (acc, step, index) => {
    acc[step] = index;
    return acc;
  },
  {} as Record<GuestStep, number>,
);

export function isStepComplete(state: FlowState, step: GuestStep): boolean {
  return state.completedSteps.includes(step);
}

/** A step is accessible when every prior step in the journey is complete. */
export function canAccessStep(state: FlowState, step: GuestStep): boolean {
  const index = STEP_INDEX[step];
  if (index === 0) return true;

  for (let i = 0; i < index; i += 1) {
    const prior = GUEST_STEPS[i]!;
    if (!state.completedSteps.includes(prior)) return false;
  }
  return true;
}

/** Furthest step the guest is allowed to open (first incomplete, or complete). */
export function getMaxAccessibleStep(state: FlowState): GuestStep {
  for (const step of GUEST_STEPS) {
    if (!state.completedSteps.includes(step)) return step;
  }
  return "complete";
}

export function getNextStep(step: GuestStep): GuestStep | null {
  const index = STEP_INDEX[step];
  if (index >= GUEST_STEPS.length - 1) return null;
  return GUEST_STEPS[index + 1]!;
}

export function getStepRoute(step: GuestStep): string {
  return STEP_ROUTES[step];
}

export function markStepComplete(state: FlowState, step: GuestStep): FlowState {
  if (state.completedSteps.includes(step)) return state;
  return {
    ...state,
    completedSteps: [...state.completedSteps, step],
  };
}

export function pathnameToStep(pathname: string): GuestStep | null {
  const entry = Object.entries(STEP_ROUTES).find(([, route]) => route === pathname);
  return entry ? (entry[0] as GuestStep) : null;
}
