import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import {
  jsonOk,
  notFound,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import { findGuestByToken } from "@/lib/guest/server";
import { PHOTOS_BUCKET } from "@/lib/constants/steps";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** DELETE /api/photos/[id] — remove guest photo from storage + DB. */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const guest = await findGuestByToken(guestToken);
    if (!guest) return unauthorized();

    const { id } = await context.params;
    const supabase = createAdminClient();

    const { data: photo, error: fetchError } = await supabase
      .from("photos")
      .select("id, url, guest_id")
      .eq("id", id)
      .eq("guest_id", guest.id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!photo) return notFound("Photo not found");

    await supabase.storage.from(PHOTOS_BUCKET).remove([photo.url]);

    const { error: deleteError } = await supabase
      .from("photos")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return jsonOk({ deleted: true });
  } catch (error) {
    console.error("[DELETE /api/photos/[id]]", error);
    return serverError();
  }
}
