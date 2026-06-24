"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import { isApiError } from "@/lib/utils/api";
import type { Dua } from "@/types";

export function AdminDuasTab() {
  const { adminFetch } = useAdmin();
  const [duas, setDuas] = useState<Dua[]>([]);
  const [arabic, setArabic] = useState("");
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await adminFetch<{ duas: Dua[] }>("/api/admin/duas");
    if (isApiError(result)) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setDuas(result.data.duas);
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!arabic.trim() || !translation.trim()) return;

    setSaving(true);
    setError(null);

    const result = await adminFetch<{ dua: Dua }>("/api/admin/duas", {
      method: "POST",
      body: JSON.stringify({ arabic, translation }),
    });

    if (isApiError(result)) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setArabic("");
    setTranslation("");
    setSaving(false);
    await load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this dua from the pool?")) return;

    setError(null);
    const result = await adminFetch<{ deleted: true }>(`/api/admin/duas/${id}`, {
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
        <h2 className="admin-tab__title">Duas</h2>
        <button type="button" className="flow-btn flow-btn--secondary" onClick={() => void load()}>
          Refresh
        </button>
      </header>

      <form className="admin-dua-form flow-card" onSubmit={(e) => void handleAdd(e)}>
        <h3 className="admin-subtitle">Add new dua</h3>
        <textarea
          className="flow-textarea"
          placeholder="Arabic text"
          value={arabic}
          onChange={(e) => setArabic(e.target.value)}
          dir="rtl"
          rows={3}
        />
        <textarea
          className="flow-textarea"
          placeholder="English translation"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          rows={2}
        />
        <button type="submit" className="flow-btn flow-btn--primary" disabled={saving}>
          {saving ? "Adding…" : "Add dua"}
        </button>
      </form>

      {loading && <p className="flow-loading">Loading duas…</p>}
      {error && <p className="flow-error">{error}</p>}

      <ul className="admin-list">
        {duas.map((dua) => (
          <li key={dua.id} className="flow-card admin-dua-item">
            <p className="admin-dua-arabic" dir="rtl">
              {dua.arabic}
            </p>
            <p className="admin-dua-translation">{dua.translation}</p>
            <div className="admin-dua-meta">
              <span className="admin-badge" data-used="false">
                In pool
              </span>
            </div>
            <div className="admin-dua-actions">
              <button
                type="button"
                className="flow-btn flow-btn--secondary admin-btn-danger"
                onClick={() => void handleDelete(dua.id)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
