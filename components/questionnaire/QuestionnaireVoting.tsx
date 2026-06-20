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
  const [currentIndex, setCurrentIndex] = useState(0);
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


  useEffect(() => {
    if (questions.length === 0) return;
    setCurrentIndex((prev) => Math.min(prev, questions.length - 1));
  }, [questions.length]);

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

    const questionIndex = questions.findIndex((question) => question.id === questionId);
    const nextUnanswered = questions.findIndex(
      (question, index) => index > questionIndex && !next[question.id],
    );
    if (nextUnanswered >= 0) {
      setCurrentIndex(nextUnanswered);
    }

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
  const currentQuestion = questions[currentIndex];

  if (loading) {
    return <p className="flow-loading">{t("questionnaireUi.loading")}</p>;
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="questionnaire-mobile">
      <div className="questionnaire-toolbar questionnaire-toolbar--compact">
        <p className="questionnaire-toolbar__progress">
          {answeredCount}/{questionCount} {t("questionnaireUi.answered")}
          {allAnswered && t("questionnaireUi.complete")}
        </p>
        <button
          type="button"
          className="flow-btn flow-btn--secondary flow-btn--compact"
          onClick={() => void toggleLiveResults()}
        >
          {showLiveResults ? t("questionnaireUi.hideResults") : t("questionnaireUi.showResults")}
        </button>
      </div>

      <div className="questionnaire-dots" role="tablist" aria-label={t("common.progress")}>
        {questions.map((question, index) => (
          <button
            key={question.id}
            type="button"
            role="tab"
            aria-selected={index === currentIndex}
            aria-label={t("questionnaireUi.questionOf", {
              current: index + 1,
              total: questions.length,
            })}
            className={`questionnaire-dots__dot${index === currentIndex ? " questionnaire-dots__dot--active" : ""}${answers[question.id] ? " questionnaire-dots__dot--done" : ""}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>

      <fieldset className="flow-card flow-question questionnaire-card">
        <legend className="flow-question-title questionnaire-card__title">
          {questionLabel(currentQuestion, locale)}
        </legend>
        <p className="questionnaire-card__meta">
          {t("questionnaireUi.questionOf", {
            current: currentIndex + 1,
            total: questions.length,
          })}
        </p>
        <div className="flow-options questionnaire-options">
          {currentQuestion.options.map((option) => {
            const canonical = option.option_text;
            const selected = answers[currentQuestion.id] === canonical;
            const busy = votingId === currentQuestion.id;
            return (
              <button
                key={canonical}
                type="button"
                disabled={busy}
                className={`flow-option questionnaire-option${selected ? " flow-option--selected" : ""}`}
                aria-pressed={selected}
                onClick={() => void handleSelect(currentQuestion.id, canonical)}
              >
                {optionLabel(option, locale)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="questionnaire-step-nav">
        <button
          type="button"
          className="flow-btn flow-btn--secondary flow-btn--compact"
          disabled={currentIndex <= 0}
          onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
        >
          {t("questionnaireUi.prevQuestion")}
        </button>
        <button
          type="button"
          className="flow-btn flow-btn--secondary flow-btn--compact"
          disabled={currentIndex >= questions.length - 1}
          onClick={() =>
            setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))
          }
        >
          {t("questionnaireUi.nextQuestion")}
        </button>
      </div>

      {showLiveResults && results.length > 0 && <LiveResults results={results} />}

      {error && <p className="flow-error">{error}</p>}
    </div>
  );
}
