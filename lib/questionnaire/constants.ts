/** Static questionnaire — question IDs are stored in votes.question_id */
export const QUESTIONNAIRE = [
  {
    id: 1,
    question_text: "What should we do in our first year?",
    options: [
      "Travel the world",
      "Focus on faith & family",
      "Build our home together",
      "Celebrate every moment",
    ],
  },
  {
    id: 2,
    question_text: "What is most important in marriage?",
    options: ["Trust", "Communication", "Patience", "Laughter"],
  },
  {
    id: 3,
    question_text: "Where should we travel first?",
    options: ["Makkah / Umrah", "Tropical beach", "European cities", "Somewhere new together"],
  },
] as const;

export type QuestionnaireItem = (typeof QUESTIONNAIRE)[number];

export const QUESTIONNAIRE_QUESTION_COUNT = QUESTIONNAIRE.length;

export function getQuestionById(id: number): QuestionnaireItem | undefined {
  return QUESTIONNAIRE.find((q) => q.id === id);
}

export function isValidAnswer(questionId: number, answer: string): boolean {
  const question = getQuestionById(questionId);
  if (!question) return false;
  return (question.options as readonly string[]).includes(answer);
}
