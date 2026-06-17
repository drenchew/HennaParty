import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import { jsonOk, serverError, unauthorized } from "@/lib/api/response";
import { getVideoStatusForGuest } from "@/lib/video/server";

/** GET /api/video/status — metadata only; never exposes video_url or signed URLs. */
export async function GET(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const status = await getVideoStatusForGuest(guestToken);
    return jsonOk(status);
  } catch (error) {
    if (error instanceof Error && error.message === "GUEST_NOT_FOUND") {
      return unauthorized();
    }
    console.error("[GET /api/video/status]", error);
    return serverError();
  }
}
