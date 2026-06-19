import { findGuestByToken, upsertGuest } from "@/lib/guest/server";
import { requireGuestHijabiPreference } from "@/lib/guest/preference";
import { photosBucketForHijabi } from "@/lib/media/buckets";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildPhotoStoragePath,
  MAX_PHOTOS_PER_GUEST,
  validatePhotoCount,
  validatePhotoFile,
  validatePhotoMeta,
  isAllowedPhotoMime,
} from "@/lib/photo/validation";
import {
  assertStorageObjectExists,
  createDirectUploadTarget,
  removeStorageObject,
  type DirectUploadTarget,
} from "@/lib/storage/direct-upload";
import { randomUUID } from "@/lib/utils/uuid";

export interface PhotoUploadPrepareResult extends DirectUploadTarget {
  photoId: string;
  contentType: string;
}

export interface PhotoRecord {
  id: string;
  guest_id: string;
  url: string;
  created_at: string;
  is_hijabi: boolean;
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
  requireGuestHijabiPreference(guest);

  const supabase = createAdminClient();
  const { data: photos, error } = await supabase
    .from("photos")
    .select("id, guest_id, url, created_at, is_hijabi")
    .eq("guest_id", guest.id)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const withUrls = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const bucket = photosBucketForHijabi(photo.is_hijabi);
      const { data: signed } = await supabase.storage
        .from(bucket)
        .createSignedUrl(photo.url, 3600);
      return {
        ...photo,
        signed_url: signed?.signedUrl ?? null,
      } as PhotoWithUrl;
    }),
  );

  return withUrls;
}

export async function preparePhotoUploadForGuest(
  guestToken: string,
  input: { mimeType: string; size: number },
): Promise<PhotoUploadPrepareResult> {
  const validation = validatePhotoMeta(input.mimeType, input.size);
  if (!validation.ok) {
    throw new Error(`${validation.code}:${validation.message}`);
  }

  await upsertGuest(guestToken);
  const guest = await findGuestByToken(guestToken);
  if (!guest) throw new Error("GUEST_NOT_FOUND");
  requireGuestHijabiPreference(guest);

  const currentCount = await countGuestPhotos(guest.id);
  const countCheck = validatePhotoCount(currentCount);
  if (!countCheck.ok) {
    throw new Error(`${countCheck.code}:${countCheck.message}`);
  }

  const isHijabi = guest.hijabi;
  const bucket = photosBucketForHijabi(isHijabi);
  const photoId = randomUUID();
  const storagePath = buildPhotoStoragePath(guest.id, photoId, input.mimeType);
  const target = await createDirectUploadTarget(bucket, storagePath);

  return {
    ...target,
    photoId,
    contentType: input.mimeType,
  };
}

export async function completePhotoUploadForGuest(
  guestToken: string,
  photoId: string,
  mimeType: string,
): Promise<PhotoRecord> {
  if (!isAllowedPhotoMime(mimeType)) {
    throw new Error("INVALID_MIME:Unsupported image format. Use JPEG, PNG, or WebP.");
  }

  await upsertGuest(guestToken);
  const guest = await findGuestByToken(guestToken);
  if (!guest) throw new Error("GUEST_NOT_FOUND");
  requireGuestHijabiPreference(guest);

  const currentCount = await countGuestPhotos(guest.id);
  const countCheck = validatePhotoCount(currentCount);
  if (!countCheck.ok) {
    throw new Error(`${countCheck.code}:${countCheck.message}`);
  }

  const isHijabi = guest.hijabi;
  const bucket = photosBucketForHijabi(isHijabi);
  const storagePath = buildPhotoStoragePath(guest.id, photoId, mimeType);

  await assertStorageObjectExists(bucket, storagePath);

  const supabase = createAdminClient();
  const { data: photo, error: insertError } = await supabase
    .from("photos")
    .insert({
      id: photoId,
      guest_id: guest.id,
      url: storagePath,
      is_hijabi: isHijabi,
    })
    .select("id, guest_id, url, created_at, is_hijabi")
    .single();

  if (insertError) {
    if (insertError.message.includes("PHOTO_LIMIT_REACHED")) {
      throw new Error("PHOTO_LIMIT_REACHED:Maximum 3 photos allowed");
    }
    throw insertError;
  }

  return photo as PhotoRecord;
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
  requireGuestHijabiPreference(guest);

  const currentCount = await countGuestPhotos(guest.id);
  const countCheck = validatePhotoCount(currentCount);
  if (!countCheck.ok) {
    throw new Error(`${countCheck.code}:${countCheck.message}`);
  }

  const isHijabi = guest.hijabi;
  const bucket = photosBucketForHijabi(isHijabi);
  const supabase = createAdminClient();
  const photoId = randomUUID();
  const storagePath = buildPhotoStoragePath(guest.id, photoId, file.type);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
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
      is_hijabi: isHijabi,
    })
    .select("id, guest_id, url, created_at, is_hijabi")
    .single();

  if (insertError) {
    await supabase.storage.from(bucket).remove([storagePath]);
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
    .select("id, url, guest_id, is_hijabi")
    .eq("id", photoId)
    .eq("guest_id", guest.id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!photo) throw new Error("PHOTO_NOT_FOUND");

  const bucket = photosBucketForHijabi(photo.is_hijabi);
  await supabase.storage.from(bucket).remove([photo.url]);

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
