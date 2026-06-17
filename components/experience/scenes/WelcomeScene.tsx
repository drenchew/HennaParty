"use client";

import { useState } from "react";
import { GuestTokenInit } from "@/components/layout/StepGuard";
import { OrnamentalCard } from "@/components/ornamental";
import { ExperienceNav } from "@/components/experience/ExperienceNav";
import { SceneShell } from "@/components/experience/SceneShell";
import { useExperienceContext } from "@/components/experience/ExperienceProvider";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { isApiError } from "@/lib/utils/api";
import { completeStep } from "@/services/mock/flow.service";
import { initGuest } from "@/services/guest.service";

export function WelcomeScene() {
  const { guestToken, refresh } = useFlowContext();
  const { nextStep } = useExperienceContext();
  const { t } = useLocale();
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
    nextStep();
    setStarting(false);
  }

  return (
    <GuestTokenInit>
      <SceneShell
        step="welcome"
        title={t("welcome.title")}
        subtitle={t("welcome.subtitle")}
        framed
        footer={
          <ExperienceNav
            continueLabel={starting ? t("welcome.starting") : t("welcome.begin")}
            onContinue={handleStart}
            continueDisabled={starting}
            showBack={false}
          />
        }
      >
        <OrnamentalCard corners>
          <p className="experience-copy">{t("welcome.sessionReady")}</p>
          {guestToken && (
            <p className="experience-meta">
              {t("welcome.session")}: <code>{guestToken.slice(0, 8)}…</code>
            </p>
          )}
          {startError && <p className="experience-error">{startError}</p>}
        </OrnamentalCard>
      </SceneShell>
    </GuestTokenInit>
  );
}
