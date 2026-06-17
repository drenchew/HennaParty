"use client";

import { useState } from "react";
import { FlowLayout } from "@/components/layout/FlowLayout";
import { FlowNav } from "@/components/layout/FlowNavigation";
import { StepGuard } from "@/components/layout/StepGuard";
import { QuestionnaireVoting } from "@/components/questionnaire/QuestionnaireVoting";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { QUESTIONNAIRE } from "@/lib/questionnaire/constants";
import { STEP_ROUTES } from "@/lib/constants/steps";
import { completeStep } from "@/services/mock/flow.service";

export function QuestionnairePage() {
  const { refresh, nextRoute } = useFlowContext();
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const allAnswered = QUESTIONNAIRE.every((q) => Boolean(answers[q.id]));

  async function handleFinish(): Promise<boolean> {
    if (!allAnswered) return false;
    completeStep("questionnaire");
    refresh();
    return true;
  }

  return (
    <StepGuard step="questionnaire">
      <FlowLayout
        step="questionnaire"
        title="Fun Questionnaire"
        subtitle="Vote on each question — one answer per question. See how other guests voted with live results."
        footer={
          <FlowNav
            backHref={STEP_ROUTES.advice}
            nextLabel="See Thank You"
            onNext={handleFinish}
            nextHref={nextRoute("questionnaire")}
            nextDisabled={!allAnswered}
          />
        }
      >
        <QuestionnaireVoting onVotesChange={setAnswers} />
      </FlowLayout>
    </StepGuard>
  );
}
