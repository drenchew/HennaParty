"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { StepPlaceholder } from "@/components/layout/StepNavigation";
import { useGuestContext } from "@/components/providers/GuestProvider";
import { useStepGuard } from "@/hooks/useStepGuard";
import { getEventStats } from "@/services/guest.service";
import { isApiError } from "@/lib/utils/api";
import type { EventStats } from "@/types";

/** Thank-you step — aggregate stats; UI placeholder. */
export function ThankYouPage() {
  const { progress, isLoading } = useGuestContext();
  const [stats, setStats] = useState<EventStats | null>(null);

  useStepGuard("complete", progress, isLoading);

  useEffect(() => {
    void (async () => {
      const result = await getEventStats();
      if (!isApiError(result)) setStats(result.data);
    })();
  }, []);

  return (
    <PageShell step="complete">
      <StepPlaceholder
        title="Thank You"
        description="Architecture shell — StatsDisplay with Framer Motion."
      />
      {stats && (
        <dl data-stats>
          <dt>Duas</dt>
          <dd>{stats.duas_assigned}</dd>
          <dt>Photos</dt>
          <dd>{stats.photos_uploaded}</dd>
          <dt>Messages</dt>
          <dd>{stats.messages_count}</dd>
        </dl>
      )}
    </PageShell>
  );
}
