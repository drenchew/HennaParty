declare module "recordrtc" {
  export interface RecordRTCOptions {
    type?: "video" | "audio" | "gif";
    mimeType?: string;
    disableLogs?: boolean;
    bitsPerSecond?: number;
    timeSlice?: number;
    recorderType?: unknown;
  }

  export default class RecordRTC {
    constructor(stream: MediaStream, options?: RecordRTCOptions);

    static isMimeTypeSupported(mimeType: string): boolean;

    startRecording(): void;
    stopRecording(callback?: () => void): void;
    pauseRecording(): void;
    resumeRecording(): void;
    getBlob(): Blob;
    getState(): "inactive" | "recording" | "stopped" | "paused" | "unknown";
    destroy(): void;
  }
}
