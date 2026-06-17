import { getOrCreateGuestToken } from "@/lib/guest/session";
import type { ApiResponse } from "@/types";

async function videoFetchForm<T>(
  path: string,
  formData: FormData,
): Promise<ApiResponse<T>> {
  const token = getOrCreateGuestToken();
  const response = await fetch(path, {
    method: "POST",
    headers: { "X-Guest-Token": token },
    body: formData,
  });
  return (await response.json()) as ApiResponse<T>;
}

async function videoFetch<T>(path: string): Promise<ApiResponse<T>> {
  const token = getOrCreateGuestToken();
  const response = await fetch(path, {
    headers: { "X-Guest-Token": token },
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
  return videoFetch<VideoStatus>("/api/video/status");
}

/** POST /api/video/upload */
export async function uploadVideo(file: File, durationSeconds: number) {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("duration_seconds", String(durationSeconds));
  return videoFetchForm<{ video: SafeVideo }>("/api/video/upload", formData);
}
