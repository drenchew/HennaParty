import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import { jsonError, jsonOk, serverError, unauthorized } from "@/lib/api/response";
import { findGuestByToken } from "@/lib/guest/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** POST /api/dua/assign — RPC assign_dua(guest_token). */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const guest = await findGuestByToken(guestToken);
    if (!guest) return unauthorized();

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("assign_dua", {
      p_guest_token: guestToken,
    });

    if (error) {
      if (error.message.includes("DUA_POOL_EXHAUSTED")) {
        return jsonError("All duas have been assigned", 409, "DUA_POOL_EXHAUSTED");
      }
      throw error;
    }

    return jsonOk({ dua: data });
  } catch (error) {
    console.error("[POST /api/dua/assign]", error);
    return serverError();
  }
}
