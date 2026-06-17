import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import {
  jsonError,
  jsonOk,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import { assignDuaToGuest } from "@/lib/dua/server";

/**
 * POST /api/dua/assign
 * - Upserts guest by guest_token
 * - Assigns one unused dua (marks used = true)
 * - Idempotent: same guest always gets the same dua
 * - Race-safe: assign_dua() uses FOR UPDATE SKIP LOCKED
 */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const dua = await assignDuaToGuest(guestToken);
    return jsonOk({ dua });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "DUA_POOL_EXHAUSTED") {
        return jsonError(
          "All duas have been shared tonight. JazakAllah khayr!",
          409,
          "DUA_POOL_EXHAUSTED",
        );
      }
      if (error.message === "GUEST_NOT_FOUND") {
        return unauthorized();
      }
    }

    console.error("[POST /api/dua/assign]", error);
    return serverError();
  }
}
