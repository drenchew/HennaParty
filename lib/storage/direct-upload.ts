import { createAdminClient } from "@/lib/supabase/admin";

export interface DirectUploadTarget {
  bucket: string;
  path: string;
  token: string;
  signedUrl: string;
}

/** Issue a short-lived signed upload URL (file goes straight to Supabase, not Vercel). */
export async function createDirectUploadTarget(
  bucket: string,
  storagePath: string,
): Promise<DirectUploadTarget> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(storagePath, { upsert: false });

  if (error || !data) {
    throw error ?? new Error("SIGN_UPLOAD_FAILED");
  }

  return {
    bucket,
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
  };
}

/** Confirm the object landed in storage before creating a DB row. */
export async function assertStorageObjectExists(
  bucket: string,
  storagePath: string,
): Promise<void> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 60);

  if (error || !data?.signedUrl) {
    throw new Error("UPLOAD_NOT_FOUND:File was not uploaded to storage");
  }
}

export async function removeStorageObject(
  bucket: string,
  storagePath: string,
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.storage.from(bucket).remove([storagePath]);
}
