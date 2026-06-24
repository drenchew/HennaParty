import { pickRecorderMimeType } from "@/lib/utils/video-metadata";
import type RecordRTC from "recordrtc";

/** ~700 kbps keeps 30s recordings under ~15 MB. */
const RECORDING_BITS_PER_SECOND = 700_000;

const MIME_CANDIDATES = [
  "video/mp4",
  "video/mp4;codecs=avc1,mp4a.40.2",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

type RecordRTCClass = typeof RecordRTC;
type RecorderState = "inactive" | "recording" | "stopped" | "paused" | "unknown";

export interface BrowserVideoRecorder {
  startRecording(): void;
  stopRecording(callback: () => void): void;
  getState(): RecorderState;
  getBlob(): Blob;
  destroy(): void;
}

let recordRtcPromise: Promise<RecordRTCClass> | null = null;

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function loadRecordRTC(): Promise<RecordRTCClass> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("RecordRTC is only available in the browser"));
  }

  if (!recordRtcPromise) {
    recordRtcPromise = import("recordrtc").then((mod) => mod.default);
  }

  return recordRtcPromise;
}

/** Warm the RecordRTC chunk during the user's tap (before async camera work). */
export function preloadRecordRtcModule(): void {
  if (typeof window === "undefined") return;
  void loadRecordRTC().catch(() => {
    recordRtcPromise = null;
  });
}

function pickRecordRtcMimeType(RecordRTC: RecordRTCClass): string | undefined {
  const candidates = isIosSafari()
    ? ["video/mp4", "video/mp4;codecs=avc1,mp4a.40.2"]
    : MIME_CANDIDATES;

  for (const mime of candidates) {
    if (RecordRTC.isMimeTypeSupported(mime)) return mime;
  }

  return undefined;
}

function wrapRecordRtc(recorder: RecordRTC): BrowserVideoRecorder {
  return {
    startRecording: () => recorder.startRecording(),
    stopRecording: (callback) => recorder.stopRecording(callback),
    getState: () => recorder.getState(),
    getBlob: () => recorder.getBlob(),
    destroy: () => {
      try {
        recorder.destroy();
      } catch {
        // Already destroyed.
      }
    },
  };
}

function createMediaRecorderAdapter(stream: MediaStream): BrowserVideoRecorder {
  const mimeType = pickRecorderMimeType();
  const recorder = mimeType
    ? new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: RECORDING_BITS_PER_SECOND,
      })
    : new MediaRecorder(stream, { videoBitsPerSecond: RECORDING_BITS_PER_SECOND });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  return {
    startRecording: () => {
      if (recorder.state === "inactive") {
        recorder.start(1000);
      }
    },
    stopRecording: (callback) => {
      if (recorder.state === "inactive") {
        callback();
        return;
      }

      recorder.onstop = () => callback();

      try {
        recorder.requestData();
      } catch {
        // Optional on some browsers.
      }

      recorder.stop();
    },
    getState: () => {
      if (recorder.state === "recording") return "recording";
      if (recorder.state === "paused") return "paused";
      if (recorder.state === "inactive") return "inactive";
      return "unknown";
    },
    getBlob: () =>
      new Blob(chunks, {
        type: recorder.mimeType || mimeType || "video/webm",
      }),
    destroy: () => {
      // MediaRecorder has no destroy API.
    },
  };
}

async function tryCreateRecordRtcRecorder(
  stream: MediaStream,
): Promise<BrowserVideoRecorder | null> {
  try {
    const RecordRTC = await loadRecordRTC();
    const mimeType = pickRecordRtcMimeType(RecordRTC);
    const options: Record<string, unknown> = {
      type: "video",
      disableLogs: true,
      timeSlice: 1000,
      bitsPerSecond: RECORDING_BITS_PER_SECOND,
    };

    if (mimeType) {
      options.mimeType = mimeType;
    }

    return wrapRecordRtc(new RecordRTC(stream, options));
  } catch {
    recordRtcPromise = null;
    return null;
  }
}

/** Prefer RecordRTC, fall back to native MediaRecorder when needed. */
export async function createBrowserVideoRecorder(
  stream: MediaStream,
): Promise<BrowserVideoRecorder> {
  const recordRtc = await tryCreateRecordRtcRecorder(stream);
  if (recordRtc) return recordRtc;

  return createMediaRecorderAdapter(stream);
}
