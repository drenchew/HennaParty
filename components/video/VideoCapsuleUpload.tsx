"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { MAX_VIDEO_DURATION_SECONDS } from "@/lib/constants/steps";
import { createVideoRecorder } from "@/lib/video/recordrtc-client";
import {
  fileFromRecordedBlob,
  formatDuration,
  getVideoFileDuration,
  validateDuration,
} from "@/lib/utils/video-metadata";
import type RecordRTC from "recordrtc";

export type VideoUploadMode = "choose" | "recording" | "processing" | "preview";

export interface VideoCapsuleUploadProps {
  onVideoReady: (file: File, durationSeconds: number) => void;
  onClear?: () => void;
  onModeChange?: (mode: VideoUploadMode) => void;
  disabled?: boolean;
}

export function VideoCapsuleUpload({
  onVideoReady,
  onClear,
  onModeChange,
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
  const recorderRef = useRef<RecordRTC | null>(null);
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
    const recorder = recorderRef.current;
    if (!recorder) return;
    try {
      recorder.destroy();
    } catch {
      // Already destroyed.
    }
    recorderRef.current = null;
  }, []);

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

  async function handleStartRecording() {
    if (disabled) return;
    setError(null);
    elapsedRef.current = 0;
    stoppingRef.current = false;

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
      setUploadMode("recording");
      setElapsed(0);

      const recorder = createVideoRecorder(stream);
      recorderRef.current = recorder;
      recorder.startRecording();

      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);

        if (elapsedRef.current >= MAX_VIDEO_DURATION_SECONDS) {
          handleStopRecording();
        }
      }, 1000);
    } catch {
      destroyRecorder();
      stopStream();
      setError(t("videoUpload.cameraError"));
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
          <p className="flow-video-hint">{t("videoUpload.recordingHint")}</p>
          <button
            type="button"
            className="flow-btn flow-btn--primary flow-video-stop-btn"
            onPointerDown={(event) => event.preventDefault()}
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
