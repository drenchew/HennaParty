import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import {
  jsonError,
  jsonOk,
  notFound,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import { getUnlockedVideoStreamUrl } from "@/lib/video/server";

/**
 * GET /api/video/stream
 * Server-enforced playback gate — returns 403 until unlock_date.
 * Only way to obtain a signed URL (private bucket; no public paths).
 */
export async function GET(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const stream = await getUnlockedVideoStreamUrl(guestToken);
    return jsonOk(stream);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "GUEST_NOT_FOUND") return unauthorized();
      if (error.message === "VIDEO_NOT_FOUND") {
        return notFound("No video found for this guest");
      }
      if (error.message === "VIDEO_LOCKED") {
        return jsonError(
          "This time capsule is still locked",
          403,
          "VIDEO_LOCKED",
        );
      }
    }

    console.error("[GET /api/video/stream]", error);
    return serverError();
  }
}
