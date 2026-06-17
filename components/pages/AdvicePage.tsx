"use client";

import { useRef } from "react";
import { FlowLayout } from "@/components/layout/FlowLayout";
import { FlowNav } from "@/components/layout/FlowNavigation";
import { StepGuard } from "@/components/layout/StepGuard";
import { AdviceForm, type AdviceFormHandle } from "@/components/advice/AdviceForm";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { STEP_ROUTES } from "@/lib/constants/steps";
import { completeStep } from "@/services/mock/flow.service";

export function AdvicePage() {
  const { refresh, nextRoute } = useFlowContext();
  const formRef = useRef<AdviceFormHandle>(null);

  async function handleContinue(): Promise<boolean> {
    const ok = (await formRef.current?.submit()) ?? false;
    if (!ok) return false;

    completeStep("advice");
    refresh();
    return true;
  }

  return (
    <StepGuard step="advice">
      <FlowLayout
        step="advice"
        title="Leave Your Advice"
        subtitle="Share a message, du'a, or piece of wisdom for the couple. You cannot edit after submitting."
        footer={
          <FlowNav
            backHref={STEP_ROUTES.photos}
            nextLabel="Submit Advice"
            onNext={handleContinue}
            nextHref={nextRoute("advice")}
          />
        }
      >
        <div className="flow-card">
          <AdviceForm ref={formRef} />
        </div>
      </FlowLayout>
    </StepGuard>
  );
}
