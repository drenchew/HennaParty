"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import type { AdminOverview } from "@/lib/admin/server";
import { isApiError } from "@/lib/utils/api";

export function AdminOverviewTab() {
  const { adminFetch } = useAdmin();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await adminFetch<AdminOverview>("/api/admin/overview");
    if (isApiError(result)) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="flow-loading">Loading overview…</p>;
  if (error) return <p className="flow-error">{error}</p>;
  if (!data) return null;

  const { stats } = data;

  return (
    <div className="admin-tab">
      <header className="admin-tab__header">
        <h2 className="admin-tab__title">Overview</h2>
        <button type="button" className="flow-btn flow-btn--secondary" onClick={() => void load()}>
          Refresh
        </button>
      </header>
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-card__value">{data.guest_count}</span>
          <span className="admin-stat-card__label">Guests</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value">{stats.photos_uploaded}</span>
          <span className="admin-stat-card__label">Photos</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value">{stats.videos_count}</span>
          <span className="admin-stat-card__label">Videos</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value">{stats.messages_count}</span>
          <span className="admin-stat-card__label">Messages</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value">{stats.votes_count}</span>
          <span className="admin-stat-card__label">Votes</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value">{stats.duas_assigned}</span>
          <span className="admin-stat-card__label">Duas assigned</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value">{data.duas_available}</span>
          <span className="admin-stat-card__label">Duas available</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value">{data.duas_total}</span>
          <span className="admin-stat-card__label">Duas total</span>
        </div>
      </div>
    </div>
  );
}
