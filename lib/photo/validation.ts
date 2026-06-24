import { MAX_PHOTO_BYTES } from "@/lib/constants/media-limits";
import { MAX_PHOTOS_PER_GUEST, PHOTOS_BUCKET } from "@/lib/constants/steps";

export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export type AllowedPhotoMime = (typeof ALLOWED_PHOTO_MIME_TYPES)[number];

/** 5 MB — Supabase photos bucket limit */
export { MAX_PHOTO_BYTES };

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
  return validatePhotoMeta(file.type, file.size);
}

export function validatePhotoMeta(
  mimeType: string,
  size: number,
): { ok: true } | { ok: false; code: string; message: string } {
  if (!size) {
    return { ok: false, code: "EMPTY_FILE", message: "Photo file is empty" };
  }

  if (size > MAX_PHOTO_BYTES) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: "Photo must be under 5 MB",
    };
  }

  if (!isAllowedPhotoMime(mimeType)) {
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
