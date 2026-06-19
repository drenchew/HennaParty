import { NextRequest } from "next/server";
import { handleUploadRouteError } from "@/lib/api/upload-errors";
import { requireGuestToken } from "@/lib/api/request";
import { jsonError, jsonOk, unauthorized } from "@/lib/api/response";
import { prepareVideoUploadForGuest } from "@/lib/video/server";

/** POST /api/video/upload/prepare — signed URL for direct Supabase upload. */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const body = (await request.json()) as {
      mimeType?: unknown;
      size?: unknown;
      durationSeconds?: unknown;
      fileName?: unknown;
    };

    if (
      typeof body.mimeType !== "string" ||
      typeof body.size !== "number" ||
      typeof body.durationSeconds !== "number"
    ) {
      return jsonError(
        "mimeType, size, and durationSeconds are required",
        400,
        "INVALID_PAYLOAD",
      );
    }

    const target = await prepareVideoUploadForGuest(guestToken, {
      mimeType: body.mimeType,
      size: body.size,
      durationSeconds: body.durationSeconds,
      fileName: typeof body.fileName === "string" ? body.fileName : undefined,
    });

    return jsonOk({ upload: target });
  } catch (error) {
    return handleUploadRouteError(error, "POST /api/video/upload/prepare");
  }
}
