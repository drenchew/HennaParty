"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { MAX_VIDEO_DURATION_SECONDS } from "@/lib/constants/steps";
import {
  createBrowserVideoRecorder,
  preloadRecordRtcModule,
  type BrowserVideoRecorder,
} from "@/lib/video/browser-recorder";
import { CameraAccessError, getCameraStream } from "@/lib/video/camera-stream";
import {
  fileFromRecordedBlob,
  formatDuration,
  getVideoFileDuration,
  validateDuration,
} from "@/lib/utils/video-metadata";

export type VideoUploadMode = "choose" | "recording" | "processing" | "preview";

export interface VideoCapsuleUploadProps {
  onVideoReady: (file: File, durationSeconds: number) => void;
  onClear?: () => void;
  onModeChange?: (mode: VideoUploadMode) => void;
  /** Parent renders Stop in a fixed footer — keeps it visible on small screens. */
  stopInFooter?: boolean;
  onStopActionChange?: (stop: (() => void) | null) => void;
  disabled?: boolean;
}

export function VideoCapsuleUpload({
  onVideoReady,
  onClear,
  onModeChange,
  stopInFooter = false,
  onStopActionChange,
  disabled,
}: VideoCapsuleUploadProps) {
  const { t } = useLocale();
  const [mode, setMode] = useState<VideoUploadMode>("choose");
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<BrowserVideoRecorder | null>(null);
  const stoppingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const previewUrlRef = useRef<string | null>(null);

  const setUploadMode = useCallback(
    (next: VideoUploadMode) => {
      setMode(next);
      onModeChange?.(next);
    },
    [onModeChange],
  );

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const revokePreviewUrl = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  const destroyRecorder = useCallback(() => {
    recorderRef.current?.destroy();
    recorderRef.current = null;
  }, []);

  const cameraErrorMessage = useCallback(
    (cause: unknown) => {
      if (cause instanceof CameraAccessError) {
        switch (cause.code) {
          case "NOT_ALLOWED":
            return t("videoUpload.cameraPermissionDenied");
          case "NOT_FOUND":
            return t("videoUpload.cameraNotFound");
          case "INSECURE_CONTEXT":
            return t("videoUpload.cameraInsecure");
          case "NO_CAMERA_API":
          case "UNKNOWN":
          default:
            return t("videoUpload.cameraUnavailable");
        }
      }

      return t("videoUpload.cameraUnavailable");
    },
    [t],
  );

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      clearTimer();
      destroyRecorder();
      stopStream();
      revokePreviewUrl(previewUrlRef.current);
    };
  }, [clearTimer, destroyRecorder, stopStream, revokePreviewUrl]);

  useEffect(() => {
    if (mode !== "recording") return;

    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    void video.play().catch(() => {
      // Autoplay can fail on some browsers even when recording works.
    });

    return () => {
      video.srcObject = null;
    };
  }, [mode]);

  function translateDurationError(message: string | null): string | null {
    if (!message) return null;
    if (message.includes("seconds or less")) {
      return t("videoUpload.tooLong", { max: MAX_VIDEO_DURATION_SECONDS });
    }
    if (message.includes("Invalid")) {
      return t("videoUpload.invalidDuration");
    }
    return message;
  }

  function setReadyFile(file: File, durationSeconds: number) {
    const validationError = translateDurationError(validateDuration(durationSeconds));
    if (validationError) {
      setError(validationError);
      setUploadMode("choose");
      return;
    }

    revokePreviewUrl(previewUrlRef.current);
    const url = URL.createObjectURL(file);

    setDuration(durationSeconds);
    setFileName(file.name);
    setPreviewUrl(url);
    setUploadMode("preview");
    setError(null);
    onVideoReady(file, durationSeconds);
  }

  const handleStopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || stoppingRef.current) return;

    const state = recorder.getState();
    if (state !== "recording" && state !== "paused") return;

    stoppingRef.current = true;
    clearTimer();
    setUploadMode("processing");
    setError(null);

    recorder.stopRecording(() => {
      const blob = recorder.getBlob();
      destroyRecorder();
      stopStream();
      stoppingRef.current = false;

      if (!blob || blob.size === 0) {
        setError(t("videoUpload.recordTooShort"));
        setUploadMode("choose");
        return;
      }

      const mime = blob.type || "video/webm";
      const file = fileFromRecordedBlob(blob, mime);
      const recordedDuration = Math.max(1, elapsedRef.current);
      setReadyFile(file, recordedDuration);
    });
  }, [clearTimer, destroyRecorder, setUploadMode, stopStream, t]);

  useLayoutEffect(() => {
    if (!stopInFooter) {
      onStopActionChange?.(null);
      return;
    }

    if (mode === "recording") {
      onStopActionChange?.(handleStopRecording);
      return () => onStopActionChange?.(null);
    }

    onStopActionChange?.(null);
  }, [mode, stopInFooter, handleStopRecording, onStopActionChange]);

  async function handleStartRecording() {
    if (disabled) return;
    setError(null);
    elapsedRef.current = 0;
    stoppingRef.current = false;

    try {
      const stream = await getCameraStream();
      streamRef.current = stream;

      const recorder = await createBrowserVideoRecorder(stream);
      recorderRef.current = recorder;
      recorder.startRecording();

      setUploadMode("recording");
      setElapsed(0);

      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);

        if (elapsedRef.current >= MAX_VIDEO_DURATION_SECONDS) {
          handleStopRecording();
        }
      }, 1000);
    } catch (cause) {
      clearTimer();
      destroyRecorder();
      stopStream();
      setError(cameraErrorMessage(cause));
      setUploadMode("choose");
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || disabled) return;

    setError(null);
    setUploadMode("processing");

    try {
      const metadataDuration = await getVideoFileDuration(file);
      setReadyFile(file, metadataDuration);
    } catch {
      setError(t("videoUpload.readError"));
      setUploadMode("choose");
    }
  }

  function handleRetake() {
    revokePreviewUrl(previewUrlRef.current);
    setPreviewUrl(null);
    setUploadMode("choose");
    setDuration(0);
    setElapsed(0);
    elapsedRef.current = 0;
    setFileName(null);
    setError(null);
    onClear?.();
  }

  const remaining = MAX_VIDEO_DURATION_SECONDS - elapsed;

  return (
    <div className={`flow-stack flow-video-upload${mode === "recording" ? " flow-video-upload--recording" : ""}`}>
      {mode === "choose" && (
        <>
          <button
            type="button"
            className="flow-btn flow-btn--primary"
            onPointerDown={() => preloadRecordRtcModule()}
            onClick={() => void handleStartRecording()}
            disabled={disabled}
          >
            {t("videoUpload.record")}
          </button>
          <label className="flow-upload">
            <span>{t("videoUpload.upload", { max: MAX_VIDEO_DURATION_SECONDS })}</span>
            <input
              type="file"
              accept="video/webm,video/mp4,video/quicktime,video/*"
              disabled={disabled}
              onChange={(e) => void handleFileChange(e)}
            />
          </label>
        </>
      )}

      {mode === "recording" && (
        <div className="flow-video-recorder flow-video-recorder--live">
          <video
            ref={videoRef}
            className="flow-video-preview flow-video-preview--live"
            muted
            playsInline
            autoPlay
          />
          <div className="flow-video-timer" data-warning={remaining <= 10}>
            {formatDuration(elapsed)} / {formatDuration(MAX_VIDEO_DURATION_SECONDS)}
          </div>
          <p className="flow-video-hint">
            {stopInFooter ? t("videoUpload.recordingFooterHint") : t("videoUpload.recordingHint")}
          </p>
          {!stopInFooter ? (
            <button
              type="button"
              className="flow-btn flow-btn--primary flow-video-stop-btn"
              onPointerDown={(event) => event.preventDefault()}
              onClick={handleStopRecording}
            >
              {t("videoUpload.stop")}
            </button>
          ) : null}
        </div>
      )}

      {mode === "processing" && (
        <div className="flow-video-recorder flow-video-processing">
          <p className="flow-loading">{t("videoUpload.processing")}</p>
        </div>
      )}

      {mode === "preview" && previewUrl && (
        <div className="flow-video-recorder">
          <video src={previewUrl} className="flow-video-preview" controls playsInline />
          <p className="flow-success">
            {t("videoUpload.ready")}: <strong>{fileName}</strong> ({formatDuration(duration)})
          </p>
          {!disabled && (
            <button type="button" className="flow-btn flow-btn--secondary" onClick={handleRetake}>
              {t("videoUpload.retake")}
            </button>
          )}
        </div>
      )}

      {error && <p className="flow-error">{error}</p>}
    </div>
  );
}
