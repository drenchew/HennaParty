import { QUESTIONNAIRE } from "@/lib/constants/steps";
import { jsonOk } from "@/lib/api/response";

/** GET /api/questionnaire — returns static MCQ definitions. */
export async function GET() {
  const questions = QUESTIONNAIRE.map((q) => ({
    id: q.id,
    question_text: q.question_text,
    options: q.options.map((option_text, index) => ({
      id: index + 1,
      question_id: q.id,
      option_text,
    })),
  }));

  return jsonOk({ questions });
}
