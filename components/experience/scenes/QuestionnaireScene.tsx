"use client";

import { useState } from "react";
import { ExperienceNav } from "@/components/experience/ExperienceNav";
import { useExperienceContext } from "@/components/experience/ExperienceProvider";
import { SceneShell } from "@/components/experience/SceneShell";
import { QuestionnaireVoting } from "@/components/questionnaire/QuestionnaireVoting";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { completeStep } from "@/services/mock/flow.service";

export function QuestionnaireScene() {
  const { refresh } = useFlowContext();
  const { nextStep, prevStep } = useExperienceContext();
  const { t } = useLocale();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [questionCount, setQuestionCount] = useState(0);

  const allAnswered =
    questionCount > 0 && Object.keys(answers).length >= questionCount;

  async function handleFinish() {
    if (!allAnswered) return false;
    completeStep("questionnaire");
    refresh();
    nextStep();
    return true;
  }

  return (
    <SceneShell
      step="questionnaire"
      title={t("questionnaire.title")}
      subtitle={t("questionnaire.subtitle")}
      footer={
        <ExperienceNav
          onBack={prevStep}
          continueLabel={t("questionnaire.finish")}
          onContinue={handleFinish}
          continueDisabled={!allAnswered}
        />
      }
    >
      <QuestionnaireVoting
        onVotesChange={setAnswers}
        onQuestionCountChange={setQuestionCount}
      />
    </SceneShell>
  );
}
