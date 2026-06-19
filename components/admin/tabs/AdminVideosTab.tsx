"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import type { AdminVideoItem, MediaSection } from "@/lib/admin/server";
import { isApiError } from "@/lib/utils/api";

const SECTIONS: { id: MediaSection; label: string }[] = [
  { id: "all", label: "All" },
  { id: "standard", label: "Standard" },
  { id: "hijabi", label: "Hijabi" },
];

export function AdminVideosTab() {
  const { adminFetch } = useAdmin();
  const [section, setSection] = useState<MediaSection>("all");
  const [videos, setVideos] = useState<AdminVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await adminFetch<{ videos: AdminVideoItem[] }>(
      `/api/admin/videos?section=${section}`,
    );
    if (isApiError(result)) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setVideos(result.data.videos);
    setLoading(false);
  }, [adminFetch, section]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this video from storage and the database?")) return;

    setError(null);
    const result = await adminFetch<{ deleted: true }>(`/api/admin/videos/${id}`, {
      method: "DELETE",
    });

    if (isApiError(result)) {
      setError(result.error);
      return;
    }

    await load();
  }

  return (
    <div className="admin-tab">
      <header className="admin-tab__header">
        <h2 className="admin-tab__title">Videos</h2>
        <button type="button" className="flow-btn flow-btn--secondary" onClick={() => void load()}>
          Refresh
        </button>
      </header>

      <div className="admin-filter-row">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`admin-filter-btn ${section === item.id ? "admin-filter-btn--active" : ""}`}
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && <p className="flow-loading">Loading videos…</p>}
      {error && <p className="flow-error">{error}</p>}

      {!loading && !error && videos.length === 0 && (
        <p className="flow-meta">No videos in this section yet.</p>
      )}

      <ul className="admin-list">
        {videos.map((video) => (
          <li key={video.id} className="admin-media-card flow-card admin-video-row">
            <div className="admin-video-row__info">
              <span className="admin-badge" data-hijabi={video.is_hijabi}>
                {video.is_hijabi ? "Hijabi" : "Standard"}
              </span>
              <span className="admin-badge" data-locked={video.locked}>
                {video.locked ? "Locked until unlock date" : "Unlocked"}
              </span>
              <p className="flow-meta">
                Uploaded: {new Date(video.created_at).toLocaleString()}
              </p>
              <p className="flow-meta">
                Unlocks: {new Date(video.unlock_date).toLocaleDateString()}
              </p>
            </div>
            {video.signed_url && (
              <div className="admin-video-row__actions">
                <video
                  src={video.signed_url}
                  controls
                  playsInline
                  className="admin-video-player"
                />
                <a
                  href={video.signed_url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="admin-link"
                >
                  Download
                </a>
                <button
                  type="button"
                  className="flow-btn flow-btn--secondary admin-btn-danger"
                  onClick={() => void handleDelete(video.id)}
                >
                  Remove
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
