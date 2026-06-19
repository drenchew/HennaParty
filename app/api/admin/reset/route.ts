import { NextRequest } from "next/server";
import { resetAllGuestData } from "@/lib/admin/server";
import { withAdminAuth } from "@/lib/api/admin-route";
import { jsonError, jsonOk } from "@/lib/api/response";

export const POST = withAdminAuth(async (request: NextRequest) => {
  const body = (await request.json()) as { confirm?: unknown };

  if (body.confirm !== "RESET") {
    return jsonError(
      'Send { "confirm": "RESET" } to clear all guest data',
      400,
      "CONFIRM_REQUIRED",
    );
  }

  const result = await resetAllGuestData();
  return jsonOk(result);
});
