"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import type { AdminGuestItem } from "@/lib/admin/server";
import { isApiError } from "@/lib/utils/api";

function hijabiLabel(hijabi: boolean | null): string {
  if (hijabi === true) return "Hijabi";
  if (hijabi === false) return "Standard";
  return "Not chosen";
}

export function AdminGuestsTab() {
  const { adminFetch } = useAdmin();
  const [guests, setGuests] = useState<AdminGuestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await adminFetch<{ guests: AdminGuestItem[] }>("/api/admin/guests");
    if (isApiError(result)) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setGuests(result.data.guests);
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Delete this guest and all their photos, video, advice, and votes? Assigned duas will be released.",
      )
    ) {
      return;
    }

    setError(null);
    const result = await adminFetch<{ deleted: true }>(`/api/admin/guests/${id}`, {
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
        <h2 className="admin-tab__title">Guests</h2>
        <button type="button" className="flow-btn flow-btn--secondary" onClick={() => void load()}>
          Refresh
        </button>
      </header>

      {loading && <p className="flow-loading">Loading guests…</p>}
      {error && <p className="flow-error">{error}</p>}

      {!loading && !error && guests.length === 0 && (
        <p className="flow-meta">No guests yet.</p>
      )}

      <ul className="admin-list">
        {guests.map((guest) => (
          <li key={guest.id} className="flow-card admin-guest-row">
            <div className="admin-guest-row__info">
              <span className="admin-badge" data-hijabi={guest.hijabi === true}>
                {hijabiLabel(guest.hijabi)}
              </span>
              <time className="flow-meta" dateTime={guest.created_at}>
                Joined {new Date(guest.created_at).toLocaleString()}
              </time>
              <p className="flow-meta">
                {guest.photo_count} photo{guest.photo_count === 1 ? "" : "s"}
                {guest.has_video ? " · video" : ""}
                {guest.has_message ? " · advice" : ""}
                {guest.has_dua ? " · dua" : ""}
              </p>
              <p className="admin-guest-id flow-meta">{guest.id}</p>
            </div>
            <button
              type="button"
              className="flow-btn flow-btn--secondary admin-btn-danger"
              onClick={() => void handleDelete(guest.id)}
            >
              Remove guest
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
