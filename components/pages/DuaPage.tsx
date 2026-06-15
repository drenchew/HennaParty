"use client";

import { PageShell } from "@/components/layout/PageShell";
import { StepNavigation, StepPlaceholder } from "@/components/layout/StepNavigation";
import { useGuestContext } from "@/components/providers/GuestProvider";
import { useStepGuard } from "@/hooks/useStepGuard";
import { STEP_ROUTES } from "@/lib/constants/steps";
import { assignDua } from "@/services/guest.service";
import { isApiError } from "@/lib/utils/api";
import { useEffect, useState } from "react";
import type { Dua } from "@/types";

/** Dua step — calls assignDua on mount; UI placeholder. */
export function DuaPage() {
  const { progress, isLoading } = useGuestContext();
  const [dua, setDua] = useState<Dua | null>(null);
  const [error, setError] = useState<string | null>(null);

  useStepGuard("dua", progress, isLoading);

  useEffect(() => {
    void (async () => {
      const result = await assignDua();
      if (isApiError(result)) {
        setError(result.error);
        return;
      }
      setDua(result.data.dua);
    })();
  }, []);

  return (
    <PageShell step="dua">
      <StepPlaceholder
        title="Your Unique Dua"
        description="Architecture shell — displays assigned arabic + translation."
      />
      {dua && (
        <article data-dua-id={dua.id}>
          <p lang="ar">{dua.arabic}</p>
          <p>{dua.translation}</p>
        </article>
      )}
      {error && <p data-status="error">{error}</p>}
      <StepNavigation
        href={STEP_ROUTES.capsule}
        label="I accept this dua"
        nextStep="capsule"
      />
    </PageShell>
  );
}
