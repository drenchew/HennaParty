import { findGuestByToken, upsertGuest } from "@/lib/guest/server";
import { mapDuaRow } from "@/lib/dua/map";
import { DUA_SELECT } from "@/lib/dua/pool";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Dua } from "@/types";

function parseAssignError(error: { message: string }) {
  if (error.message.includes("GUEST_NOT_FOUND")) return "GUEST_NOT_FOUND";
  if (error.message.includes("DUA_NOT_ASSIGNED")) return "DUA_NOT_ASSIGNED";
  return null;
}

/**
 * Gives the guest a random dua from the pool.
 * Pool rows stay reusable; each guest gets their own copy row for accept/reload.
 */
export async function assignDuaToGuest(guestToken: string): Promise<Dua> {
  await upsertGuest(guestToken);
  const guest = await findGuestByToken(guestToken);
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  const supabase = createAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("duas")
    .select(DUA_SELECT)
    .eq("assigned_guest_id", guest.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return mapDuaRow(existing as Record<string, unknown>);

  const { data: pool, error: poolError } = await supabase
    .from("duas")
    .select("id, arabic, translation")
    .eq("used", false)
    .is("assigned_guest_id", null);

  if (poolError) throw poolError;
  if (!pool?.length) throw new Error("DUA_POOL_EMPTY");

  const picked = pool[Math.floor(Math.random() * pool.length)]!;

  const { data: created, error: insertError } = await supabase
    .from("duas")
    .insert({
      arabic: picked.arabic,
      translation: picked.translation,
      used: true,
      assigned_guest_id: guest.id,
      assigned_at: new Date().toISOString(),
    })
    .select(DUA_SELECT)
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: raced, error: raceError } = await supabase
        .from("duas")
        .select(DUA_SELECT)
        .eq("assigned_guest_id", guest.id)
        .single();

      if (!raceError && raced) {
        return mapDuaRow(raced as Record<string, unknown>);
      }
    }
    throw insertError;
  }
  return mapDuaRow(created as Record<string, unknown>);
}

/** Idempotent accept — sets accepted_at once per guest assignment. */
export async function acceptDuaForGuest(guestToken: string): Promise<{
  dua: Dua;
  accepted_at: string;
}> {
  const guest = await findGuestByToken(guestToken);
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  const supabase = createAdminClient();

  const { data: dua, error: fetchError } = await supabase
    .from("duas")
    .select(DUA_SELECT)
    .eq("assigned_guest_id", guest.id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!dua) throw new Error("DUA_NOT_ASSIGNED");

  const row = dua as Record<string, unknown> & { accepted_at?: string | null };
  if (row.accepted_at) {
    return {
      dua: mapDuaRow(row),
      accepted_at: String(row.accepted_at),
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("duas")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", row.id)
    .is("accepted_at", null)
    .select(DUA_SELECT)
    .maybeSingle();

  if (updateError) {
    const code = parseAssignError(updateError);
    if (code) throw new Error(code);
    throw updateError;
  }

  if (updated) {
    const accepted = updated as Record<string, unknown> & { accepted_at: string };
    return {
      dua: mapDuaRow(accepted),
      accepted_at: String(accepted.accepted_at),
    };
  }

  const { data: refreshed, error: refreshError } = await supabase
    .from("duas")
    .select(DUA_SELECT)
    .eq("assigned_guest_id", guest.id)
    .single();

  if (refreshError) throw refreshError;
  const acceptedAt = (refreshed as { accepted_at?: string }).accepted_at;
  if (!acceptedAt) throw new Error("DUA_NOT_ASSIGNED");

  return {
    dua: mapDuaRow(refreshed as Record<string, unknown>),
    accepted_at: acceptedAt,
  };
}
