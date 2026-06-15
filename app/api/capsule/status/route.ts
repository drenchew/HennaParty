import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import { jsonOk, serverError, unauthorized } from "@/lib/api/response";
import { findGuestByToken } from "@/lib/guest/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/capsule/status — metadata only; never returns playable URL before unlock. */
export async function GET(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const guest = await findGuestByToken(guestToken);
    if (!guest) return unauthorized();

    const supabase = createAdminClient();
    const { data: video, error } = await supabase
      .from("videos")
      .select("unlock_date")
      .eq("guest_id", guest.id)
      .maybeSingle();

    if (error) throw error;

    if (!video) {
      return jsonOk({ uploaded: false, unlock_date: null, locked: false });
    }

    const locked = new Date() < new Date(video.unlock_date);
    return jsonOk({
      uploaded: true,
      unlock_date: video.unlock_date,
      locked,
    });
  } catch (error) {
    console.error("[GET /api/capsule/status]", error);
    return serverError();
  }
}
