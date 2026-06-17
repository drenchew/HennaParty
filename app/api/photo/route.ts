import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import { jsonOk, serverError, unauthorized } from "@/lib/api/response";
import { getPhotoUploadQuota, listPhotosForGuest } from "@/lib/photo/server";

/** GET /api/photo — list guest photos + upload quota */
export async function GET(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const [photos, quota] = await Promise.all([
      listPhotosForGuest(guestToken),
      getPhotoUploadQuota(guestToken),
    ]);

    return jsonOk({ photos, quota });
  } catch (error) {
    if (error instanceof Error && error.message === "GUEST_NOT_FOUND") {
      return unauthorized();
    }
    console.error("[GET /api/photo]", error);
    return serverError();
  }
}
