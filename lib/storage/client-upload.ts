"use client";

import { createBrowserClient } from "@/lib/supabase/client";

const CACHE_CONTROL = "3600";

export interface SignedUploadTarget {
  bucket: string;
  path: string;
  token: string;
  contentType?: string;
}

/**
 * Upload file bytes directly to Supabase Storage using a signed upload token.
 * Uses the Supabase JS client so apikey/auth headers are sent correctly.
 */
export async function uploadFileViaSignedUrl(
  target: SignedUploadTarget,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  onProgress?.(0);

  const supabase = createBrowserClient();
  const contentType =
    target.contentType ?? (file.type.split(";")[0]?.trim() || undefined);

  const { error } = await supabase.storage
    .from(target.bucket)
    .uploadToSignedUrl(target.path, target.token, file, {
      contentType,
      upsert: false,
      cacheControl: CACHE_CONTROL,
    });

  if (error) {
    throw new Error(error.message);
  }

  onProgress?.(100);
}
