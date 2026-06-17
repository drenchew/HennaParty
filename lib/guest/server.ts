import { createAdminClient } from "@/lib/supabase/admin";
import { QUESTIONNAIRE_QUESTION_COUNT } from "@/lib/constants/questionnaire";
import type { Guest, GuestProgress } from "@/types";

export async function findGuestByToken(
  guestToken: string,
): Promise<Guest | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .select("id, guest_token, created_at")
    .eq("guest_token", guestToken)
    .maybeSingle();

  if (error) throw error;
  return data;
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
    .select("id, guest_token, created_at")
    .single();

  if (error) throw error;
  return { guest: data, created: true };
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
  const questionnaireComplete = votesCount >= QUESTIONNAIRE_QUESTION_COUNT;

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
