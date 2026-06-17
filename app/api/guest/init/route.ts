import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import { handleDatabaseError } from "@/lib/api/supabase-errors";
import { jsonOk, unauthorized } from "@/lib/api/response";
import { upsertGuest } from "@/lib/guest/server";

/** POST /api/guest/init — create guest row if missing. */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const result = await upsertGuest(guestToken);
    return jsonOk(result, result.created ? 201 : 200);
  } catch (error) {
    return handleDatabaseError(error, "POST /api/guest/init");
  }
}
