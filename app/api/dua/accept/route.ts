import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import {
  jsonError,
  jsonOk,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import { acceptDuaForGuest } from "@/lib/dua/server";

/**
 * POST /api/dua/accept
 * - Requires an assigned dua for this guest
 * - Sets accepted_at (idempotent — safe on double-click)
 */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const result = await acceptDuaForGuest(guestToken);
    return jsonOk(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "DUA_NOT_ASSIGNED") {
        return jsonError("No dua assigned yet", 400, "DUA_NOT_ASSIGNED");
      }
      if (error.message === "GUEST_NOT_FOUND") {
        return unauthorized();
      }
    }

    console.error("[POST /api/dua/accept]", error);
    return serverError();
  }
}
