import { findGuestByToken, upsertGuest } from "@/lib/guest/server";
import { validateMessageText } from "@/lib/message/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export interface MessageRecord {
  id: string;
  guest_id: string;
  message: string;
  created_at: string;
}

export interface AdminMessage {
  id: string;
  message: string;
  created_at: string;
}

export async function getMessageForGuest(
  guestToken: string,
): Promise<MessageRecord | null> {
  const guest = await findGuestByToken(guestToken);
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, guest_id, message, created_at")
    .eq("guest_id", guest.id)
    .maybeSingle();

  if (error) throw error;
  return data as MessageRecord | null;
}

/** Create message — one per guest; no updates after submission. */
export async function createMessageForGuest(
  guestToken: string,
  rawMessage: string,
): Promise<MessageRecord> {
  const validation = validateMessageText(rawMessage);
  if (!validation.ok) {
    throw new Error(`${validation.code}:${validation.error}`);
  }

  await upsertGuest(guestToken);
  const guest = await findGuestByToken(guestToken);
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  const existing = await getMessageForGuest(guestToken);
  if (existing) {
    throw new Error("MESSAGE_EXISTS:Advice already submitted");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ guest_id: guest.id, message: validation.message })
    .select("id, guest_id, message, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("MESSAGE_EXISTS:Advice already submitted");
    }
    throw error;
  }

  return data as MessageRecord;
}

/** All guest messages for admin display (anonymous — no guest tokens). */
export async function listMessagesForAdmin(): Promise<AdminMessage[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, message, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AdminMessage[];
}
