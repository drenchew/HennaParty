"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { QUESTIONNAIRE_QUESTION_COUNT } from "@/lib/questionnaire/constants";
import {
  localizeOptionText,
  localizeQuestionText,
} from "@/lib/i18n/questionnaire-locale";
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
  showLiveResults?: boolean;
}

export function QuestionnaireVoting({
  onVotesChange,
  showLiveResults: showLiveResultsDefault = false,
}: QuestionnaireVotingProps) {
  const { t, locale } = useLocale();
  const [questions, setQuestions] = useState<VoteQuestion[]>([]);
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
      setAnswers(response.data.votes);
      onVotesChange?.(response.data.votes);
      if (response.data.results) {
        setResults(response.data.results);
      }
      return true;
    },
    [onVotesChange],
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
  const allAnswered = answeredCount >= QUESTIONNAIRE_QUESTION_COUNT;

  if (loading) {
    return <p className="flow-loading">{t("questionnaireUi.loading")}</p>;
  }

  return (
    <div className="flow-stack">
      <div className="flow-card flow-stack questionnaire-toolbar">
        <p className="flow-meta">
          {answeredCount} / {QUESTIONNAIRE_QUESTION_COUNT} {t("questionnaireUi.answered")}
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
            {localizeQuestionText(question.id, locale, question.question_text)}
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
                  {localizeOptionText(question.id, canonical, locale)}
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
