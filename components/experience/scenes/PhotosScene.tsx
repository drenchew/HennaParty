"use client";

import { ExperienceNav } from "@/components/experience/ExperienceNav";
import { useExperienceContext } from "@/components/experience/ExperienceProvider";
import { SceneShell } from "@/components/experience/SceneShell";
import { OrnamentalCard } from "@/components/ornamental";
import { PhotoUpload } from "@/components/photos/PhotoUpload";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { MAX_PHOTOS_PER_GUEST } from "@/lib/constants/steps";
import { completeStep } from "@/services/mock/flow.service";

export function PhotosScene() {
  const { refresh } = useFlowContext();
  const { nextStep, prevStep } = useExperienceContext();
  const { t } = useLocale();

  function handleContinue() {
    completeStep("photos");
    refresh();
    nextStep();
  }

  return (
    <SceneShell
      step="photos"
      title={t("photos.title")}
      subtitle={t("photos.subtitle", { max: MAX_PHOTOS_PER_GUEST })}
      footer={
        <ExperienceNav
          onBack={prevStep}
          continueLabel={t("common.continue")}
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
