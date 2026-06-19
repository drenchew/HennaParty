"use client";

const CACHE_CONTROL = "3600";

/**
 * POST file bytes directly to Supabase Storage via a signed upload URL.
 * Bypasses Vercel's request body limit entirely.
 */
export function uploadFileViaSignedUrl(
  signedUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("cacheControl", CACHE_CONTROL);
    formData.append("", file);

    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`Direct upload failed (${xhr.status})`));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Direct upload network error"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Direct upload cancelled"));
    });

    xhr.open("POST", signedUrl);
    xhr.send(formData);
  });
}
