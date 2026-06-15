import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import {
  jsonError,
  jsonOk,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import { findGuestByToken } from "@/lib/guest/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** POST /api/advice — submit one advice message per guest. */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const guest = await findGuestByToken(guestToken);
    if (!guest) return unauthorized();

    const body = (await request.json()) as { message?: string };
    const message = body.message?.trim();

    if (!message || message.length > 2000) {
      return jsonError("Message must be 1–2000 characters", 400, "INVALID_MESSAGE");
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ guest_id: guest.id, message })
      .select("id, guest_id, message, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return jsonError("Advice already submitted", 409, "MESSAGE_EXISTS");
      }
      throw error;
    }

    return jsonOk({ message: data }, 201);
  } catch (error) {
    console.error("[POST /api/advice]", error);
    return serverError();
  }
}
