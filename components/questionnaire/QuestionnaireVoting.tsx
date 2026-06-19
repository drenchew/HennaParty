"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { isApiError } from "@/lib/utils/api";
import {
  getVoteState,
  submitVote,
  type QuestionResult,
  type VoteQuestion,
} from "@/services/vote.service";
import { LiveResults } from "./LiveResults";

interface QuestionnaireVotingProps {
  onVotesChange?: (votes: Record<number, string>) => void;
  onQuestionCountChange?: (count: number) => void;
  showLiveResults?: boolean;
}

function questionLabel(question: VoteQuestion, locale: "en" | "ar"): string {
  return locale === "ar" ? question.question_text_ar : question.question_text;
}

function optionLabel(
  option: VoteQuestion["options"][number],
  locale: "en" | "ar",
): string {
  return locale === "ar" ? option.label_ar : option.label_en;
}

export function QuestionnaireVoting({
  onVotesChange,
  onQuestionCountChange,
  showLiveResults: showLiveResultsDefault = false,
}: QuestionnaireVotingProps) {
  const { t, locale } = useLocale();
  const [questions, setQuestions] = useState<VoteQuestion[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<number | null>(null);
  const [showLiveResults, setShowLiveResults] = useState(showLiveResultsDefault);
  const [error, setError] = useState<string | null>(null);

  const loadState = useCallback(
    async (withResults: boolean) => {
      const response = await getVoteState(withResults);
      if (isApiError(response)) {
        setError(response.error);
        return false;
      }

      setQuestions(response.data.questions);
      setQuestionCount(response.data.question_count);
      onQuestionCountChange?.(response.data.question_count);
      setAnswers(response.data.votes);
      onVotesChange?.(response.data.votes);
      if (response.data.results) {
        setResults(response.data.results);
      }
      return true;
    },
    [onQuestionCountChange, onVotesChange],
  );

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await loadState(showLiveResults);
      setLoading(false);
    })();
  }, [loadState, showLiveResults]);

  async function handleSelect(questionId: number, answer: string) {
    if (votingId !== null) return;

    setVotingId(questionId);
    setError(null);

    const response = await submitVote(questionId, answer);
    if (isApiError(response)) {
      setError(response.error);
      setVotingId(null);
      return;
    }

    const next = { ...answers, [questionId]: answer };
    setAnswers(next);
    onVotesChange?.(next);

    if (showLiveResults) {
      await loadState(true);
    }

    setVotingId(null);
  }

  async function toggleLiveResults() {
    const next = !showLiveResults;
    setShowLiveResults(next);
    if (next) {
      await loadState(true);
    }
  }

  const answeredCount = Object.keys(answers).length;
  const allAnswered = questionCount > 0 && answeredCount >= questionCount;

  if (loading) {
    return <p className="flow-loading">{t("questionnaireUi.loading")}</p>;
  }

  return (
    <div className="flow-stack">
      <div className="flow-card flow-stack questionnaire-toolbar">
        <p className="flow-meta">
          {answeredCount} / {questionCount} {t("questionnaireUi.answered")}
          {allAnswered && t("questionnaireUi.complete")}
        </p>
        <button
          type="button"
          className="flow-btn flow-btn--secondary"
          onClick={() => void toggleLiveResults()}
        >
          {showLiveResults ? t("questionnaireUi.hideResults") : t("questionnaireUi.showResults")}
        </button>
      </div>

      {questions.map((question) => (
        <fieldset key={question.id} className="flow-card flow-question">
          <legend className="flow-question-title">
            {questionLabel(question, locale)}
          </legend>
          <div className="flow-options">
            {question.options.map((option) => {
              const canonical = option.option_text;
              const selected = answers[question.id] === canonical;
              const busy = votingId === question.id;
              return (
                <button
                  key={canonical}
                  type="button"
                  disabled={busy}
                  className={`flow-option${selected ? " flow-option--selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => void handleSelect(question.id, canonical)}
                >
                  {optionLabel(option, locale)}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      {showLiveResults && results.length > 0 && <LiveResults results={results} />}

      {error && <p className="flow-error">{error}</p>}
    </div>
  );
}
