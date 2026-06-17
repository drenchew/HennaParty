import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import { jsonOk, serverError, unauthorized } from "@/lib/api/response";
import { getMessageForGuest } from "@/lib/message/server";

/** GET /api/message — fetch guest's submitted message (read-only). */
export async function GET(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const message = await getMessageForGuest(guestToken);
    return jsonOk({ message, submitted: Boolean(message) });
  } catch (error) {
    if (error instanceof Error && error.message === "GUEST_NOT_FOUND") {
      return unauthorized();
    }
    console.error("[GET /api/message]", error);
    return serverError();
  }
}
