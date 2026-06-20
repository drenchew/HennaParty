"use client";

import { ExperienceNav } from "@/components/experience/ExperienceNav";
import { useExperienceContext } from "@/components/experience/ExperienceProvider";
import { SceneShell } from "@/components/experience/SceneShell";
import { HijabPreferenceGate } from "@/components/media";
import { OrnamentalCard } from "@/components/ornamental";
import { PhotoUpload } from "@/components/photos/PhotoUpload";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useGuestHijabi } from "@/hooks/useGuestHijabi";
import { MAX_PHOTOS_PER_GUEST } from "@/lib/constants/steps";
import { completeStep } from "@/services/mock/flow.service";

export function PhotosScene() {
  const { refresh } = useFlowContext();
  const { nextStep, prevStep } = useExperienceContext();
  const { t } = useLocale();
  const { hijabi: guestHijabi, refresh: refreshGuestHijabi } = useGuestHijabi();

  const canUpload = guestHijabi !== null;

  const subtitle = !canUpload
    ? t("media.hijabIntro")
    : guestHijabi === true
      ? t("photos.subtitleHijabi", { max: MAX_PHOTOS_PER_GUEST })
      : t("photos.subtitleStandard", { max: MAX_PHOTOS_PER_GUEST });

  function handleContinue() {
    completeStep("photos");
    refresh();
    nextStep();
  }

  return (
    <SceneShell
      step="photos"
      title={t("photos.title")}
      subtitle={subtitle}
      footer={
        canUpload ? (
          <ExperienceNav
            onBack={prevStep}
            continueLabel={t("common.continue")}
            onContinue={handleContinue}
          />
        ) : (
          <ExperienceNav onBack={prevStep} showContinue={false} />
        )
      }
    >
      <HijabPreferenceGate onPreferenceSaved={refreshGuestHijabi}>
        <OrnamentalCard>
          <PhotoUpload />
        </OrnamentalCard>
      </HijabPreferenceGate>
    </SceneShell>
  );
}
