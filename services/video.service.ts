import { getOrCreateGuestToken, guestAuthHeaders } from "@/lib/guest/session";
import { uploadFileViaSignedUrl } from "@/lib/storage/client-upload";
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
  const prepare = await guestJsonFetch<{
    upload: {
      bucket: string;
      path: string;
      token: string;
      signedUrl: string;
      videoId: string;
    };
  }>("/api/video/upload/prepare", {
    method: "POST",
    body: JSON.stringify({
      mimeType: file.type,
      size: file.size,
      durationSeconds,
      fileName: file.name,
    }),
  });

  if ("error" in prepare) return prepare;

  try {
    await uploadFileViaSignedUrl(prepare.data.upload.signedUrl, file);
  } catch {
    return { error: "Upload failed", code: "NETWORK_ERROR" };
  }

  return guestJsonFetch<{ video: SafeVideo }>("/api/video/upload/complete", {
    method: "POST",
    body: JSON.stringify({
      videoId: prepare.data.upload.videoId,
      mimeType: file.type,
      size: file.size,
      durationSeconds,
      fileName: file.name,
    }),
  });
}
