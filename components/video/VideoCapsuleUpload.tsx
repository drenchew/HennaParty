"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { MAX_VIDEO_DURATION_SECONDS } from "@/lib/constants/steps";
import {
  fileFromRecordedBlob,
  formatDuration,
  getVideoFileDuration,
  pickRecorderMimeType,
  validateDuration,
} from "@/lib/utils/video-metadata";

export interface VideoCapsuleUploadProps {
  onVideoReady: (file: File, durationSeconds: number) => void;
  onClear?: () => void;
  onConfirm?: () => void | Promise<void>;
  confirmLabel?: string;
  confirming?: boolean;
  disabled?: boolean;
}

type Mode = "choose" | "recording" | "processing" | "preview";

export function VideoCapsuleUpload({
  onVideoReady,
  onClear,
  onConfirm,
  confirmLabel,
  confirming = false,
  disabled,
}: VideoCapsuleUploadProps) {
  const { t } = useLocale();
  const [mode, setMode] = useState<Mode>("choose");
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const previewUrlRef = useRef<string | null>(null);

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

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
      revokePreviewUrl(previewUrlRef.current);
    };
  }, [clearTimer, stopStream, revokePreviewUrl]);

  /** Attach camera stream after the <video> element mounts (mode === recording). */
  useEffect(() => {
    if (mode !== "recording") return;

    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    void video.play().catch(() => {
      setError(t("videoUpload.cameraError"));
    });

    return () => {
      video.srcObject = null;
    };
  }, [mode, t]);

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
      setMode("choose");
      return;
    }

    revokePreviewUrl(previewUrlRef.current);
    const url = URL.createObjectURL(file);

    setDuration(durationSeconds);
    setFileName(file.name);
    setPreviewUrl(url);
    setMode("preview");
    setError(null);
    onVideoReady(file, durationSeconds);
  }

  function finalizeRecording() {
    const recorder = recorderRef.current;
    const recordedMime = recorder?.mimeType || pickRecorderMimeType() || "video/webm";
    const blob = new Blob(chunksRef.current, { type: recordedMime });

    if (blob.size === 0) {
      setError(t("videoUpload.recordTooShort"));
      setMode("choose");
      return;
    }

    const file = fileFromRecordedBlob(blob, recordedMime);
    const recordedDuration = Math.max(1, elapsedRef.current);
    setReadyFile(file, recordedDuration);
  }

  async function handleStartRecording() {
    if (disabled) return;
    setError(null);
    chunksRef.current = [];
    elapsedRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      streamRef.current = stream;
      setMode("recording");
      setElapsed(0);

      const mimeType = pickRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        clearTimer();
        stopStream();
        window.setTimeout(() => finalizeRecording(), 150);
      };

      recorder.onerror = () => {
        clearTimer();
        stopStream();
        setError(t("videoUpload.cameraError"));
        setMode("choose");
      };

      recorder.start(250);

      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);

        if (elapsedRef.current >= MAX_VIDEO_DURATION_SECONDS) {
          handleStopRecording();
        }
      }, 1000);
    } catch {
      setError(t("videoUpload.cameraError"));
      stopStream();
      setMode("choose");
    }
  }

  function handleStopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    setMode("processing");
    setError(null);

    try {
      recorder.requestData();
    } catch {
      // Some browsers omit requestData — stop still works with timeslice blobs.
    }

    recorder.stop();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || disabled) return;

    setError(null);
    setMode("processing");

    try {
      const metadataDuration = await getVideoFileDuration(file);
      setReadyFile(file, metadataDuration);
    } catch {
      setError(t("videoUpload.readError"));
      setMode("choose");
    }
  }

  function handleRetake() {
    revokePreviewUrl(previewUrlRef.current);
    setPreviewUrl(null);
    setMode("choose");
    setDuration(0);
    setElapsed(0);
    elapsedRef.current = 0;
    setFileName(null);
    setError(null);
    onClear?.();
  }

  const remaining = MAX_VIDEO_DURATION_SECONDS - elapsed;
  const showSaveButton = mode === "preview" && Boolean(onConfirm && confirmLabel);

  return (
    <div className="flow-stack flow-video-upload">
      {mode === "choose" && (
        <>
          <button
            type="button"
            className="flow-btn flow-btn--primary"
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
        <div className="flow-video-recorder">
          <video
            ref={videoRef}
            className="flow-video-preview"
            muted
            playsInline
            autoPlay
          />
          <div className="flow-video-timer" data-warning={remaining <= 10}>
            {formatDuration(elapsed)} / {formatDuration(MAX_VIDEO_DURATION_SECONDS)}
          </div>
          <p className="flow-video-hint">{t("videoUpload.recordingHint")}</p>
          <button
            type="button"
            className="flow-btn flow-btn--primary flow-video-stop-btn"
            onClick={handleStopRecording}
          >
            {t("videoUpload.stop")}
          </button>
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
          {showSaveButton ? (
            <button
              type="button"
              className="flow-btn flow-btn--primary flow-video-save-btn"
              disabled={disabled || confirming}
              onClick={() => void onConfirm?.()}
            >
              {confirmLabel}
            </button>
          ) : null}
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
