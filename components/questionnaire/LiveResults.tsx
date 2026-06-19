"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import type { QuestionResult } from "@/services/vote.service";

interface LiveResultsProps {
  results: QuestionResult[];
}

export function LiveResults({ results }: LiveResultsProps) {
  const { t, locale } = useLocale();

  return (
    <section className="flow-card flow-stack live-results" aria-label={t("questionnaireUi.liveResults")}>
      <h2 className="flow-stats-title">{t("questionnaireUi.liveResults")}</h2>
      {results.map((question) => (
        <div key={question.question_id} className="live-results-question">
          <h3 className="flow-question-title">
            {locale === "ar" ? question.question_text_ar : question.question_text}
          </h3>
          <p className="flow-meta">
            {question.total_votes} {t("questionnaireUi.votes")}
          </p>
          <ul className="live-results-bars">
            {question.options.map((option) => (
              <li key={option.answer} className="live-results-row">
                <div className="live-results-label">
                  <span>
                    {locale === "ar" ? option.label_ar : option.label_en}
                  </span>
                  <span>
                    {option.percentage}% ({option.count})
                  </span>
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
