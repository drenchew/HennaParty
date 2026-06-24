import { isSchemaNotInitialized } from "@/lib/api/supabase-errors";
import {
  OPEN_ANSWER_MAX_LENGTH,
  QUESTIONNAIRE as DEFAULT_QUESTIONNAIRE,
} from "@/lib/questionnaire/constants";
import type {
  QuestionnaireQuestion,
  UpdateQuestionnaireQuestionInput,
} from "@/lib/questionnaire/types";
import { createAdminClient } from "@/lib/supabase/admin";

interface QuestionRow {
  id: number;
  sort_order: number;
  question_en: string;
  question_ar: string;
}

function mapRow(row: QuestionRow): QuestionnaireQuestion {
  return {
    id: row.id,
    sort_order: row.sort_order,
    question_en: row.question_en,
    question_ar: row.question_ar,
  };
}

const DEFAULT_ARABIC: Record<number, string> = {
  1: "ماذا يجب أن نفعل في سنتنا الأولى؟",
  2: "ما الأهم في الزواج؟",
  3: "أين يجب أن نسافر أولاً؟",
};

function defaultQuestionsFromConstants(): QuestionnaireQuestion[] {
  return DEFAULT_QUESTIONNAIRE.map((question, index) => ({
    id: question.id,
    sort_order: index + 1,
    question_en: question.question_text,
    question_ar: DEFAULT_ARABIC[question.id] ?? question.question_text,
  }));
}

export async function listQuestionnaireQuestions(): Promise<QuestionnaireQuestion[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("questionnaire_questions")
    .select("id, sort_order, question_en, question_ar")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    if (isSchemaNotInitialized(error)) {
      return defaultQuestionsFromConstants();
    }
    throw error;
  }

  if (!data?.length) {
    return defaultQuestionsFromConstants();
  }

  return data.map((row) => mapRow(row as QuestionRow));
}

export async function getQuestionnaireQuestionCount(): Promise<number> {
  const questions = await listQuestionnaireQuestions();
  return questions.length;
}

export async function getQuestionById(
  id: number,
): Promise<QuestionnaireQuestion | undefined> {
  const questions = await listQuestionnaireQuestions();
  return questions.find((question) => question.id === id);
}

export async function isValidAnswer(
  questionId: number,
  answer: string,
): Promise<boolean> {
  const question = await getQuestionById(questionId);
  if (!question) return false;

  const trimmed = answer.trim();
  return trimmed.length > 0 && trimmed.length <= OPEN_ANSWER_MAX_LENGTH;
}

export function formatQuestionsForClient(questions: QuestionnaireQuestion[]) {
  return questions.map((question) => ({
    id: question.id,
    question_text: question.question_en,
    question_text_ar: question.question_ar,
  }));
}

function validateQuestionInput(
  input: UpdateQuestionnaireQuestionInput,
): UpdateQuestionnaireQuestionInput {
  const question_en = input.question_en.trim();
  const question_ar = input.question_ar.trim();

  if (!question_en || !question_ar) {
    throw new Error("INVALID_PAYLOAD:English and Arabic question text are required");
  }

  if (question_en.length > 500 || question_ar.length > 500) {
    throw new Error("INVALID_PAYLOAD:Question text is too long (max 500 characters)");
  }

  return { question_en, question_ar };
}

export async function updateQuestionnaireQuestionForAdmin(
  id: number,
  rawInput: UpdateQuestionnaireQuestionInput,
): Promise<QuestionnaireQuestion> {
  const input = validateQuestionInput(rawInput);
  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("questionnaire_questions")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    if (isSchemaNotInitialized(fetchError)) {
      throw new Error(
        "SCHEMA_NOT_INITIALIZED:Run npm run db:setup to enable questionnaire editing",
      );
    }
    throw fetchError;
  }
  if (!existing) throw new Error("NOT_FOUND:Question not found");

  const { data, error } = await supabase
    .from("questionnaire_questions")
    .update({
      question_en: input.question_en,
      question_ar: input.question_ar,
      options: [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, sort_order, question_en, question_ar")
    .single();

  if (error) throw error;
  return mapRow(data as QuestionRow);
}

export { OPEN_ANSWER_MAX_LENGTH };
