import { isValidAnswer } from "@/lib/questionnaire/server";

export async function validateVotePayload(
  questionId: unknown,
  answer: unknown,
): Promise<
  | { ok: true; question_id: number; answer: string }
  | { ok: false; code: string; error: string }
> {
  const id = Number(questionId);
  const text = typeof answer === "string" ? answer.trim() : "";

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, code: "INVALID_PAYLOAD", error: "question_id is required" };
  }

  if (!text) {
    return { ok: false, code: "INVALID_PAYLOAD", error: "answer is required" };
  }

  if (!(await isValidAnswer(id, text))) {
    return { ok: false, code: "INVALID_VOTE", error: "Invalid question or answer option" };
  }

  return { ok: true, question_id: id, answer: text };
}
