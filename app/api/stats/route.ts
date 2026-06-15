import { jsonOk, serverError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/stats — public aggregate stats for thank-you page. */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("get_event_stats");

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;

    return jsonOk({
      duas_assigned: Number(row?.duas_assigned ?? 0),
      photos_uploaded: Number(row?.photos_uploaded ?? 0),
      messages_count: Number(row?.messages_count ?? 0),
      votes_count: Number(row?.votes_count ?? 0),
      videos_count: Number(row?.videos_count ?? 0),
    });
  } catch (error) {
    console.error("[GET /api/stats]", error);
    return serverError();
  }
}
