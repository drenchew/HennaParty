import { NextRequest } from "next/server";
import { listVideosForAdmin } from "@/lib/admin/server";
import { parseMediaSection, withAdminAuth } from "@/lib/api/admin-route";
import { jsonOk } from "@/lib/api/response";

export const GET = withAdminAuth(async (request: NextRequest) => {
  const section = parseMediaSection(
    request.nextUrl.searchParams.get("section"),
  );
  const videos = await listVideosForAdmin(section);
  return jsonOk({ videos, count: videos.length, section });
});
