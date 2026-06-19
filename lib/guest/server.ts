import { createAdminClient } from "@/lib/supabase/admin";
import { getQuestionnaireQuestionCount } from "@/lib/questionnaire/server";
import type { Guest, GuestProgress } from "@/types";

const GUEST_COLUMNS = "id, guest_token, created_at, hijabi";

export async function findGuestByToken(
  guestToken: string,
): Promise<Guest | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .select(GUEST_COLUMNS)
    .eq("guest_token", guestToken)
    .maybeSingle();

  if (error) throw error;
  return data as Guest | null;
}

export async function upsertGuest(guestToken: string): Promise<{
  guest: Guest;
  created: boolean;
}> {
  const supabase = createAdminClient();
  const existing = await findGuestByToken(guestToken);

  if (existing) {
    return { guest: existing, created: false };
  }

  const { data, error } = await supabase
    .from("guests")
    .insert({ guest_token: guestToken })
    .select(GUEST_COLUMNS)
    .single();

  if (error) throw error;
  return { guest: data as Guest, created: true };
}

export async function setGuestHijabiPreference(
  guestToken: string,
  hijabi: boolean,
): Promise<Guest> {
  await upsertGuest(guestToken);
  const guest = await findGuestByToken(guestToken);
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  if (guest.hijabi === hijabi) {
    return guest;
  }

  if (guest.hijabi !== null && guest.hijabi !== hijabi) {
    const supabase = createAdminClient();
    const [photosResult, videoResult] = await Promise.all([
      supabase
        .from("photos")
        .select("id", { count: "exact", head: true })
        .eq("guest_id", guest.id),
      supabase
        .from("videos")
        .select("id", { count: "exact", head: true })
        .eq("guest_id", guest.id),
    ]);

    const hasMedia = (photosResult.count ?? 0) > 0 || (videoResult.count ?? 0) > 0;
    if (hasMedia) {
      throw new Error(
        "HIJAB_PREFERENCE_LOCKED:Cannot change section after uploading photos or video",
      );
    }
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .update({ hijabi })
    .eq("id", guest.id)
    .select(GUEST_COLUMNS)
    .single();

  if (error) throw error;
  return data as Guest;
}

export async function getGuestProgress(guestId: string): Promise<GuestProgress> {
  const supabase = createAdminClient();

  const [duaResult, videoResult, photosResult, messageResult, votesResult] =
    await Promise.all([
      supabase
        .from("duas")
        .select("id, assigned_at, accepted_at")
        .eq("assigned_guest_id", guestId)
        .maybeSingle(),
      supabase.from("videos").select("id").eq("guest_id", guestId).maybeSingle(),
      supabase.from("photos").select("id", { count: "exact", head: true }).eq("guest_id", guestId),
      supabase.from("messages").select("id").eq("guest_id", guestId).maybeSingle(),
      supabase.from("votes").select("id", { count: "exact", head: true }).eq("guest_id", guestId),
    ]);

  const hasDua = Boolean(duaResult.data);
  const duaAccepted = Boolean(duaResult.data?.accepted_at);
  const hasVideo = Boolean(videoResult.data);
  const photoCount = photosResult.count ?? 0;
  const hasMessage = Boolean(messageResult.data);
  const votesCount = votesResult.count ?? 0;
  const questionCount = await getQuestionnaireQuestionCount();
  const questionnaireComplete = votesCount >= questionCount;

  const progress = {
    hasDua,
    duaAccepted,
    hasVideo,
    photoCount,
    hasMessage,
    votesCount,
    questionnaireComplete,
  };

  const { deriveSuggestedStep } = await import("@/lib/utils/steps");

  return {
    ...progress,
    suggestedStep: deriveSuggestedStep(progress),
  };
}