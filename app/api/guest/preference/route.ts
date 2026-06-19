import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import { handleDatabaseError } from "@/lib/api/supabase-errors";
import {
  jsonError,
  jsonOk,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import { setGuestHijabiPreference } from "@/lib/guest/server";

/** POST /api/guest/preference — set hijabi photo/video section (once, before uploads). */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const body = (await request.json()) as { hijabi?: unknown };
    if (typeof body.hijabi !== "boolean") {
      return jsonError("hijabi must be a boolean", 400, "INVALID_PAYLOAD");
    }

    const guest = await setGuestHijabiPreference(guestToken, body.hijabi);
    return jsonOk({ guest });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "GUEST_NOT_FOUND") return unauthorized();

      const [code, message] = error.message.split(":");
      if (code === "HIJAB_PREFERENCE_LOCKED" && message) {
        return jsonError(message, 409, code);
      }
    }

    return handleDatabaseError(error, "POST /api/guest/preference");
  }
}
