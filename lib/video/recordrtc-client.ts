import type RecordRTC from "recordrtc";

const MIME_CANDIDATES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4;codecs=avc1,mp4a.40.2",
  "video/mp4",
];

type RecordRTCClass = typeof RecordRTC;

let recordRtcPromise: Promise<RecordRTCClass> | null = null;

function loadRecordRTC(): Promise<RecordRTCClass> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("RecordRTC is only available in the browser"));
  }

  if (!recordRtcPromise) {
    recordRtcPromise = import("recordrtc").then((mod) => mod.default);
  }

  return recordRtcPromise;
}

function pickRecordRtcMimeType(RecordRTC: RecordRTCClass): string {
  for (const mime of MIME_CANDIDATES) {
    if (RecordRTC.isMimeTypeSupported(mime)) return mime;
  }
  return "video/webm";
}

export async function createVideoRecorder(stream: MediaStream): Promise<RecordRTC> {
  const RecordRTC = await loadRecordRTC();

  return new RecordRTC(stream, {
    type: "video",
    mimeType: pickRecordRtcMimeType(RecordRTC),
    disableLogs: true,
    timeSlice: 1000,
  });
}
