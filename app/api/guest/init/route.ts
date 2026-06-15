import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import { jsonOk, serverError, unauthorized } from "@/lib/api/response";
import { upsertGuest } from "@/lib/guest/server";

/** POST /api/guest/init — create guest row if missing. */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const result = await upsertGuest(guestToken);
    return jsonOk(result, result.created ? 201 : 200);
  } catch (error) {
    console.error("[POST /api/guest/init]", error);
    return serverError();
  }
}
