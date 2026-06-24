"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { OPEN_ANSWER_MAX_LENGTH } from "@/lib/questionnaire/constants";
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
  const [draft, setDraft] = useState("");
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (!currentQuestion) return;
    setDraft(answers[currentQuestion.id] ?? "");
  }, [currentQuestion, answers]);

  async function handleSave() {
    if (!currentQuestion || saving) return;

    const trimmed = draft.trim();
    if (!trimmed) {
      setError(t("questionnaireUi.emptyAnswer"));
      return;
    }

    if (trimmed.length > OPEN_ANSWER_MAX_LENGTH) {
      setError(t("questionnaireUi.answerTooLong", { max: OPEN_ANSWER_MAX_LENGTH }));
      return;
    }

    setSaving(true);
    setError(null);

    const response = await submitVote(currentQuestion.id, trimmed);
    if (isApiError(response)) {
      setError(response.error);
      setSaving(false);
      return;
    }

    const next = { ...answers, [currentQuestion.id]: trimmed };
    setAnswers(next);
    onVotesChange?.(next);

    if (showLiveResults) {
      await loadState(true);
    }

    setSaving(false);
  }

  async function toggleLiveResults() {
    const next = !showLiveResults;
    setShowLiveResults(next);
    if (next) {
      await loadState(true);
    }
  }

  const answeredCount = Object.values(answers).filter((answer) => answer.trim()).length;
  const allAnswered = questionCount > 0 && answeredCount >= questionCount;
  const savedAnswer = currentQuestion ? answers[currentQuestion.id]?.trim() : "";

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
            className={`questionnaire-dots__dot${index === currentIndex ? " questionnaire-dots__dot--active" : ""}${answers[question.id]?.trim() ? " questionnaire-dots__dot--done" : ""}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>

      <div className="flow-card flow-question questionnaire-card">
        <h3 className="flow-question-title questionnaire-card__title">
          {questionLabel(currentQuestion, locale)}
        </h3>
        <p className="questionnaire-card__meta">
          {t("questionnaireUi.questionOf", {
            current: currentIndex + 1,
            total: questions.length,
          })}
        </p>

        <label className="questionnaire-open-answer">
          <span className="sr-only">{t("questionnaireUi.yourAnswer")}</span>
          <textarea
            className="flow-textarea questionnaire-open-answer__input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t("questionnaireUi.answerPlaceholder")}
            maxLength={OPEN_ANSWER_MAX_LENGTH}
            rows={4}
            disabled={saving}
          />
        </label>

        <p className="flow-meta questionnaire-open-answer__meta">
          {draft.trim().length}/{OPEN_ANSWER_MAX_LENGTH}
          {savedAnswer && draft.trim() === savedAnswer
            ? ` · ${t("questionnaireUi.saved")}`
            : ""}
        </p>

        <button
          type="button"
          className="flow-btn flow-btn--primary"
          disabled={saving || !draft.trim()}
          onClick={() => void handleSave()}
        >
          {saving ? t("questionnaireUi.saving") : t("questionnaireUi.saveAnswer")}
        </button>
      </div>

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
