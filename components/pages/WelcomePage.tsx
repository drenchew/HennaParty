"use client";

import { PageShell } from "@/components/layout/PageShell";
import { StepNavigation, StepPlaceholder } from "@/components/layout/StepNavigation";
import { STEP_ROUTES } from "@/lib/constants/steps";
import { useGuestContext } from "@/components/providers/GuestProvider";

/** Welcome step — initializes session; UI placeholder. */
export function WelcomePage() {
  const { isLoading, error } = useGuestContext();

  return (
    <PageShell step="welcome">
      <StepPlaceholder
        title="Welcome to our Henna Night"
        description="Architecture shell — UI coming next."
      />
      {isLoading && <p data-status="loading">Initializing session…</p>}
      {error && <p data-status="error">{error}</p>}
      <StepNavigation href={STEP_ROUTES.dua} label="Start Experience" nextStep="dua" />
    </PageShell>
  );
}
