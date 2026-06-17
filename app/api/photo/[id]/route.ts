import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import {
  jsonOk,
  notFound,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import { deletePhotoForGuest } from "@/lib/photo/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** DELETE /api/photo/[id] */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const { id } = await context.params;
    await deletePhotoForGuest(guestToken, id);
    return jsonOk({ deleted: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "GUEST_NOT_FOUND") return unauthorized();
      if (error.message === "PHOTO_NOT_FOUND") return notFound("Photo not found");
    }
    console.error("[DELETE /api/photo/[id]]", error);
    return serverError();
  }
}
