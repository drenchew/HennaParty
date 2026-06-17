import { MAX_PHOTOS_PER_GUEST, PHOTOS_BUCKET } from "@/lib/constants/steps";

export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export type AllowedPhotoMime = (typeof ALLOWED_PHOTO_MIME_TYPES)[number];

/** 5 MB — matches Supabase photos bucket file_size_limit */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export function isAllowedPhotoMime(type: string): boolean {
  return (ALLOWED_PHOTO_MIME_TYPES as readonly string[]).includes(type);
}

export function extensionForPhotoMime(mime: string): string {
  return MIME_EXTENSION[mime] ?? "webp";
}

export function validatePhotoFile(
  file: File,
): { ok: true } | { ok: false; code: string; message: string } {
  if (!file.size) {
    return { ok: false, code: "EMPTY_FILE", message: "Photo file is empty" };
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: "Photo must be under 5 MB after compression",
    };
  }

  if (!isAllowedPhotoMime(file.type)) {
    return {
      ok: false,
      code: "INVALID_MIME",
      message: "Unsupported image format. Use JPEG, PNG, or WebP.",
    };
  }

  return { ok: true };
}

export function validatePhotoCount(currentCount: number): {
  ok: true;
  remaining: number;
} | { ok: false; code: string; message: string } {
  if (currentCount >= MAX_PHOTOS_PER_GUEST) {
    return {
      ok: false,
      code: "PHOTO_LIMIT_REACHED",
      message: `Maximum ${MAX_PHOTOS_PER_GUEST} photos allowed`,
    };
  }

  return {
    ok: true,
    remaining: MAX_PHOTOS_PER_GUEST - currentCount,
  };
}

export function buildPhotoStoragePath(
  guestId: string,
  photoId: string,
  mime: string,
): string {
  return `${guestId}/${photoId}.${extensionForPhotoMime(mime)}`;
}

export { PHOTOS_BUCKET, MAX_PHOTOS_PER_GUEST };
