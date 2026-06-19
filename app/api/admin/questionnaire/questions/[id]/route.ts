import { NextRequest } from "next/server";
import { updateQuestionnaireQuestionForAdmin } from "@/lib/admin/server";
import { requireAdminSecret, adminUnauthorized } from "@/lib/api/admin";
import { handleAdminError } from "@/lib/api/admin-route";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { UpdateQuestionnaireQuestionInput } from "@/lib/questionnaire/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!requireAdminSecret(request)) {
    return adminUnauthorized();
  }

  try {
    const { id } = await context.params;
    const questionId = Number(id);

    if (!Number.isInteger(questionId) || questionId <= 0) {
      return jsonError("Invalid question id", 400, "INVALID_PAYLOAD");
    }

    const body = (await request.json()) as UpdateQuestionnaireQuestionInput;
    const question = await updateQuestionnaireQuestionForAdmin(questionId, body);
    return jsonOk({ question });
  } catch (error) {
    return handleAdminError(error);
  }
}
