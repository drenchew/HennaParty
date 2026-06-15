import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import { jsonOk, serverError, unauthorized } from "@/lib/api/response";
import { findGuestByToken, getGuestProgress } from "@/lib/guest/server";

/** GET /api/guest/me — guest record + derived progress. */
export async function GET(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const guest = await findGuestByToken(guestToken);
    if (!guest) return unauthorized();

    const progress = await getGuestProgress(guest.id);
    return jsonOk({ guest, progress });
  } catch (error) {
    console.error("[GET /api/guest/me]", error);
    return serverError();
  }
}
