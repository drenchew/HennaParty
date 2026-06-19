import { mapDuaRow } from "@/lib/dua/map";
import { photosBucketForHijabi, videosBucketForHijabi } from "@/lib/media/buckets";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLiveResults } from "@/lib/vote/server";
import { listMessagesForAdmin } from "@/lib/message/server";
import { isVideoLocked } from "@/lib/video/validation";
import type { Dua, EventStats } from "@/types";

export type MediaSection = "standard" | "hijabi" | "all";

export interface AdminOverview {
  stats: EventStats;
  guest_count: number;
  duas_total: number;
  duas_available: number;
}

export interface AdminPhotoItem {
  id: string;
  guest_id: string;
  created_at: string;
  is_hijabi: boolean;
  signed_url: string | null;
}

export interface AdminVideoItem {
  id: string;
  guest_id: string;
  created_at: string;
  unlock_date: string;
  is_hijabi: boolean;
  locked: boolean;
  signed_url: string | null;
}

export interface AdminResetResult {
  deleted_guests: number;
  storage_files_removed: number;
  duas_reset: number;
}

export interface AdminGuestItem {
  id: string;
  created_at: string;
  hijabi: boolean | null;
  photo_count: number;
  has_video: boolean;
  has_message: boolean;
  has_dua: boolean;
}

export interface AdminGuestDeleteResult {
  deleted: true;
  storage_files_removed: number;
  duas_reset: number;
}

function hijabiFilter(section: MediaSection): boolean | null {
  if (section === "standard") return false;
  if (section === "hijabi") return true;
  return null;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = createAdminClient();

  const [statsResult, guestsResult, duasResult] = await Promise.all([
    supabase.rpc("get_event_stats"),
    supabase.from("guests").select("id", { count: "exact", head: true }),
    supabase.from("duas").select("id, used"),
  ]);

  if (statsResult.error) throw statsResult.error;
  if (guestsResult.error) throw guestsResult.error;
  if (duasResult.error) throw duasResult.error;

  const row = Array.isArray(statsResult.data) ? statsResult.data[0] : statsResult.data;
  const duas = duasResult.data ?? [];

  return {
    stats: {
      duas_assigned: Number(row?.duas_assigned ?? 0),
      photos_uploaded: Number(row?.photos_uploaded ?? 0),
      messages_count: Number(row?.messages_count ?? 0),
      votes_count: Number(row?.votes_count ?? 0),
      videos_count: Number(row?.videos_count ?? 0),
    },
    guest_count: guestsResult.count ?? 0,
    duas_total: duas.length,
    duas_available: duas.filter((d) => !d.used).length,
  };
}

export async function listPhotosForAdmin(
  section: MediaSection,
): Promise<AdminPhotoItem[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("photos")
    .select("id, guest_id, url, created_at, is_hijabi")
    .order("created_at", { ascending: false });

  const hijabi = hijabiFilter(section);
  if (hijabi !== null) {
    query = query.eq("is_hijabi", hijabi);
  }

  const { data, error } = await query;
  if (error) throw error;

  const items = await Promise.all(
    (data ?? []).map(async (photo) => {
      const bucket = photosBucketForHijabi(photo.is_hijabi);
      const { data: signed } = await supabase.storage
        .from(bucket)
        .createSignedUrl(photo.url, 3600);
      return {
        id: photo.id,
        guest_id: photo.guest_id,
        created_at: photo.created_at,
        is_hijabi: photo.is_hijabi,
        signed_url: signed?.signedUrl ?? null,
      } satisfies AdminPhotoItem;
    }),
  );

  return items;
}

export async function listVideosForAdmin(
  section: MediaSection,
): Promise<AdminVideoItem[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("videos")
    .select("id, guest_id, video_url, created_at, unlock_date, is_hijabi")
    .order("created_at", { ascending: false });

  const hijabi = hijabiFilter(section);
  if (hijabi !== null) {
    query = query.eq("is_hijabi", hijabi);
  }

  const { data, error } = await query;
  if (error) throw error;

  const items = await Promise.all(
    (data ?? []).map(async (video) => {
      const bucket = videosBucketForHijabi(video.is_hijabi);
      const { data: signed } = await supabase.storage
        .from(bucket)
        .createSignedUrl(video.video_url, 3600);
      return {
        id: video.id,
        guest_id: video.guest_id,
        created_at: video.created_at,
        unlock_date: video.unlock_date,
        is_hijabi: video.is_hijabi,
        locked: isVideoLocked(video.unlock_date),
        signed_url: signed?.signedUrl ?? null,
      } satisfies AdminVideoItem;
    }),
  );

  return items;
}

export async function listDuasForAdmin(): Promise<Dua[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("duas")
    .select(
      "id, arabic, translation, used, assigned_guest_id, assigned_at, accepted_at",
    )
    .order("id", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapDuaRow(row as Record<string, unknown>));
}

export async function createDuaForAdmin(input: {
  arabic: string;
  translation: string;
}): Promise<Dua> {
  const arabic = input.arabic.trim();
  const translation = input.translation.trim();

  if (!arabic || !translation) {
    throw new Error("INVALID_PAYLOAD:Arabic text and translation are required");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("duas")
    .insert({ arabic, translation })
    .select(
      "id, arabic, translation, used, assigned_guest_id, assigned_at, accepted_at",
    )
    .single();

  if (error) throw error;
  return mapDuaRow(data as Record<string, unknown>);
}

export async function deleteDuaForAdmin(id: number): Promise<void> {
  const supabase = createAdminClient();
  const { data: dua, error: fetchError } = await supabase
    .from("duas")
    .select("id, used")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!dua) throw new Error("NOT_FOUND:Dua not found");

  if (dua.used) {
    const { error: unassignError } = await supabase
      .from("duas")
      .update({
        used: false,
        assigned_guest_id: null,
        assigned_at: null,
        accepted_at: null,
      })
      .eq("id", id);

    if (unassignError) throw unassignError;
  }

  const { error: deleteError } = await supabase.from("duas").delete().eq("id", id);
  if (deleteError) throw deleteError;
}

export async function deletePhotoForAdmin(photoId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: photo, error: fetchError } = await supabase
    .from("photos")
    .select("id, url, is_hijabi")
    .eq("id", photoId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!photo) throw new Error("NOT_FOUND:Photo not found");

  const bucket = photosBucketForHijabi(photo.is_hijabi);
  const { error: storageError } = await supabase.storage
    .from(bucket)
    .remove([photo.url]);
  if (storageError) throw storageError;

  const { error: deleteError } = await supabase
    .from("photos")
    .delete()
    .eq("id", photoId);
  if (deleteError) throw deleteError;
}

export async function deleteVideoForAdmin(videoId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: video, error: fetchError } = await supabase
    .from("videos")
    .select("id, video_url, is_hijabi")
    .eq("id", videoId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!video) throw new Error("NOT_FOUND:Video not found");

  const bucket = videosBucketForHijabi(video.is_hijabi);
  const { error: storageError } = await supabase.storage
    .from(bucket)
    .remove([video.video_url]);
  if (storageError) throw storageError;

  const { error: deleteError } = await supabase
    .from("videos")
    .delete()
    .eq("id", videoId);
  if (deleteError) throw deleteError;
}

export async function deleteMessageForAdmin(messageId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("messages").delete().eq("id", messageId);
  if (error) throw error;
}

export async function unassignDuaForAdmin(id: number): Promise<void> {
  const supabase = createAdminClient();
  const { data: dua, error: fetchError } = await supabase
    .from("duas")
    .select("id, used")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!dua) throw new Error("NOT_FOUND:Dua not found");
  if (!dua.used) return;

  const { error: updateError } = await supabase
    .from("duas")
    .update({
      used: false,
      assigned_guest_id: null,
      assigned_at: null,
      accepted_at: null,
    })
    .eq("id", id);

  if (updateError) throw updateError;
}

export async function listGuestsForAdmin(): Promise<AdminGuestItem[]> {
  const supabase = createAdminClient();
  const { data: guests, error } = await supabase
    .from("guests")
    .select("id, created_at, hijabi")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const items = await Promise.all(
    (guests ?? []).map(async (guest) => {
      const [photosResult, videoResult, messageResult, duaResult] =
        await Promise.all([
          supabase
            .from("photos")
            .select("id", { count: "exact", head: true })
            .eq("guest_id", guest.id),
          supabase
            .from("videos")
            .select("id", { count: "exact", head: true })
            .eq("guest_id", guest.id),
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("guest_id", guest.id),
          supabase
            .from("duas")
            .select("id", { count: "exact", head: true })
            .eq("assigned_guest_id", guest.id),
        ]);

      if (photosResult.error) throw photosResult.error;
      if (videoResult.error) throw videoResult.error;
      if (messageResult.error) throw messageResult.error;
      if (duaResult.error) throw duaResult.error;

      return {
        id: guest.id,
        created_at: guest.created_at,
        hijabi: guest.hijabi,
        photo_count: photosResult.count ?? 0,
        has_video: (videoResult.count ?? 0) > 0,
        has_message: (messageResult.count ?? 0) > 0,
        has_dua: (duaResult.count ?? 0) > 0,
      } satisfies AdminGuestItem;
    }),
  );

  return items;
}

export async function deleteGuestForAdmin(
  guestId: string,
): Promise<AdminGuestDeleteResult> {
  const supabase = createAdminClient();

  const [photosResult, videoResult, guestResult] = await Promise.all([
    supabase
      .from("photos")
      .select("url, is_hijabi")
      .eq("guest_id", guestId),
    supabase
      .from("videos")
      .select("video_url, is_hijabi")
      .eq("guest_id", guestId),
    supabase.from("guests").select("id").eq("id", guestId).maybeSingle(),
  ]);

  if (photosResult.error) throw photosResult.error;
  if (videoResult.error) throw videoResult.error;
  if (guestResult.error) throw guestResult.error;
  if (!guestResult.data) throw new Error("NOT_FOUND:Guest not found");

  let storageFilesRemoved = 0;

  const photoBuckets = new Map<string, string[]>();
  for (const photo of photosResult.data ?? []) {
    const bucket = photosBucketForHijabi(photo.is_hijabi);
    const list = photoBuckets.get(bucket) ?? [];
    list.push(photo.url);
    photoBuckets.set(bucket, list);
  }

  for (const [bucket, paths] of photoBuckets) {
    if (paths.length === 0) continue;
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw error;
    storageFilesRemoved += paths.length;
  }

  for (const video of videoResult.data ?? []) {
    const bucket = videosBucketForHijabi(video.is_hijabi);
    const { error } = await supabase.storage
      .from(bucket)
      .remove([video.video_url]);
    if (error) throw error;
    storageFilesRemoved += 1;
  }

  const { data: resetDuas, error: duaResetError } = await supabase
    .from("duas")
    .update({
      used: false,
      assigned_guest_id: null,
      assigned_at: null,
      accepted_at: null,
    })
    .eq("assigned_guest_id", guestId)
    .select("id");

  if (duaResetError) throw duaResetError;

  const { error: deleteError } = await supabase
    .from("guests")
    .delete()
    .eq("id", guestId);

  if (deleteError) throw deleteError;

  return {
    deleted: true,
    storage_files_removed: storageFilesRemoved,
    duas_reset: resetDuas?.length ?? 0,
  };
}

export async function resetAllGuestData(): Promise<AdminResetResult> {
  const supabase = createAdminClient();

  const [photosResult, videosResult, guestCountResult] = await Promise.all([
    supabase.from("photos").select("url, is_hijabi"),
    supabase.from("videos").select("video_url, is_hijabi"),
    supabase.from("guests").select("id", { count: "exact", head: true }),
  ]);

  if (photosResult.error) throw photosResult.error;
  if (videosResult.error) throw videosResult.error;
  if (guestCountResult.error) throw guestCountResult.error;

  let storageFilesRemoved = 0;

  const photoBuckets = new Map<string, string[]>();
  for (const photo of photosResult.data ?? []) {
    const bucket = photosBucketForHijabi(photo.is_hijabi);
    const list = photoBuckets.get(bucket) ?? [];
    list.push(photo.url);
    photoBuckets.set(bucket, list);
  }

  for (const [bucket, paths] of photoBuckets) {
    if (paths.length === 0) continue;
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw error;
    storageFilesRemoved += paths.length;
  }

  const videoBuckets = new Map<string, string[]>();
  for (const video of videosResult.data ?? []) {
    const bucket = videosBucketForHijabi(video.is_hijabi);
    const list = videoBuckets.get(bucket) ?? [];
    list.push(video.video_url);
    videoBuckets.set(bucket, list);
  }

  for (const [bucket, paths] of videoBuckets) {
    if (paths.length === 0) continue;
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw error;
    storageFilesRemoved += paths.length;
  }

  const { data: resetDuas, error: duaResetError } = await supabase
    .from("duas")
    .update({
      used: false,
      assigned_guest_id: null,
      assigned_at: null,
      accepted_at: null,
    })
    .eq("used", true)
    .select("id");

  if (duaResetError) throw duaResetError;

  const { error: guestDeleteError } = await supabase
    .from("guests")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (guestDeleteError) throw guestDeleteError;

  return {
    deleted_guests: guestCountResult.count ?? 0,
    storage_files_removed: storageFilesRemoved,
    duas_reset: resetDuas?.length ?? 0,
  };
}

export async function getAdminQuestionnaireResults() {
  return getLiveResults();
}

export {
  listQuestionnaireQuestions,
  updateQuestionnaireQuestionForAdmin,
} from "@/lib/questionnaire/server";

export type { QuestionnaireQuestion } from "@/lib/questionnaire/types";

export { listMessagesForAdmin };
