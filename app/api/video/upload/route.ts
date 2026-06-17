import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import {
  jsonError,
  jsonOk,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import { uploadVideoForGuest } from "@/lib/video/server";

/**
 * POST /api/video/upload
 * multipart/form-data:
 *   - video: File
 *   - duration_seconds: number (client-measured; server validates <= 60)
 *
 * Response never includes storage path or signed URL.
 */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const formData = await request.formData();
    const file = formData.get("video");
    const durationRaw = formData.get("duration_seconds");

    if (!(file instanceof File)) {
      return jsonError("Missing video file", 400, "INVALID_PAYLOAD");
    }

    const durationSeconds = Number(durationRaw);
    const video = await uploadVideoForGuest(guestToken, file, durationSeconds);

    return jsonOk({ video }, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "GUEST_NOT_FOUND") return unauthorized();

      const [code, message] = error.message.split(":");
      if (
        code &&
        message &&
        [
          "EMPTY_FILE",
          "FILE_TOO_LARGE",
          "INVALID_MIME",
          "INVALID_DURATION",
          "VIDEO_TOO_LONG",
        ].includes(code)
      ) {
        return jsonError(message, 400, code);
      }
    }

    console.error("[POST /api/video/upload]", error);
    return serverError();
  }
}
