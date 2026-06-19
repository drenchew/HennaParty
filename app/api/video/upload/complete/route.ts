import { NextRequest } from "next/server";
import { handleUploadRouteError } from "@/lib/api/upload-errors";
import { requireGuestToken } from "@/lib/api/request";
import { jsonError, jsonOk, unauthorized } from "@/lib/api/response";
import { completeVideoUploadForGuest } from "@/lib/video/server";

/** POST /api/video/upload/complete — register video after direct storage upload. */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const body = (await request.json()) as {
      videoId?: unknown;
      mimeType?: unknown;
      size?: unknown;
      durationSeconds?: unknown;
      fileName?: unknown;
    };

    if (
      typeof body.videoId !== "string" ||
      typeof body.mimeType !== "string" ||
      typeof body.size !== "number" ||
      typeof body.durationSeconds !== "number"
    ) {
      return jsonError(
        "videoId, mimeType, size, and durationSeconds are required",
        400,
        "INVALID_PAYLOAD",
      );
    }

    const video = await completeVideoUploadForGuest(guestToken, body.videoId, {
      mimeType: body.mimeType,
      size: body.size,
      durationSeconds: body.durationSeconds,
      fileName: typeof body.fileName === "string" ? body.fileName : undefined,
    });

    return jsonOk({ video }, 201);
  } catch (error) {
    return handleUploadRouteError(error, "POST /api/video/upload/complete");
  }
}
