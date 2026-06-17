"use client";

import { useCallback, useEffect, useState } from "react";
import { MAX_PHOTOS_PER_GUEST } from "@/lib/constants/steps";
import { compressImage } from "@/lib/utils/image-compress";
import { isApiError } from "@/lib/utils/api";
import {
  deletePhotoFromApi,
  listPhotosFromApi,
  uploadPhotoWithProgress,
  type PhotoItem,
  type PhotoQuota,
} from "@/services/photo.service";

export function PhotoUpload() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [quota, setQuota] = useState<PhotoQuota>({
    count: 0,
    remaining: MAX_PHOTOS_PER_GUEST,
    max: MAX_PHOTOS_PER_GUEST,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await listPhotosFromApi();
    if (isApiError(result)) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setPhotos(result.data.photos);
    setQuota(result.data.quota);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || uploading || quota.remaining <= 0) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const compressed = await compressImage(file);
      const result = await uploadPhotoWithProgress(compressed, setProgress);

      if (isApiError(result)) {
        setError(result.error);
        setUploading(false);
        setProgress(0);
        return;
      }

      await loadPhotos();
    } catch {
      setError("Could not process that image. Try JPEG or PNG.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function handleDelete(photoId: string) {
    setError(null);
    const result = await deletePhotoFromApi(photoId);
    if (isApiError(result)) {
      setError(result.error);
      return;
    }
    await loadPhotos();
  }

  const atLimit = quota.remaining <= 0;

  if (loading) {
    return <p className="flow-loading">Loading your photos…</p>;
  }

  return (
    <div className="flow-stack">
      <p className="flow-meta">
        {quota.count} / {quota.max} photos uploaded
        {atLimit && " — limit reached"}
      </p>

      {!atLimit && !uploading && (
        <label className="flow-upload">
          <span>Add photo ({quota.remaining} remaining)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            capture="environment"
            disabled={uploading || atLimit}
            onChange={(e) => void handleFileChange(e)}
          />
        </label>
      )}

      {uploading && (
        <div className="flow-upload-progress" role="status" aria-live="polite">
          <div className="flow-upload-progress-bar">
            <div
              className="flow-upload-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="flow-meta">Uploading… {progress}%</p>
        </div>
      )}

      {photos.length > 0 ? (
        <ul className="flow-photo-grid">
          {photos.map((photo, index) => (
            <li key={photo.id} className="flow-photo-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.signed_url ?? undefined}
                alt={`Guest photo ${index + 1}`}
                className="flow-photo-thumb"
              />
              {!uploading && (
                <button
                  type="button"
                  className="flow-photo-remove"
                  aria-label={`Remove photo ${index + 1}`}
                  onClick={() => void handleDelete(photo.id)}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !uploading && (
          <p className="flow-meta">No photos yet — optional, you can continue anytime.</p>
        )
      )}

      {error && <p className="flow-error">{error}</p>}
    </div>
  );
}
