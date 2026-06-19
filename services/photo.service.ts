import { getOrCreateGuestToken, guestAuthHeaders } from "@/lib/guest/session";
import { uploadFileViaSignedUrl } from "@/lib/storage/client-upload";
import type { ApiResponse } from "@/types";

export interface PhotoItem {
  id: string;
  guest_id: string;
  url: string;
  created_at: string;
  signed_url: string | null;
}

export interface PhotoQuota {
  count: number;
  remaining: number;
  max: number;
}

export interface PhotoListResponse {
  photos: PhotoItem[];
  quota: PhotoQuota;
}

function getToken(): string {
  return getOrCreateGuestToken();
}

async function guestJsonFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...guestAuthHeaders(getToken()),
      ...(options.headers ?? {}),
    },
  });
  return (await response.json()) as ApiResponse<T>;
}

/** GET /api/photo */
export async function listPhotosFromApi(): Promise<ApiResponse<PhotoListResponse>> {
  const response = await fetch("/api/photo", {
    headers: { "X-Guest-Token": getToken() },
  });
  return (await response.json()) as ApiResponse<PhotoListResponse>;
}

/** Direct-to-Supabase photo upload (bypasses Vercel body limit). */
export function uploadPhotoWithProgress(
  file: File,
  onProgress: (percent: number) => void,
): Promise<ApiResponse<{ photo: PhotoItem }>> {
  return (async () => {
    const prepare = await guestJsonFetch<{
      upload: {
        bucket: string;
        path: string;
        token: string;
        signedUrl: string;
        photoId: string;
        contentType: string;
      };
    }>("/api/photo/upload/prepare", {
      method: "POST",
      body: JSON.stringify({ mimeType: file.type, size: file.size }),
    });

    if ("error" in prepare) return prepare;

    const { bucket, path, token, photoId, contentType } = prepare.data.upload;

    try {
      await uploadFileViaSignedUrl(
        { bucket, path, token, contentType },
        file,
        onProgress,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      return { error: message, code: "NETWORK_ERROR" };
    }

    return guestJsonFetch<{ photo: PhotoItem }>("/api/photo/upload/complete", {
      method: "POST",
      body: JSON.stringify({
        photoId,
        mimeType: contentType,
      }),
    });
  })();
}

/** DELETE /api/photo/[id] */
export async function deletePhotoFromApi(
  photoId: string,
): Promise<ApiResponse<{ deleted: true }>> {
  const response = await fetch(`/api/photo/${photoId}`, {
    method: "DELETE",
    headers: { "X-Guest-Token": getToken() },
  });
  return (await response.json()) as ApiResponse<{ deleted: true }>;
}
