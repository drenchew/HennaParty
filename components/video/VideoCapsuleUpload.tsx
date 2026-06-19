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
  disabled?: boolean;
}

type Mode = "choose" | "recording" | "preview";

export function VideoCapsuleUpload({
  onVideoReady,
  onClear,
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

  const revokePreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
      revokePreview();
    };
  }, [clearTimer, stopStream, revokePreview]);

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
      return;
    }

    setDuration(durationSeconds);
    setFileName(file.name);
    revokePreview();
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setMode("preview");
    setError(null);
    onVideoReady(file, durationSeconds);
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

        const recordedMime = recorder.mimeType || mimeType || "video/webm";
        const blob = new Blob(chunksRef.current, { type: recordedMime });
        const file = fileFromRecordedBlob(blob, recordedMime);

        void getVideoFileDuration(file)
          .then((d) => setReadyFile(file, d))
          .catch(() => setReadyFile(file, elapsedRef.current || 1));
      };

      recorder.start(500);

      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);

        if (elapsedRef.current >= MAX_VIDEO_DURATION_SECONDS) {
          recorderRef.current?.stop();
        }
      }, 1000);
    } catch {
      setError(t("videoUpload.cameraError"));
      stopStream();
      setMode("choose");
    }
  }

  function handleStopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || disabled) return;

    setError(null);
    try {
      const d = await getVideoFileDuration(file);
      setReadyFile(file, d);
    } catch {
      setError(t("videoUpload.readError"));
    }
  }

  function handleRetake() {
    revokePreview();
    setMode("choose");
    setDuration(0);
    setElapsed(0);
    elapsedRef.current = 0;
    setFileName(null);
    setError(null);
    onClear?.();
  }

  const remaining = MAX_VIDEO_DURATION_SECONDS - elapsed;

  return (
    <div className="flow-stack">
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
          <button
            type="button"
            className="flow-btn flow-btn--secondary"
            onClick={handleStopRecording}
          >
            {t("videoUpload.stop")}
          </button>
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
