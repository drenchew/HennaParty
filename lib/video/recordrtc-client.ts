import RecordRTC from "recordrtc";

const MIME_CANDIDATES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4;codecs=avc1,mp4a.40.2",
  "video/mp4",
];

export function pickRecordRtcMimeType(): string {
  for (const mime of MIME_CANDIDATES) {
    if (RecordRTC.isMimeTypeSupported(mime)) return mime;
  }
  return "video/webm";
}

export function createVideoRecorder(stream: MediaStream): RecordRTC {
  return new RecordRTC(stream, {
    type: "video",
    mimeType: pickRecordRtcMimeType(),
    disableLogs: true,
    timeSlice: 1000,
  });
}
