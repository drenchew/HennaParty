import { listQuestionnaireQuestions } from "@/lib/admin/server";
import { withAdminAuth } from "@/lib/api/admin-route";
import { jsonOk } from "@/lib/api/response";

export const GET = withAdminAuth(async () => {
  const questions = await listQuestionnaireQuestions();
  return jsonOk({ questions, count: questions.length });
});
