import { formatQuestionsForClient, listQuestionnaireQuestions } from "@/lib/questionnaire/server";
import { jsonOk } from "@/lib/api/response";

/** GET /api/questionnaire — returns open questions from database. */
export async function GET() {
  const questions = await listQuestionnaireQuestions();
  return jsonOk({
    questions: formatQuestionsForClient(questions),
    question_count: questions.length,
  });
}
