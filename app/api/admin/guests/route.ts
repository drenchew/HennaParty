import { listGuestsForAdmin } from "@/lib/admin/server";
import { withAdminAuth } from "@/lib/api/admin-route";
import { jsonOk } from "@/lib/api/response";

export const GET = withAdminAuth(async () => {
  const guests = await listGuestsForAdmin();
  return jsonOk({ guests, count: guests.length });
});
