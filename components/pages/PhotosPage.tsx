"use client";

import { PageShell } from "@/components/layout/PageShell";
import { StepNavigation, StepPlaceholder } from "@/components/layout/StepNavigation";
import { useGuestContext } from "@/components/providers/GuestProvider";
import { useStepGuard } from "@/hooks/useStepGuard";
import { STEP_ROUTES } from "@/lib/constants/steps";

/** Photos step — up to 3 uploads; UI placeholder. */
export function PhotosPage() {
  const { progress, isLoading } = useGuestContext();
  useStepGuard("photos", progress, isLoading);

  return (
    <PageShell step="photos">
      <StepPlaceholder
        title="Share Your Photos"
        description="Architecture shell — PhotoCapture with camera/gallery."
      />
      <StepNavigation href={STEP_ROUTES.advice} label="Continue" nextStep="advice" />
    </PageShell>
  );
}
