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
 * - Picks a random dua from the pool (pool rows are never consumed)
 * - Idempotent: same guest always gets the same assignment on reload
 */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const dua = await assignDuaToGuest(guestToken);
    return jsonOk({ dua });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "DUA_POOL_EMPTY") {
        return jsonError(
          "No duas are in the pool yet. Please ask the host to add duas.",
          409,
          "DUA_POOL_EMPTY",
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
