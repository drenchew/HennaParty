import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import {
  jsonError,
  jsonOk,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import { findGuestByToken } from "@/lib/guest/server";
import { isValidAnswer } from "@/lib/questionnaire/constants";
import { createAdminClient } from "@/lib/supabase/admin";

/** POST /api/questionnaire/vote — record one answer per question per guest. */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const guest = await findGuestByToken(guestToken);
    if (!guest) return unauthorized();

    const body = (await request.json()) as {
      question_id?: number;
      answer?: string;
    };

    const questionId = body.question_id;
    const answer = body.answer?.trim();

    if (!questionId || !answer) {
      return jsonError("question_id and answer are required", 400, "INVALID_PAYLOAD");
    }

    if (!isValidAnswer(questionId, answer)) {
      return jsonError("Invalid question or answer", 400, "INVALID_VOTE");
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("votes")
      .upsert(
        { guest_id: guest.id, question_id: questionId, answer },
        { onConflict: "guest_id,question_id" },
      )
      .select("id, guest_id, question_id, answer")
      .single();

    if (error) throw error;

    return jsonOk({ vote: data });
  } catch (error) {
    console.error("[POST /api/questionnaire/vote]", error);
    return serverError();
  }
}
