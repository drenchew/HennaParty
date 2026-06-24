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
            {question.total_votes} {t("questionnaireUi.responses")}
          </p>
          {question.answers.length > 0 ? (
            <ul className="live-results-answers">
              {question.answers.map((item) => (
                <li key={item.answer} className="live-results-answer">
                  <p className="live-results-answer__text">{item.answer}</p>
                  <p className="flow-meta">
                    {item.count} {t("questionnaireUi.responses")}
                    {question.total_votes > 1 ? ` (${item.percentage}%)` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flow-meta">{t("questionnaireUi.noResponsesYet")}</p>
          )}
        </div>
      ))}
    </section>
  );
}
