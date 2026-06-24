import {
  MAX_VIDEO_BYTES,
  VIDEO_COMPRESS_TARGET_BYTES,
  VIDEO_COMPRESS_THRESHOLD_BYTES,
} from "@/lib/constants/media-limits";
import {
  fileFromRecordedBlob,
  getVideoFileDuration,
  pickRecorderMimeType,
  validateDuration,
} from "@/lib/utils/video-metadata";

export class VideoPrepareError extends Error {
  readonly code: "TOO_LONG" | "TOO_LARGE" | "COMPRESS_FAILED" | "INVALID";

  constructor(code: VideoPrepareError["code"], message?: string) {
    super(message ?? code);
    this.name = "VideoPrepareError";
    this.code = code;
  }
}

/** Validate duration and compress large videos before upload. */
export async function prepareVideoForUpload(
  file: File,
  durationSeconds?: number,
): Promise<{ file: File; durationSeconds: number }> {
  const duration = durationSeconds ?? (await getVideoFileDuration(file));
  const durationErr = validateDuration(duration);
  if (durationErr) {
    if (durationErr.includes("seconds")) {
      throw new VideoPrepareError("TOO_LONG", durationErr);
    }
    throw new VideoPrepareError("INVALID", durationErr);
  }

  let prepared = file;

  if (file.size > VIDEO_COMPRESS_THRESHOLD_BYTES) {
    prepared = await compressVideoToTarget(file, VIDEO_COMPRESS_TARGET_BYTES);
  } else if (file.size > 6 * 1024 * 1024) {
    try {
      const target = Math.min(
        Math.floor(file.size * 0.75),
        VIDEO_COMPRESS_TARGET_BYTES,
      );
      prepared = await compressVideoToTarget(file, target);
    } catch {
      prepared = file;
    }
  }

  if (prepared.size > MAX_VIDEO_BYTES) {
    throw new VideoPrepareError(
      "TOO_LARGE",
      "Video still too large after compression",
    );
  }

  return { file: prepared, durationSeconds: duration };
}

function getVideoCaptureStream(video: HTMLVideoElement): MediaStream | null {
  const el = video as HTMLVideoElement & {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
  };
  return el.captureStream?.() ?? el.mozCaptureStream?.() ?? null;
}

async function compressVideoToTarget(file: File, maxBytes: number): Promise<File> {
  if (typeof document === "undefined" || typeof MediaRecorder === "undefined") {
    if (file.size <= MAX_VIDEO_BYTES) return file;
    throw new VideoPrepareError("COMPRESS_FAILED");
  }

  const mimeType = pickRecorderMimeType();
  const video = document.createElement("video");
  video.playsInline = true;
  video.muted = true;

  const url = URL.createObjectURL(file);
  video.src = url;

  try {
    await waitForVideoMetadata(video);
    await waitForVideoCanPlay(video);

    const bitrates = [1_200_000, 900_000, 650_000, 450_000, 300_000];
    let smallest: File | null = null;

    for (const bitrate of bitrates) {
      const recorded = await transcodeVideoElement(video, mimeType, bitrate);
      if (!smallest || recorded.size < smallest.size) smallest = recorded;
      if (recorded.size <= maxBytes) return recorded;
      video.pause();
      video.currentTime = 0;
    }

    if (smallest && smallest.size <= MAX_VIDEO_BYTES) return smallest;
    throw new VideoPrepareError("COMPRESS_FAILED");
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
  }
}

async function transcodeVideoElement(
  source: HTMLVideoElement,
  mimeType: string,
  videoBitsPerSecond: number,
): Promise<File> {
  const stream = getVideoCaptureStream(source);
  if (!stream) throw new VideoPrepareError("COMPRESS_FAILED");

  return new Promise((resolve, reject) => {
    const chunks: Blob[] = [];
    let recorder: MediaRecorder;

    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond })
        : new MediaRecorder(stream, { videoBitsPerSecond });
    } catch {
      reject(new VideoPrepareError("COMPRESS_FAILED"));
      return;
    }

    const cleanup = () => {
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onerror = () => {
      cleanup();
      reject(new VideoPrepareError("COMPRESS_FAILED"));
    };

    recorder.onstop = () => {
      cleanup();
      const type = recorder.mimeType || mimeType || "video/webm";
      const blob = new Blob(chunks, { type });
      if (!blob.size) {
        reject(new VideoPrepareError("COMPRESS_FAILED"));
        return;
      }
      resolve(fileFromRecordedBlob(blob, type));
    };

    source.onended = () => {
      try {
        recorder.requestData();
      } catch {
        /* optional */
      }
      if (recorder.state === "recording") recorder.stop();
    };

    recorder.start(500);
    source.currentTime = 0;
    void source.play().catch(() => {
      cleanup();
      reject(new VideoPrepareError("COMPRESS_FAILED"));
    });
  });
}

function waitForVideoMetadata(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 1) {
      resolve();
      return;
    }
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new VideoPrepareError("INVALID"));
  });
}

function waitForVideoCanPlay(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 3) {
      resolve();
      return;
    }
    video.oncanplay = () => resolve();
    video.onerror = () => reject(new VideoPrepareError("INVALID"));
  });
}
