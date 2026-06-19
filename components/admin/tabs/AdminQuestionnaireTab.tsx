"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import type { QuestionnaireQuestion } from "@/lib/questionnaire/types";
import type { QuestionResult } from "@/lib/vote/server";
import { isApiError } from "@/lib/utils/api";

interface EditableOption {
  answer: string;
  label_en: string;
  label_ar: string;
  previous_answer: string;
}

interface EditableQuestion {
  id: number;
  question_en: string;
  question_ar: string;
  options: EditableOption[];
}

function toEditable(question: QuestionnaireQuestion): EditableQuestion {
  return {
    id: question.id,
    question_en: question.question_en,
    question_ar: question.question_ar,
    options: question.options.map((option) => ({
      answer: option.answer,
      label_en: option.en,
      label_ar: option.ar,
      previous_answer: option.answer,
    })),
  };
}

export function AdminQuestionnaireTab() {
  const { adminFetch } = useAdmin();
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [questionsResult, resultsResult] = await Promise.all([
      adminFetch<{ questions: QuestionnaireQuestion[] }>(
        "/api/admin/questionnaire/questions",
      ),
      adminFetch<{ results: QuestionResult[] }>("/api/admin/questionnaire"),
    ]);

    if (isApiError(questionsResult)) {
      setError(questionsResult.error);
      setLoading(false);
      return;
    }

    if (isApiError(resultsResult)) {
      setError(resultsResult.error);
      setLoading(false);
      return;
    }

    setQuestions(questionsResult.data.questions.map(toEditable));
    setResults(resultsResult.data.results);
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateQuestion(
    id: number,
    patch: Partial<Pick<EditableQuestion, "question_en" | "question_ar">>,
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id ? { ...question, ...patch } : question,
      ),
    );
  }

  function updateOption(
    questionId: number,
    index: number,
    patch: Partial<EditableOption>,
  ) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;
        const options = question.options.map((option, optionIndex) =>
          optionIndex === index ? { ...option, ...patch } : option,
        );
        return { ...question, options };
      }),
    );
  }

  async function handleSave(question: EditableQuestion) {
    setSavingId(question.id);
    setError(null);
    setSuccess(null);

    const result = await adminFetch<{ question: QuestionnaireQuestion }>(
      `/api/admin/questionnaire/questions/${question.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          question_en: question.question_en,
          question_ar: question.question_ar,
          options: question.options.map((option) => ({
            answer: option.answer,
            label_en: option.label_en,
            label_ar: option.label_ar,
            previous_answer: option.previous_answer,
          })),
        }),
      },
    );

    if (isApiError(result)) {
      setError(result.error);
      setSavingId(null);
      return;
    }

    setSuccess(`Question ${question.id} saved.`);
    setSavingId(null);
    await load();
  }

  return (
    <div className="admin-tab">
      <header className="admin-tab__header">
        <h2 className="admin-tab__title">Questionnaire</h2>
        <button type="button" className="flow-btn flow-btn--secondary" onClick={() => void load()}>
          Refresh
        </button>
      </header>

      {loading && <p className="flow-loading">Loading questionnaire…</p>}
      {error && <p className="flow-error">{error}</p>}
      {success && <p className="flow-success">{success}</p>}

      {!loading && (
        <>
          <section className="admin-question-edit-list">
            <h3 className="admin-subtitle">Edit questions</h3>
            <p className="flow-meta admin-question-edit-note">
              Changes apply immediately for guests. Keep each answer key unique — if you
              rename a key, existing votes are updated automatically.
            </p>

            {questions.map((question) => (
              <form
                key={question.id}
                className="flow-card admin-question-edit"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSave(question);
                }}
              >
                <h4 className="admin-subtitle">Question {question.id}</h4>

                <label className="admin-field">
                  <span className="admin-field__label">English</span>
                  <textarea
                    className="flow-textarea"
                    value={question.question_en}
                    onChange={(event) =>
                      updateQuestion(question.id, { question_en: event.target.value })
                    }
                    rows={2}
                  />
                </label>

                <label className="admin-field">
                  <span className="admin-field__label">Arabic</span>
                  <textarea
                    className="flow-textarea"
                    value={question.question_ar}
                    onChange={(event) =>
                      updateQuestion(question.id, { question_ar: event.target.value })
                    }
                    dir="rtl"
                    rows={2}
                  />
                </label>

                <div className="admin-option-edit-list">
                  {question.options.map((option, index) => (
                    <div key={`${question.id}-${index}`} className="admin-option-edit">
                      <p className="flow-meta">Option {index + 1}</p>
                      <label className="admin-field">
                        <span className="admin-field__label">Answer key (stored in votes)</span>
                        <input
                          className="flow-input"
                          value={option.answer}
                          onChange={(event) =>
                            updateOption(question.id, index, { answer: event.target.value })
                          }
                        />
                      </label>
                      <label className="admin-field">
                        <span className="admin-field__label">English label</span>
                        <input
                          className="flow-input"
                          value={option.label_en}
                          onChange={(event) =>
                            updateOption(question.id, index, { label_en: event.target.value })
                          }
                        />
                      </label>
                      <label className="admin-field">
                        <span className="admin-field__label">Arabic label</span>
                        <input
                          className="flow-input"
                          value={option.label_ar}
                          onChange={(event) =>
                            updateOption(question.id, index, { label_ar: event.target.value })
                          }
                          dir="rtl"
                        />
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="flow-btn flow-btn--primary"
                  disabled={savingId === question.id}
                >
                  {savingId === question.id ? "Saving…" : "Save question"}
                </button>
              </form>
            ))}
          </section>

          <section className="admin-question-list">
            <h3 className="admin-subtitle">Live results</h3>
            {results.map((question) => (
              <section key={question.question_id} className="flow-card admin-question-card">
                <h4 className="admin-subtitle">{question.question_text}</h4>
                <p className="flow-meta">{question.question_text_ar}</p>
                <p className="flow-meta">{question.total_votes} votes</p>
                <ul className="admin-vote-bars">
                  {question.options.map((option) => (
                    <li key={option.answer} className="admin-vote-row">
                      <div className="admin-vote-row__label">
                        <span>
                          {option.label_en} / {option.label_ar}
                        </span>
                        <span>
                          {option.count} ({option.percentage}%)
                        </span>
                      </div>
                      <div className="admin-vote-bar">
                        <div
                          className="admin-vote-bar__fill"
                          style={{ width: `${option.percentage}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
