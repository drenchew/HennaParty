"use client";

import { PageShell } from "@/components/layout/PageShell";
import { StepNavigation, StepPlaceholder } from "@/components/layout/StepNavigation";
import { useGuestContext } from "@/components/providers/GuestProvider";
import { useStepGuard } from "@/hooks/useStepGuard";
import { STEP_ROUTES } from "@/lib/constants/steps";

/** Questionnaire step — MCQ votes; UI placeholder. */
export function QuestionnairePage() {
  const { progress, isLoading } = useGuestContext();
  useStepGuard("questionnaire", progress, isLoading);

  return (
    <PageShell step="questionnaire">
      <StepPlaceholder
        title="Fun Questionnaire"
        description="Architecture shell — QuestionCard posts to /api/questionnaire/vote."
      />
      <StepNavigation href={STEP_ROUTES.complete} label="Finish" nextStep="complete" />
    </PageShell>
  );
}
