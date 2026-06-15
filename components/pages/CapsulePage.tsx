"use client";

import { PageShell } from "@/components/layout/PageShell";
import { StepNavigation, StepPlaceholder } from "@/components/layout/StepNavigation";
import { useGuestContext } from "@/components/providers/GuestProvider";
import { useStepGuard } from "@/hooks/useStepGuard";
import { STEP_ROUTES } from "@/lib/constants/steps";

/** Capsule step — video record/upload; UI placeholder. */
export function CapsulePage() {
  const { progress, isLoading } = useGuestContext();
  useStepGuard("capsule", progress, isLoading);

  return (
    <PageShell step="capsule">
      <StepPlaceholder
        title="Video Time Capsule"
        description="Architecture shell — VideoRecorder + upload to /api/capsule/upload."
      />
      <StepNavigation href={STEP_ROUTES.photos} label="Continue" nextStep="photos" />
    </PageShell>
  );
}
