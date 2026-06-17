import { NextRequest } from "next/server";
import { requireAdminSecret, adminUnauthorized } from "@/lib/api/admin";
import { jsonOk, serverError } from "@/lib/api/response";
import { listMessagesForAdmin } from "@/lib/message/server";

/**
 * GET /api/admin/messages
 * Requires X-Admin-Secret or Authorization: Bearer header.
 * Returns all guest advice messages for the admin panel.
 */
export async function GET(request: NextRequest) {
  if (!requireAdminSecret(request)) {
    return adminUnauthorized();
  }

  try {
    const messages = await listMessagesForAdmin();
    return jsonOk({ messages, count: messages.length });
  } catch (error) {
    console.error("[GET /api/admin/messages]", error);
    return serverError();
  }
}
