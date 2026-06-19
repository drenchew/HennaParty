import { getAdminOverview } from "@/lib/admin/server";
import { withAdminAuth } from "@/lib/api/admin-route";
import { jsonOk } from "@/lib/api/response";

export const GET = withAdminAuth(async () => {
  const overview = await getAdminOverview();
  return jsonOk(overview);
});
