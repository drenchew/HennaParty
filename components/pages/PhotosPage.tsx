"use client";

import { FlowLayout } from "@/components/layout/FlowLayout";
import { FlowNav } from "@/components/layout/FlowNavigation";
import { StepGuard } from "@/components/layout/StepGuard";
import { PhotoUpload } from "@/components/photos/PhotoUpload";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { MAX_PHOTOS_PER_GUEST, STEP_ROUTES } from "@/lib/constants/steps";
import { completeStep } from "@/services/mock/flow.service";

export function PhotosPage() {
  const { refresh, nextRoute } = useFlowContext();

  function handleContinue() {
    completeStep("photos");
    refresh();
  }

  return (
    <StepGuard step="photos">
      <FlowLayout
        step="photos"
        title="Share Your Photos"
        subtitle={`Upload up to ${MAX_PHOTOS_PER_GUEST} photos from tonight.`}
        footer={
          <FlowNav
            backHref={STEP_ROUTES.video}
            nextLabel="Continue"
            onNext={handleContinue}
            nextHref={nextRoute("photos")}
          />
        }
      >
        <div className="flow-card">
          <PhotoUpload />
        </div>
      </FlowLayout>
    </StepGuard>
  );
}
