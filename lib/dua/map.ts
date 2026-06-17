import type { Dua } from "@/types";

/** Normalize Supabase row (RPC or query) to API Dua shape. */
export function mapDuaRow(row: Record<string, unknown>): Dua {
  return {
    id: Number(row.id),
    arabic: String(row.arabic),
    translation: String(row.translation),
    used: Boolean(row.used),
    assigned_guest_id: row.assigned_guest_id
      ? String(row.assigned_guest_id)
      : null,
    assigned_at: row.assigned_at ? String(row.assigned_at) : null,
    accepted_at: row.accepted_at ? String(row.accepted_at) : null,
  };
}
