"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import type { QuestionResult } from "@/lib/vote/server";
import { isApiError } from "@/lib/utils/api";

export function AdminQuestionnaireTab() {
  const { adminFetch } = useAdmin();
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await adminFetch<{ results: QuestionResult[] }>(
      "/api/admin/questionnaire",
    );
    if (isApiError(result)) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setResults(result.data.results);
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="admin-tab">
      <header className="admin-tab__header">
        <h2 className="admin-tab__title">Questionnaire results</h2>
        <button type="button" className="flow-btn flow-btn--secondary" onClick={() => void load()}>
          Refresh
        </button>
      </header>

      {loading && <p className="flow-loading">Loading results…</p>}
      {error && <p className="flow-error">{error}</p>}

      <div className="admin-question-list">
        {results.map((question) => (
          <section key={question.question_id} className="flow-card admin-question-card">
            <h3 className="admin-subtitle">{question.question_text}</h3>
            <p className="flow-meta">{question.total_votes} votes</p>
            <ul className="admin-vote-bars">
              {question.options.map((option) => (
                <li key={option.answer} className="admin-vote-row">
                  <div className="admin-vote-row__label">
                    <span>{option.answer}</span>
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
      </div>
    </div>
  );
}
