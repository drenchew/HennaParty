import { NextRequest } from "next/server";
import { listPhotosForAdmin } from "@/lib/admin/server";
import { parseMediaSection, withAdminAuth } from "@/lib/api/admin-route";
import { jsonOk } from "@/lib/api/response";

export const GET = withAdminAuth(async (request: NextRequest) => {
  const section = parseMediaSection(
    request.nextUrl.searchParams.get("section"),
  );
  const photos = await listPhotosForAdmin(section);
  return jsonOk({ photos, count: photos.length, section });
});
