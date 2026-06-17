"use client";

import { ExperienceNav } from "@/components/experience/ExperienceNav";
import { useExperienceContext } from "@/components/experience/ExperienceProvider";
import { SceneShell } from "@/components/experience/SceneShell";
import { OrnamentalCard } from "@/components/ornamental";
import { PhotoUpload } from "@/components/photos/PhotoUpload";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { MAX_PHOTOS_PER_GUEST } from "@/lib/constants/steps";
import { completeStep } from "@/services/mock/flow.service";

export function PhotosScene() {
  const { refresh } = useFlowContext();
  const { nextStep, prevStep } = useExperienceContext();

  function handleContinue() {
    completeStep("photos");
    refresh();
    nextStep();
  }

  return (
    <SceneShell
      step="photos"
      title="Share Your Photos"
      subtitle={`Upload up to ${MAX_PHOTOS_PER_GUEST} photos from tonight.`}
      footer={
        <ExperienceNav
          onBack={prevStep}
          continueLabel="Continue"
          onContinue={handleContinue}
        />
      }
    >
      <OrnamentalCard>
        <PhotoUpload />
      </OrnamentalCard>
    </SceneShell>
  );
}
