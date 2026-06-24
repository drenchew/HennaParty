/** Static questionnaire fallback when DB table is missing. */
export const QUESTIONNAIRE = [
  {
    id: 1,
    question_text: "What should we do in our first year?",
  },
  {
    id: 2,
    question_text: "What is most important in marriage?",
  },
  {
    id: 3,
    question_text: "Where should we travel first?",
  },
] as const;

export type QuestionnaireItem = (typeof QUESTIONNAIRE)[number];

export const QUESTIONNAIRE_QUESTION_COUNT = QUESTIONNAIRE.length;

/** Max length for a guest's free-text answer. */
export const OPEN_ANSWER_MAX_LENGTH = 500;

export function getQuestionById(id: number): QuestionnaireItem | undefined {
  return QUESTIONNAIRE.find((q) => q.id === id);
}
