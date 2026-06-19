import { NextRequest } from "next/server";
import { handleUploadRouteError } from "@/lib/api/upload-errors";
import { requireGuestToken } from "@/lib/api/request";
import { jsonError, jsonOk, unauthorized } from "@/lib/api/response";
import { preparePhotoUploadForGuest } from "@/lib/photo/server";

/** POST /api/photo/upload/prepare — signed URL for direct Supabase upload. */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const body = (await request.json()) as { mimeType?: unknown; size?: unknown };
    if (typeof body.mimeType !== "string" || typeof body.size !== "number") {
      return jsonError("mimeType and size are required", 400, "INVALID_PAYLOAD");
    }

    const target = await preparePhotoUploadForGuest(guestToken, {
      mimeType: body.mimeType,
      size: body.size,
    });

    return jsonOk({ upload: target });
  } catch (error) {
    return handleUploadRouteError(error, "POST /api/photo/upload/prepare");
  }
}
