import { findGuestByToken, upsertGuest } from "@/lib/guest/server";
import { mapDuaRow } from "@/lib/dua/map";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Dua } from "@/types";

function parseRpcError(error: { message: string; code?: string }) {
  if (error.message.includes("GUEST_NOT_FOUND")) return "GUEST_NOT_FOUND";
  if (error.message.includes("DUA_POOL_EXHAUSTED")) return "DUA_POOL_EXHAUSTED";
  if (error.message.includes("DUA_NOT_ASSIGNED")) return "DUA_NOT_ASSIGNED";
  return null;
}

/**
 * Ensures guest exists, then atomically assigns an unused dua (or returns existing).
 * Race-safe via Postgres FOR UPDATE SKIP LOCKED in assign_dua().
 */
export async function assignDuaToGuest(guestToken: string): Promise<Dua> {
  await upsertGuest(guestToken);

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("assign_dua", {
    p_guest_token: guestToken,
  });

  if (error) {
    const code = parseRpcError(error);
    if (code) {
      throw new Error(code);
    }
    throw error;
  }

  return mapDuaRow(data as Record<string, unknown>);
}

/** Idempotent accept — sets accepted_at once per guest assignment. */
export async function acceptDuaForGuest(guestToken: string): Promise<{
  dua: Dua;
  accepted_at: string;
}> {
  const guest = await findGuestByToken(guestToken);
  if (!guest) {
    throw new Error("GUEST_NOT_FOUND");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("accept_dua", {
    p_guest_token: guestToken,
  });

  if (error) {
    const code = parseRpcError(error);
    if (code) {
      throw new Error(code);
    }
    throw error;
  }

  const row = data as Record<string, unknown> & { accepted_at?: string };
  const acceptedAt = row.accepted_at
    ? String(row.accepted_at)
    : new Date().toISOString();

  return {
    dua: mapDuaRow(row),
    accepted_at: acceptedAt,
  };
}
