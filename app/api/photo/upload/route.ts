import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import {
  jsonError,
  jsonOk,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import { uploadPhotoForGuest } from "@/lib/photo/server";

/**
 * POST /api/photo/upload
 * multipart/form-data field: photo
 * Max 3 photos per guest — enforced before storage upload + DB trigger
 */
/**
 * Legacy multipart upload — kept for local fallback.
 * Production clients use /api/photo/upload/prepare + direct Supabase upload + /complete.
 */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const formData = await request.formData();
    const file = formData.get("photo");

    if (!(file instanceof File)) {
      return jsonError("Missing photo file", 400, "INVALID_PAYLOAD");
    }

    const photo = await uploadPhotoForGuest(guestToken, file);
    return jsonOk({ photo }, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "GUEST_NOT_FOUND") return unauthorized();

      const [code, message] = error.message.split(":");
      if (
        code &&
        message &&
        ["EMPTY_FILE", "FILE_TOO_LARGE", "INVALID_MIME", "PHOTO_LIMIT_REACHED", "HIJAB_PREFERENCE_REQUIRED"].includes(
          code,
        )
      ) {
        const status = code === "PHOTO_LIMIT_REACHED" ? 409 : 400;
        return jsonError(message, status, code);
      }
    }

    console.error("[POST /api/photo/upload]", error);
    return serverError();
  }
}
