"use client";

import { useRef } from "react";
import { AdviceForm, type AdviceFormHandle } from "@/components/advice/AdviceForm";
import { ExperienceNav } from "@/components/experience/ExperienceNav";
import { useExperienceContext } from "@/components/experience/ExperienceProvider";
import { SceneShell } from "@/components/experience/SceneShell";
import { OrnamentalCard } from "@/components/ornamental";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { completeStep } from "@/services/mock/flow.service";

export function AdviceScene() {
  const { refresh } = useFlowContext();
  const { nextStep, prevStep } = useExperienceContext();
  const { t } = useLocale();
  const formRef = useRef<AdviceFormHandle>(null);

  async function handleContinue() {
    const ok = (await formRef.current?.submit()) ?? false;
    if (!ok) return false;

    completeStep("advice");
    refresh();
    nextStep();
    return true;
  }

  return (
    <SceneShell
      step="advice"
      title={t("advice.title")}
      subtitle={t("advice.subtitle")}
      footer={
        <ExperienceNav
          onBack={prevStep}
          continueLabel={t("advice.submit")}
          onContinue={handleContinue}
        />
      }
    >
      <OrnamentalCard>
        <AdviceForm ref={formRef} />
      </OrnamentalCard>
    </SceneShell>
  );
}
