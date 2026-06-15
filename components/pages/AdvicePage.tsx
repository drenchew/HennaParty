"use client";

import { PageShell } from "@/components/layout/PageShell";
import { StepNavigation, StepPlaceholder } from "@/components/layout/StepNavigation";
import { useGuestContext } from "@/components/providers/GuestProvider";
import { useStepGuard } from "@/hooks/useStepGuard";
import { STEP_ROUTES } from "@/lib/constants/steps";

/** Advice step — message for the couple; UI placeholder. */
export function AdvicePage() {
  const { progress, isLoading } = useGuestContext();
  useStepGuard("advice", progress, isLoading);

  return (
    <PageShell step="advice">
      <StepPlaceholder
        title="Leave Your Advice"
        description="Architecture shell — AdviceForm posts to /api/advice."
      />
      <StepNavigation
        href={STEP_ROUTES.questionnaire}
        label="Continue"
        nextStep="questionnaire"
      />
    </PageShell>
  );
}
