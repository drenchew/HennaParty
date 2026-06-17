import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import {
  jsonError,
  jsonOk,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import { findGuestByToken } from "@/lib/guest/server";
import { PHOTOS_BUCKET } from "@/lib/constants/steps";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomUUID } from "@/lib/utils/uuid";

/** GET /api/photos — list guest photos with optional signed thumbnail URLs. */
export async function GET(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const guest = await findGuestByToken(guestToken);
    if (!guest) return unauthorized();

    const supabase = createAdminClient();
    const { data: photos, error } = await supabase
      .from("photos")
      .select("id, guest_id, url, created_at")
      .eq("guest_id", guest.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const withUrls = await Promise.all(
      (photos ?? []).map(async (photo) => {
        const { data: signed } = await supabase.storage
          .from(PHOTOS_BUCKET)
          .createSignedUrl(photo.url, 3600);
        return { ...photo, signed_url: signed?.signedUrl };
      }),
    );

    return jsonOk({ photos: withUrls });
  } catch (error) {
    console.error("[GET /api/photos]", error);
    return serverError();
  }
}

/**
 * POST /api/photos — multipart form field: `photo`.
 * Enforces max 3 via DB trigger.
 */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const guest = await findGuestByToken(guestToken);
    if (!guest) return unauthorized();

    const formData = await request.formData();
    const file = formData.get("photo");

    if (!(file instanceof File)) {
      return jsonError("Missing photo file", 400, "INVALID_PAYLOAD");
    }

    const supabase = createAdminClient();
    const photoId = randomUUID();
    const extension = file.name.split(".").pop() ?? "webp";
    const storagePath = `${guest.id}/${photoId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const { data: photo, error: insertError } = await supabase
      .from("photos")
      .insert({ guest_id: guest.id, url: storagePath })
      .select("id, guest_id, url, created_at")
      .single();

    if (insertError) {
      if (insertError.message.includes("PHOTO_LIMIT_REACHED")) {
        return jsonError("Maximum 3 photos allowed", 409, "PHOTO_LIMIT_REACHED");
      }
      throw insertError;
    }

    return jsonOk({ photo }, 201);
  } catch (error) {
    console.error("[POST /api/photos]", error);
    return serverError();
  }
}
