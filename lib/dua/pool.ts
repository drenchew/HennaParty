/** Columns returned for dua API/admin mapping. */
export const DUA_SELECT =
  "id, arabic, translation, used, assigned_guest_id, assigned_at, accepted_at";

/** Template row in the shared pool (admin-managed, reusable). */
export function isPoolDuaRow(row: {
  used: boolean;
  assigned_guest_id: string | null;
}): boolean {
  return !row.used && row.assigned_guest_id === null;
}
