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

export function extensionForMime(mime: string): string {
  if (isAllowedVideoMime(mime)) return MIME_EXTENSION[mime];
  return "webm";
}

export function validateVideoUpload(input: {
  file: File;
  durationSeconds: number;
}): { ok: true } | { ok: false; code: string; message: string } {
  const { file, durationSeconds } = input;

  if (!file.size) {
    return { ok: false, code: "EMPTY_FILE", message: "Video file is empty" };
  }

  if (file.size > MAX_VIDEO_BYTES) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: "Video must be under 25 MB",
    };
  }

  if (!isAllowedVideoMime(file.type)) {
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
