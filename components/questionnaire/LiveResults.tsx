"use client";

import type { QuestionResult } from "@/services/vote.service";

interface LiveResultsProps {
  results: QuestionResult[];
}

export function LiveResults({ results }: LiveResultsProps) {
  return (
    <section className="flow-card flow-stack live-results" aria-label="Live results">
      <h2 className="flow-stats-title">Live results</h2>
      {results.map((question) => (
        <div key={question.question_id} className="live-results-question">
          <h3 className="flow-question-title">{question.question_text}</h3>
          <p className="flow-meta">{question.total_votes} votes</p>
          <ul className="live-results-bars">
            {question.options.map((option) => (
              <li key={option.answer} className="live-results-row">
                <div className="live-results-label">
                  <span>{option.answer}</span>
                  <span>{option.percentage}% ({option.count})</span>
                </div>
                <div className="live-results-track">
                  <div
                    className="live-results-fill"
                    style={{ width: `${option.percentage}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
