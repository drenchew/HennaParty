import { findGuestByToken, upsertGuest } from "@/lib/guest/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildPhotoStoragePath,
  MAX_PHOTOS_PER_GUEST,
  PHOTOS_BUCKET,
  validatePhotoCount,
  validatePhotoFile,
} from "@/lib/photo/validation";
import { randomUUID } from "@/lib/utils/uuid";

export interface PhotoRecord {
  id: string;
  guest_id: string;
  url: string;
  created_at: string;
}

export interface PhotoWithUrl extends PhotoRecord {
  signed_url: string | null;
}

export async function countGuestPhotos(guestId: string): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("photos")
    .select("id", { count: "exact", head: true })
    .eq("guest_id", guestId);

  if (error) throw error;
  return count ?? 0;
}

export async function listPhotosForGuest(
  guestToken: string,
): Promise<PhotoWithUrl[]> {
  const guest = await findGuestByToken(guestToken);
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  const supabase = createAdminClient();
  const { data: photos, error } = await supabase
    .from("photos")
    .select("id, guest_id, url, created_at")
    .eq("guest_id", guest.id)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const withUrls = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data: signed } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .createSignedUrl(photo.url, 3600);
      return {
        ...photo,
        signed_url: signed?.signedUrl ?? null,
      } as PhotoWithUrl;
    }),
  );

  return withUrls;
}

export async function uploadPhotoForGuest(
  guestToken: string,
  file: File,
): Promise<PhotoRecord> {
  const validation = validatePhotoFile(file);
  if (!validation.ok) {
    throw new Error(`${validation.code}:${validation.message}`);
  }

  await upsertGuest(guestToken);
  const guest = await findGuestByToken(guestToken);
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  const currentCount = await countGuestPhotos(guest.id);
  const countCheck = validatePhotoCount(currentCount);
  if (!countCheck.ok) {
    throw new Error(`${countCheck.code}:${countCheck.message}`);
  }

  const supabase = createAdminClient();
  const photoId = randomUUID();
  const storagePath = buildPhotoStoragePath(guest.id, photoId, file.type);

  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
      cacheControl: "private, max-age=3600",
    });

  if (uploadError) throw uploadError;

  const { data: photo, error: insertError } = await supabase
    .from("photos")
    .insert({
      id: photoId,
      guest_id: guest.id,
      url: storagePath,
    })
    .select("id, guest_id, url, created_at")
    .single();

  if (insertError) {
    await supabase.storage.from(PHOTOS_BUCKET).remove([storagePath]);
    if (insertError.message.includes("PHOTO_LIMIT_REACHED")) {
      throw new Error("PHOTO_LIMIT_REACHED:Maximum 3 photos allowed");
    }
    throw insertError;
  }

  return photo as PhotoRecord;
}

export async function deletePhotoForGuest(
  guestToken: string,
  photoId: string,
): Promise<void> {
  const guest = await findGuestByToken(guestToken);
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  const supabase = createAdminClient();
  const { data: photo, error: fetchError } = await supabase
    .from("photos")
    .select("id, url, guest_id")
    .eq("id", photoId)
    .eq("guest_id", guest.id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!photo) throw new Error("PHOTO_NOT_FOUND");

  await supabase.storage.from(PHOTOS_BUCKET).remove([photo.url]);

  const { error: deleteError } = await supabase
    .from("photos")
    .delete()
    .eq("id", photoId);

  if (deleteError) throw deleteError;
}

export async function getPhotoUploadQuota(guestToken: string): Promise<{
  count: number;
  remaining: number;
  max: number;
}> {
  const guest = await findGuestByToken(guestToken);
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  const count = await countGuestPhotos(guest.id);
  return {
    count,
    remaining: Math.max(0, MAX_PHOTOS_PER_GUEST - count),
    max: MAX_PHOTOS_PER_GUEST,
  };
}
