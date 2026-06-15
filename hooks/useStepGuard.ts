"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { STEP_ROUTES, type GuestStep } from "@/lib/constants/steps";
import { getStoredStep } from "@/lib/guest/step-storage";
import { isStepAtLeast, resolveAllowedStep } from "@/lib/utils/steps";
import type { GuestProgress } from "@/types";

/**
 * Redirects guests who bookmark ahead to their furthest allowed step.
 * Combines server progress with localStorage step hint for photos → advice transition.
 */
export function useStepGuard(
  requiredStep: GuestStep,
  progress: GuestProgress | null,
  isLoading: boolean,
): void {
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !progress) return;

    const allowed = resolveAllowedStep(progress, getStoredStep());
    if (!isStepAtLeast(allowed, requiredStep)) {
      router.replace(STEP_ROUTES[allowed]);
    }
  }, [requiredStep, progress, isLoading, router]);
}
