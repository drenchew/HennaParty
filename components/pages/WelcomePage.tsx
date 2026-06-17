"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlowLayout } from "@/components/layout/FlowLayout";
import { FlowButton } from "@/components/layout/FlowNavigation";
import { GuestTokenInit } from "@/components/layout/StepGuard";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { STEP_ROUTES } from "@/lib/constants/steps";
import { completeStep } from "@/services/mock/flow.service";
import { initGuest } from "@/services/guest.service";
import { isApiError } from "@/lib/utils/api";

export function WelcomePage() {
  const router = useRouter();
  const { guestToken, refresh } = useFlowContext();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  async function handleStart() {
    if (starting) return;
    setStarting(true);
    setStartError(null);

    const init = await initGuest();
    if (isApiError(init)) {
      setStartError(init.error);
      setStarting(false);
      return;
    }

    completeStep("welcome");
    refresh();
    router.push(STEP_ROUTES.dua);
  }

  return (
    <GuestTokenInit>
      <FlowLayout
        step="welcome"
        title="Welcome to our Henna Night"
        subtitle="Thank you for being part of this special celebration. Each guest receives a unique experience — let's begin yours."
        footer={
          <FlowButton
            label={starting ? "Starting…" : "Start Experience"}
            onClick={handleStart}
            disabled={starting}
          />
        }
      >
        <div className="flow-card">
          <p>
            Your anonymous session is ready. No login required — we&apos;ve created a private
            guest ID just for you.
          </p>
          {guestToken && (
            <p className="flow-meta">
              Session: <code>{guestToken.slice(0, 8)}…</code>
            </p>
          )}
          {startError && <p className="flow-error">{startError}</p>}
        </div>
      </FlowLayout>
    </GuestTokenInit>
  );
}
