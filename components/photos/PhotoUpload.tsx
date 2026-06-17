"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
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
  const { t } = useLocale();
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
      setError(t("photosUpload.processError"));
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
    return <p className="flow-loading">{t("photosUpload.loading")}</p>;
  }

  return (
    <div className="flow-stack">
      <p className="flow-meta">
        {quota.count} / {quota.max} {t("photosUpload.uploaded")}
        {atLimit && t("photosUpload.limitReached")}
      </p>

      {!atLimit && !uploading && (
        <label className="flow-upload">
          <span>
            {t("photosUpload.addPhoto")} ({quota.remaining} {t("photosUpload.remaining")})
          </span>
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
          <p className="flow-meta">
            {t("photosUpload.uploading")} {progress}%
          </p>
        </div>
      )}

      {photos.length > 0 ? (
        <ul className="flow-photo-grid">
          {photos.map((photo, index) => (
            <li key={photo.id} className="flow-photo-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.signed_url ?? undefined}
                alt={`${t("photosUpload.guestPhoto")} ${index + 1}`}
                className="flow-photo-thumb"
              />
              {!uploading && (
                <button
                  type="button"
                  className="flow-photo-remove"
                  aria-label={`${t("photosUpload.removePhoto")} ${index + 1}`}
                  onClick={() => void handleDelete(photo.id)}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !uploading && <p className="flow-meta">{t("photosUpload.noPhotos")}</p>
      )}

      {error && <p className="flow-error">{error}</p>}
    </div>
  );
}
