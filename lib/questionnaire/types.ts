export interface QuestionnaireQuestion {
  id: number;
  sort_order: number;
  question_en: string;
  question_ar: string;
}

export interface UpdateQuestionnaireQuestionInput {
  question_en: string;
  question_ar: string;
}
