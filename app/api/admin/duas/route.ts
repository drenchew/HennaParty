import { NextRequest } from "next/server";
import { createDuaForAdmin, listDuasForAdmin } from "@/lib/admin/server";
import { withAdminAuth } from "@/lib/api/admin-route";
import { jsonError, jsonOk } from "@/lib/api/response";

export const GET = withAdminAuth(async () => {
  const duas = await listDuasForAdmin();
  return jsonOk({ duas, count: duas.length });
});

export const POST = withAdminAuth(async (request: NextRequest) => {
  const body = (await request.json()) as {
    arabic?: unknown;
    translation?: unknown;
  };

  if (typeof body.arabic !== "string" || typeof body.translation !== "string") {
    return jsonError("arabic and translation are required", 400, "INVALID_PAYLOAD");
  }

  const dua = await createDuaForAdmin({
    arabic: body.arabic,
    translation: body.translation,
  });

  return jsonOk({ dua }, 201);
});
