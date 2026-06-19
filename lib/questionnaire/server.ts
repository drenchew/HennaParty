import { QUESTIONNAIRE as DEFAULT_QUESTIONNAIRE } from "@/lib/questionnaire/constants";
import type {
  QuestionnaireOption,
  QuestionnaireQuestion,
  UpdateQuestionnaireQuestionInput,
} from "@/lib/questionnaire/types";
import { createAdminClient } from "@/lib/supabase/admin";

interface QuestionRow {
  id: number;
  sort_order: number;
  question_en: string;
  question_ar: string;
  options: unknown;
}

function parseOptions(raw: unknown): QuestionnaireOption[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const answer = typeof row.answer === "string" ? row.answer.trim() : "";
      const en = typeof row.en === "string" ? row.en.trim() : "";
      const ar = typeof row.ar === "string" ? row.ar.trim() : "";
      if (!answer || !en || !ar) return null;
      return { answer, en, ar } satisfies QuestionnaireOption;
    })
    .filter((item): item is QuestionnaireOption => item !== null);
}

function mapRow(row: QuestionRow): QuestionnaireQuestion {
  return {
    id: row.id,
    sort_order: row.sort_order,
    question_en: row.question_en,
    question_ar: row.question_ar,
    options: parseOptions(row.options),
  };
}

function defaultQuestionsFromConstants(): QuestionnaireQuestion[] {
  return DEFAULT_QUESTIONNAIRE.map((question, index) => {
    const display = {
      1: {
        ar: "ماذا يجب أن نفعل في سنتنا الأولى؟",
        options: {
          "Travel the world": "نسافر حول العالم",
          "Focus on faith & family": "نركز على الإيمان والعائلة",
          "Build our home together": "نبني بيتنا معاً",
          "Celebrate every moment": "نحتفل بكل لحظة",
        },
      },
      2: {
        ar: "ما الأهم في الزواج؟",
        options: {
          Trust: "الثقة",
          Communication: "التواصل",
          Patience: "الصبر",
          Laughter: "الضحك",
        },
      },
      3: {
        ar: "أين يجب أن نسافر أولاً؟",
        options: {
          "Makkah / Umrah": "مكة / العمرة",
          "Tropical beach": "شاطئ استوائي",
          "European cities": "مدن أوروبية",
          "Somewhere new together": "مكاناً جديداً معاً",
        },
      },
    } as const;

    const labels = display[question.id as 1 | 2 | 3];

    return {
      id: question.id,
      sort_order: index + 1,
      question_en: question.question_text,
      question_ar: labels?.ar ?? question.question_text,
      options: question.options.map((answer) => ({
        answer,
        en: answer,
        ar:
          (labels?.options as Record<string, string> | undefined)?.[answer] ??
          answer,
      })),
    };
  });
}

export async function listQuestionnaireQuestions(): Promise<QuestionnaireQuestion[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("questionnaire_questions")
    .select("id, sort_order, question_en, question_ar, options")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    if (error.code === "42P01") {
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
  return question.options.some((option) => option.answer === answer);
}

export function formatQuestionsForClient(questions: QuestionnaireQuestion[]) {
  return questions.map((question) => ({
    id: question.id,
    question_text: question.question_en,
    question_text_ar: question.question_ar,
    options: question.options.map((option, index) => ({
      id: index + 1,
      question_id: question.id,
      option_text: option.answer,
      label_en: option.en,
      label_ar: option.ar,
    })),
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

  if (!Array.isArray(input.options) || input.options.length < 2) {
    throw new Error("INVALID_PAYLOAD:At least 2 answer options are required");
  }

  if (input.options.length > 8) {
    throw new Error("INVALID_PAYLOAD:Maximum 8 answer options allowed");
  }

  const options = input.options.map((option) => {
    const answer = option.answer.trim();
    const en = option.label_en.trim();
    const ar = option.label_ar.trim();
    const previous_answer = option.previous_answer?.trim() || undefined;

    if (!answer || !en || !ar) {
      throw new Error("INVALID_PAYLOAD:Each option needs answer key and both labels");
    }

    if (answer.length > 200 || en.length > 200 || ar.length > 200) {
      throw new Error("INVALID_PAYLOAD:Option text is too long (max 200 characters)");
    }

    return { answer, label_en: en, label_ar: ar, previous_answer };
  });

  const answerKeys = new Set(options.map((option) => option.answer));
  if (answerKeys.size !== options.length) {
    throw new Error("INVALID_PAYLOAD:Duplicate answer keys are not allowed");
  }

  return { question_en, question_ar, options };
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

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("NOT_FOUND:Question not found");

  for (const option of input.options) {
    if (!option.previous_answer || option.previous_answer === option.answer) {
      continue;
    }

    const { error: voteError } = await supabase
      .from("votes")
      .update({ answer: option.answer })
      .eq("question_id", id)
      .eq("answer", option.previous_answer);

    if (voteError) throw voteError;
  }

  const optionsJson = input.options.map((option) => ({
    answer: option.answer,
    en: option.label_en,
    ar: option.label_ar,
  }));

  const { data, error } = await supabase
    .from("questionnaire_questions")
    .update({
      question_en: input.question_en,
      question_ar: input.question_ar,
      options: optionsJson,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, sort_order, question_en, question_ar, options")
    .single();

  if (error) throw error;
  return mapRow(data as QuestionRow);
}
