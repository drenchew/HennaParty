"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { pathnameToStep } from "@/lib/flow/progress";
import type { FlowState } from "@/lib/flow/types";
import { STEP_ROUTES, type GuestStep } from "@/lib/constants/steps";

/**
 * Redirects guests who navigate to a locked step back to their max accessible step.
 */
export function useStepGuard(
  step: GuestStep,
  flowState: FlowState | null,
  isReady: boolean,
  canAccess: (step: GuestStep) => boolean,
): void {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady || !flowState) return;

    const currentStep = pathnameToStep(pathname);
    if (!currentStep) return;

    if (!canAccess(currentStep)) {
      const fallback = canAccess(step)
        ? step
        : findFirstAccessible(canAccess);
      router.replace(STEP_ROUTES[fallback]);
    }
  }, [step, flowState, isReady, canAccess, router, pathname]);
}

function findFirstAccessible(canAccess: (step: GuestStep) => boolean): GuestStep {
  const order: GuestStep[] = [
    "welcome",
    "dua",
    "video",
    "photos",
    "advice",
    "questionnaire",
    "complete",
  ];
  for (let i = order.length - 1; i >= 0; i -= 1) {
    const step = order[i]!;
    if (canAccess(step)) return step;
  }
  return "welcome";
}
