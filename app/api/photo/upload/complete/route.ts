import { NextRequest } from "next/server";
import { handleUploadRouteError } from "@/lib/api/upload-errors";
import { requireGuestToken } from "@/lib/api/request";
import { jsonError, jsonOk, unauthorized } from "@/lib/api/response";
import { completePhotoUploadForGuest } from "@/lib/photo/server";

/** POST /api/photo/upload/complete — register photo after direct storage upload. */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const body = (await request.json()) as { photoId?: unknown; mimeType?: unknown };
    if (typeof body.photoId !== "string" || typeof body.mimeType !== "string") {
      return jsonError("photoId and mimeType are required", 400, "INVALID_PAYLOAD");
    }

    const photo = await completePhotoUploadForGuest(
      guestToken,
      body.photoId,
      body.mimeType,
    );

    return jsonOk({ photo }, 201);
  } catch (error) {
    return handleUploadRouteError(error, "POST /api/photo/upload/complete");
  }
}
