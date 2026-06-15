import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import { jsonError, jsonOk, serverError, unauthorized } from "@/lib/api/response";
import { findGuestByToken } from "@/lib/guest/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/dua/accept — guest confirms their assigned dua.
 * TODO: persist accepted_at when schema column is added; currently validates assignment exists.
 */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const guest = await findGuestByToken(guestToken);
    if (!guest) return unauthorized();

    const supabase = createAdminClient();
    const { data: dua, error } = await supabase
      .from("duas")
      .select("id, assigned_at")
      .eq("assigned_guest_id", guest.id)
      .maybeSingle();

    if (error) throw error;
    if (!dua) {
      return jsonError("No dua assigned yet", 400, "DUA_NOT_ASSIGNED");
    }

    return jsonOk({ accepted_at: dua.assigned_at ?? new Date().toISOString() });
  } catch (error) {
    console.error("[POST /api/dua/accept]", error);
    return serverError();
  }
}
