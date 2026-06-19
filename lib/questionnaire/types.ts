export interface QuestionnaireOption {
  answer: string;
  en: string;
  ar: string;
}

export interface QuestionnaireQuestion {
  id: number;
  sort_order: number;
  question_en: string;
  question_ar: string;
  options: QuestionnaireOption[];
}

export interface QuestionnaireOptionInput {
  answer: string;
  label_en: string;
  label_ar: string;
  /** Previous answer key — set when renaming a vote option. */
  previous_answer?: string;
}

export interface UpdateQuestionnaireQuestionInput {
  question_en: string;
  question_ar: string;
  options: QuestionnaireOptionInput[];
}
