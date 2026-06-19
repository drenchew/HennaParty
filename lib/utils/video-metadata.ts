import { MAX_VIDEO_DURATION_SECONDS } from "@/lib/constants/steps";
import { normalizeVideoMime } from "@/lib/video/validation";

/** Measure duration of a local video file via browser metadata. */
export function getVideoFileDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (!Number.isFinite(video.duration)) {
        reject(new Error("Could not read video duration"));
        return;
      }
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load video file"));
    };

    video.src = url;
  });
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatUnlockDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
  }).format(new Date(iso));
}

export function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";

  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
  ];

  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }

  return "";
}

export function mimeToExtension(mimeType: string): "webm" | "mp4" {
  const normalized = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (normalized.includes("mp4")) return "mp4";
  return "webm";
}

export function fileFromRecordedBlob(blob: Blob, mimeType: string): File {
  const ext = mimeToExtension(mimeType);
  const normalized =
    normalizeVideoMime(mimeType, `recording.${ext}`) ?? (ext === "mp4" ? "video/mp4" : "video/webm");
  return new File([blob], `time-capsule.${ext}`, { type: normalized });
}

export function validateDuration(duration: number): string | null {
  if (duration <= 0) return "Invalid video duration";
  if (duration > MAX_VIDEO_DURATION_SECONDS) {
    return `Video must be ${MAX_VIDEO_DURATION_SECONDS} seconds or less`;
  }
  return null;
}
