import { MAX_VIDEO_DURATION_SECONDS, VIDEOS_BUCKET } from "@/lib/constants/steps";

export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/webm",
  "video/mp4",
  "video/quicktime",
] as const;

export type AllowedVideoMime = (typeof ALLOWED_VIDEO_MIME_TYPES)[number];

/** 25 MB — matches Supabase bucket file_size_limit */
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

const MIME_EXTENSION: Record<AllowedVideoMime, string> = {
  "video/webm": "webm",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

export function isAllowedVideoMime(type: string): type is AllowedVideoMime {
  return (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(type);
}

/** Strip codec suffixes and map browser-specific types to a storage MIME. */
export function normalizeVideoMime(
  type: string,
  fileName?: string,
): AllowedVideoMime | null {
  const base = type.split(";")[0]?.trim().toLowerCase() ?? "";

  if (isAllowedVideoMime(base)) return base;
  if (base.startsWith("video/webm")) return "video/webm";
  if (base.startsWith("video/mp4")) return "video/mp4";

  if (fileName) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "mp4" || ext === "m4v") return "video/mp4";
    if (ext === "mov") return "video/quicktime";
    if (ext === "webm") return "video/webm";
  }

  return null;
}

export function resolveVideoMime(file: File): AllowedVideoMime | null {
  return normalizeVideoMime(file.type, file.name);
}

export function extensionForMime(mime: string): string {
  if (isAllowedVideoMime(mime)) return MIME_EXTENSION[mime];
  return "webm";
}

export function validateVideoUpload(input: {
  file: File;
  durationSeconds: number;
}): { ok: true } | { ok: false; code: string; message: string } {
  return validateVideoMeta({
    mimeType: input.file.type,
    size: input.file.size,
    durationSeconds: input.durationSeconds,
    fileName: input.file.name,
  });
}

export function validateVideoMeta(input: {
  mimeType: string;
  size: number;
  durationSeconds: number;
  fileName?: string;
}): { ok: true } | { ok: false; code: string; message: string } {
  const { size, durationSeconds, fileName } = input;
  const mime = resolveVideoMime({ type: input.mimeType, name: fileName ?? "" } as File);

  if (!size) {
    return { ok: false, code: "EMPTY_FILE", message: "Video file is empty" };
  }

  if (size > MAX_VIDEO_BYTES) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: "Video must be under 25 MB",
    };
  }

  if (!mime) {
    return {
      ok: false,
      code: "INVALID_MIME",
      message: "Unsupported video format. Use WebM, MP4, or MOV.",
    };
  }

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return {
      ok: false,
      code: "INVALID_DURATION",
      message: "Invalid video duration",
    };
  }

  if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
    return {
      ok: false,
      code: "VIDEO_TOO_LONG",
      message: `Video must be ${MAX_VIDEO_DURATION_SECONDS} seconds or less`,
    };
  }

  return { ok: true };
}

export function computeUnlockDate(from: Date = new Date()): Date {
  const unlock = new Date(from);
  unlock.setFullYear(unlock.getFullYear() + 1);
  return unlock;
}

export function buildVideoStoragePath(
  guestId: string,
  videoId: string,
  mime: string,
): string {
  return `${guestId}/${videoId}.${extensionForMime(mime)}`;
}

export function isVideoLocked(unlockDate: string | Date, now = new Date()): boolean {
  return now < new Date(unlockDate);
}
