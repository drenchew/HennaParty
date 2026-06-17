import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import {
  jsonError,
  jsonOk,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import { createMessageForGuest } from "@/lib/message/server";

/**
 * POST /api/message/create
 * Body: { message: string }
 * One message per guest — no edits after submission.
 */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const body = (await request.json()) as { message?: string };
    const record = await createMessageForGuest(guestToken, body.message ?? "");

    return jsonOk({ message: record }, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "GUEST_NOT_FOUND") return unauthorized();

      const [code, message] = error.message.split(":");
      if (code === "INVALID_MESSAGE") {
        return jsonError(message, 400, code);
      }
      if (code === "MESSAGE_EXISTS") {
        return jsonError(message, 409, code);
      }
    }

    console.error("[POST /api/message/create]", error);
    return serverError();
  }
}
