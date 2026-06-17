"use client";

import { useRef } from "react";
import { AdviceForm, type AdviceFormHandle } from "@/components/advice/AdviceForm";
import { ExperienceNav } from "@/components/experience/ExperienceNav";
import { useExperienceContext } from "@/components/experience/ExperienceProvider";
import { SceneShell } from "@/components/experience/SceneShell";
import { OrnamentalCard } from "@/components/ornamental";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { completeStep } from "@/services/mock/flow.service";

export function AdviceScene() {
  const { refresh } = useFlowContext();
  const { nextStep, prevStep } = useExperienceContext();
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
      title="Leave Your Advice"
      subtitle="Share a message, du'a, or piece of wisdom for the couple. You cannot edit after submitting."
      footer={
        <ExperienceNav
          onBack={prevStep}
          continueLabel="Submit Advice"
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
