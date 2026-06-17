import { getOrCreateGuestToken } from "@/lib/guest/session";
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

/** GET /api/photo */
export async function listPhotosFromApi(): Promise<ApiResponse<PhotoListResponse>> {
  const response = await fetch("/api/photo", {
    headers: { "X-Guest-Token": getToken() },
  });
  return (await response.json()) as ApiResponse<PhotoListResponse>;
}

/** POST /api/photo/upload with upload progress (XHR). */
export function uploadPhotoWithProgress(
  file: File,
  onProgress: (percent: number) => void,
): Promise<ApiResponse<{ photo: PhotoItem }>> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("photo", file);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      try {
        resolve(JSON.parse(xhr.responseText) as ApiResponse<{ photo: PhotoItem }>);
      } catch {
        resolve({ error: "Invalid server response", code: "PARSE_ERROR" });
      }
    });

    xhr.addEventListener("error", () => {
      resolve({ error: "Upload failed", code: "NETWORK_ERROR" });
    });

    xhr.addEventListener("abort", () => {
      resolve({ error: "Upload cancelled", code: "ABORTED" });
    });

    xhr.open("POST", "/api/photo/upload");
    xhr.setRequestHeader("X-Guest-Token", getToken());
    xhr.send(formData);
  });
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
