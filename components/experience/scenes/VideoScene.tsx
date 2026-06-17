"use client";

import { useCallback, useEffect, useState } from "react";
import { ExperienceNav } from "@/components/experience/ExperienceNav";
import { useExperienceContext } from "@/components/experience/ExperienceProvider";
import { SceneShell } from "@/components/experience/SceneShell";
import { OrnamentalCard } from "@/components/ornamental";
import { VideoCapsuleUpload } from "@/components/video/VideoCapsuleUpload";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { isApiError } from "@/lib/utils/api";
import { formatUnlockDate } from "@/lib/utils/video-metadata";
import { completeStep } from "@/services/mock/flow.service";
import { getVideoStatus, uploadVideo } from "@/services/video.service";
import type { SafeVideo } from "@/services/video.service";

export function VideoScene() {
  const { refresh } = useFlowContext();
  const { nextStep, prevStep, setTransitionLocked } = useExperienceContext();
  const [uploaded, setUploaded] = useState<SafeVideo | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingDuration, setPendingDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    const status = await getVideoStatus();
    if (isApiError(status)) {
      setError(status.error);
      setLoading(false);
      return;
    }

    if (status.data.uploaded && status.data.video) {
      setUploaded(status.data.video);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    setTransitionLocked(uploading);
    return () => setTransitionLocked(false);
  }, [uploading, setTransitionLocked]);

  function handleVideoReady(file: File, durationSeconds: number) {
    setPendingFile(file);
    setPendingDuration(durationSeconds);
    setError(null);
  }

  function handleClear() {
    setPendingFile(null);
    setPendingDuration(0);
  }

  async function handleContinue() {
    if (uploaded) {
      completeStep("video");
      refresh();
      nextStep();
      return true;
    }

    if (!pendingFile) {
      setError("Please record or upload a video first.");
      return false;
    }

    setUploading(true);
    setError(null);

    const result = await uploadVideo(pendingFile, pendingDuration);
    if (isApiError(result)) {
      setError(result.error);
      setUploading(false);
      return false;
    }

    setUploaded(result.data.video);
    completeStep("video", {
      video: { recorded: true, fileName: pendingFile.name },
    });
    refresh();
    setUploading(false);
    nextStep();
    return true;
  }

  return (
    <SceneShell
      step="video"
      title="Video Time Capsule"
      subtitle="Record or upload a short message (max 60 seconds). It will be locked for one year."
      footer={
        !loading ? (
          <ExperienceNav
            onBack={prevStep}
            continueLabel={
              uploading ? "Uploading…" : uploaded ? "Continue" : "Save & Continue"
            }
            onContinue={handleContinue}
            continueDisabled={uploading || (!uploaded && !pendingFile)}
          />
        ) : null
      }
    >
      {loading && <p className="experience-loading">Checking time capsule status…</p>}

      {!loading && uploaded && (
        <OrnamentalCard>
          <div className="experience-stack">
            <p className="experience-success">✓ Your time capsule has been saved securely.</p>
            <p className="experience-meta">
              Unlocks on <strong>{formatUnlockDate(uploaded.unlock_date)}</strong>
            </p>
            <p className="experience-meta">
              Your video cannot be viewed until then — not even by you. This is by design.
            </p>
          </div>
        </OrnamentalCard>
      )}

      {!loading && !uploaded && (
        <OrnamentalCard>
          <VideoCapsuleUpload
            onVideoReady={handleVideoReady}
            onClear={handleClear}
            disabled={uploading}
          />
        </OrnamentalCard>
      )}

      {error && <p className="experience-error">{error}</p>}
    </SceneShell>
  );
}
