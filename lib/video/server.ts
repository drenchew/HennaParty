import { findGuestByToken, upsertGuest } from "@/lib/guest/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VIDEOS_BUCKET } from "@/lib/constants/steps";
import {
  buildVideoStoragePath,
  computeUnlockDate,
  isVideoLocked,
  validateVideoUpload,
} from "@/lib/video/validation";
import { randomUUID } from "@/lib/utils/uuid";

export interface VideoRecord {
  id: string;
  guest_id: string;
  unlock_date: string;
  created_at: string;
}

export interface VideoStatus {
  uploaded: boolean;
  unlock_date: string | null;
  locked: boolean;
  video: SafeVideoResponse | null;
}

/** Public-safe shape — never includes storage path or signed URL. */
export interface SafeVideoResponse {
  id: string;
  unlock_date: string;
  created_at: string;
  locked: boolean;
}

function toSafeVideo(row: VideoRecord): SafeVideoResponse {
  return {
    id: row.id,
    unlock_date: row.unlock_date,
    created_at: row.created_at,
    locked: isVideoLocked(row.unlock_date),
  };
}

export async function getVideoStatusForGuest(
  guestToken: string,
): Promise<VideoStatus> {
  const guest = await findGuestByToken(guestToken);
  if (!guest) {
    throw new Error("GUEST_NOT_FOUND");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("videos")
    .select("id, unlock_date, created_at")
    .eq("guest_id", guest.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return { uploaded: false, unlock_date: null, locked: false, video: null };
  }

  const safe = toSafeVideo(data as VideoRecord);
  return {
    uploaded: true,
    unlock_date: data.unlock_date,
    locked: safe.locked,
    video: safe,
  };
}

export async function uploadVideoForGuest(
  guestToken: string,
  file: File,
  durationSeconds: number,
): Promise<SafeVideoResponse> {
  const validation = validateVideoUpload({ file, durationSeconds });
  if (!validation.ok) {
    throw new Error(`${validation.code}:${validation.message}`);
  }

  await upsertGuest(guestToken);
  const guest = await findGuestByToken(guestToken);
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("videos")
    .select("id, unlock_date, created_at")
    .eq("guest_id", guest.id)
    .maybeSingle();

  if (existing) {
    return toSafeVideo(existing as VideoRecord);
  }

  const videoId = randomUUID();
  const storagePath = buildVideoStoragePath(guest.id, videoId, file.type);

  const { error: uploadError } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
      cacheControl: "private, max-age=3600",
    });

  if (uploadError) {
    throw uploadError;
  }

  const unlockDate = computeUnlockDate();

  const { data: video, error: insertError } = await supabase
    .from("videos")
    .insert({
      id: videoId,
      guest_id: guest.id,
      video_url: storagePath,
      unlock_date: unlockDate.toISOString(),
    })
    .select("id, guest_id, unlock_date, created_at")
    .single();

  if (insertError) {
    await supabase.storage.from(VIDEOS_BUCKET).remove([storagePath]);
    throw insertError;
  }

  return toSafeVideo(video as VideoRecord);
}

/**
 * Returns a short-lived signed URL only when unlock_date has passed.
 * Prevents direct storage URL bypass — all playback must go through this check.
 */
export async function getUnlockedVideoStreamUrl(
  guestToken: string,
): Promise<{ signed_url: string; expires_in: number }> {
  const guest = await findGuestByToken(guestToken);
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  const supabase = createAdminClient();
  const { data: video, error } = await supabase
    .from("videos")
    .select("id, video_url, unlock_date")
    .eq("guest_id", guest.id)
    .maybeSingle();

  if (error) throw error;
  if (!video) throw new Error("VIDEO_NOT_FOUND");

  const { data: unlocked } = await supabase.rpc("is_video_unlocked", {
    p_video_id: video.id,
  });

  if (!unlocked) {
    throw new Error("VIDEO_LOCKED");
  }

  const expiresIn = 300;
  const { data: signed, error: signError } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .createSignedUrl(video.video_url, expiresIn);

  if (signError || !signed?.signedUrl) {
    throw signError ?? new Error("SIGN_FAILED");
  }

  return { signed_url: signed.signedUrl, expires_in: expiresIn };
}
