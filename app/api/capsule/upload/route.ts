import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import {
  jsonError,
  jsonOk,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import { findGuestByToken } from "@/lib/guest/server";
import { VIDEOS_BUCKET } from "@/lib/constants/steps";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomUUID } from "@/lib/utils/uuid";

/**
 * POST /api/capsule/upload — multipart form field: `video`.
 * Stores in private `videos` bucket; sets unlock_date = now + 1 year.
 */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const guest = await findGuestByToken(guestToken);
    if (!guest) return unauthorized();

    const formData = await request.formData();
    const file = formData.get("video");

    if (!(file instanceof File)) {
      return jsonError("Missing video file", 400, "INVALID_PAYLOAD");
    }

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("videos")
      .select("id")
      .eq("guest_id", guest.id)
      .maybeSingle();

    if (existing) {
      return jsonError("Video already uploaded", 409, "CAPSULE_EXISTS");
    }

    const videoId = randomUUID();
    const extension = file.name.split(".").pop() ?? "webm";
    const storagePath = `${guest.id}/${videoId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(VIDEOS_BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const unlockDate = new Date();
    unlockDate.setFullYear(unlockDate.getFullYear() + 1);

    const { data: video, error: insertError } = await supabase
      .from("videos")
      .insert({
        guest_id: guest.id,
        video_url: storagePath,
        unlock_date: unlockDate.toISOString(),
      })
      .select("id, guest_id, video_url, unlock_date, created_at")
      .single();

    if (insertError) throw insertError;

    return jsonOk({ video }, 201);
  } catch (error) {
    console.error("[POST /api/capsule/upload]", error);
    return serverError();
  }
}
