"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FlowLayout } from "@/components/layout/FlowLayout";
import { FlowNav } from "@/components/layout/FlowNavigation";
import { StepGuard } from "@/components/layout/StepGuard";
import { VideoCapsuleUpload } from "@/components/video/VideoCapsuleUpload";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { STEP_ROUTES } from "@/lib/constants/steps";
import { isApiError } from "@/lib/utils/api";
import { formatUnlockDate } from "@/lib/utils/video-metadata";
import { completeStep } from "@/services/mock/flow.service";
import { getVideoStatus, uploadVideo } from "@/services/video.service";
import type { SafeVideo } from "@/services/video.service";

export function VideoPage() {
  const { refresh, nextRoute } = useFlowContext();
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

  function handleVideoReady(file: File, durationSeconds: number) {
    setPendingFile(file);
    setPendingDuration(durationSeconds);
    setError(null);
  }

  function handleClear() {
    setPendingFile(null);
    setPendingDuration(0);
  }

  async function handleContinue(): Promise<boolean> {
    if (uploaded) {
      completeStep("video");
      refresh();
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
    return true;
  }

  return (
    <StepGuard step="video">
      <FlowLayout
        step="video"
        title="Video Time Capsule"
        subtitle="Record or upload a short message (max 60 seconds). It will be locked for one year."
        footer={
          !loading && (
            <FlowNav
              backHref={STEP_ROUTES.dua}
              nextLabel={
                uploading
                  ? "Uploading…"
                  : uploaded
                    ? "Continue"
                    : "Save & Continue"
              }
              onNext={handleContinue}
              nextHref={nextRoute("video")}
              nextDisabled={uploading || (!uploaded && !pendingFile)}
            />
          )
        }
      >
        {loading && <p className="flow-loading">Checking time capsule status…</p>}

        {!loading && uploaded && (
          <div className="flow-card flow-stack">
            <p className="flow-success">✓ Your time capsule has been saved securely.</p>
            <p className="flow-meta">
              Unlocks on <strong>{formatUnlockDate(uploaded.unlock_date)}</strong>
            </p>
            <p className="flow-meta">
              Your video cannot be viewed until then — not even by you. This is by design.
            </p>
          </div>
        )}

        {!loading && !uploaded && (
          <div className="flow-card">
            <VideoCapsuleUpload
              onVideoReady={handleVideoReady}
              onClear={handleClear}
              disabled={uploading}
            />
          </div>
        )}

        {error && <p className="flow-error">{error}</p>}
      </FlowLayout>
    </StepGuard>
  );
}
