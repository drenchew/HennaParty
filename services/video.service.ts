import { getOrCreateGuestToken, guestAuthHeaders } from "@/lib/guest/session";
import { uploadFileViaSignedUrl } from "@/lib/storage/client-upload";
import {
  prepareVideoForUpload,
  VideoPrepareError,
} from "@/lib/utils/video-compress";
import type { ApiResponse } from "@/types";
async function guestJsonFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...guestAuthHeaders(getOrCreateGuestToken()),
      ...(options.headers ?? {}),
    },
  });
  return (await response.json()) as ApiResponse<T>;
}

export interface SafeVideo {
  id: string;
  unlock_date: string;
  created_at: string;
  locked: boolean;
}

export interface VideoStatus {
  uploaded: boolean;
  unlock_date: string | null;
  locked: boolean;
  video: SafeVideo | null;
}

/** GET /api/video/status */
export async function getVideoStatus() {
  const token = getOrCreateGuestToken();
  const response = await fetch("/api/video/status", {
    headers: { "X-Guest-Token": token },
  });
  return (await response.json()) as ApiResponse<VideoStatus>;
}

/** Direct-to-Supabase video upload (bypasses Vercel body limit). */
export async function uploadVideo(file: File, durationSeconds: number) {
  let preparedFile = file;
  let preparedDuration = durationSeconds;

  try {
    const prepared = await prepareVideoForUpload(file, durationSeconds);
    preparedFile = prepared.file;
    preparedDuration = prepared.durationSeconds;
  } catch (error) {
    if (error instanceof VideoPrepareError) {
      const code =
        error.code === "TOO_LONG"
          ? "VIDEO_TOO_LONG"
          : error.code === "TOO_LARGE"
            ? "FILE_TOO_LARGE"
            : error.code === "COMPRESS_FAILED"
              ? "COMPRESS_FAILED"
              : "INVALID_DURATION";
      return { error: error.message, code };
    }
    throw error;
  }

  const prepare = await guestJsonFetch<{
    upload: {
      bucket: string;
      path: string;
      token: string;
      signedUrl: string;
      videoId: string;
      contentType: string;
    };
  }>("/api/video/upload/prepare", {
    method: "POST",
    body: JSON.stringify({
      mimeType: preparedFile.type,
      size: preparedFile.size,
      durationSeconds: preparedDuration,
      fileName: preparedFile.name,
    }),
  });

  if ("error" in prepare) return prepare;

  const { bucket, path, token, videoId, contentType } = prepare.data.upload;

  try {
    await uploadFileViaSignedUrl(
      { bucket, path, token, contentType },
      preparedFile,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return { error: message, code: "NETWORK_ERROR" };
  }

  return guestJsonFetch<{ video: SafeVideo }>("/api/video/upload/complete", {
    method: "POST",
    body: JSON.stringify({
      videoId,
      mimeType: contentType ?? preparedFile.type,
      size: preparedFile.size,
      durationSeconds: preparedDuration,
      fileName: preparedFile.name,
    }),
  });
}
