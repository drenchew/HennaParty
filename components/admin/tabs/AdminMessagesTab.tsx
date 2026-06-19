"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import { isApiError } from "@/lib/utils/api";

interface AdminMessage {
  id: string;
  message: string;
  created_at: string;
}

export function AdminMessagesTab() {
  const { adminFetch } = useAdmin();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await adminFetch<{ messages: AdminMessage[] }>("/api/admin/messages");
    if (isApiError(result)) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setMessages(result.data.messages);
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this advice message?")) return;

    setError(null);
    const result = await adminFetch<{ deleted: true }>(`/api/admin/messages/${id}`, {
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
        <h2 className="admin-tab__title">Guest advice</h2>
        <button type="button" className="flow-btn flow-btn--secondary" onClick={() => void load()}>
          Refresh
        </button>
      </header>

      {loading && <p className="flow-loading">Loading messages…</p>}
      {error && <p className="flow-error">{error}</p>}

      <ul className="admin-message-list">
        {messages.map((item) => (
          <li key={item.id} className="flow-card admin-message">
            <p className="admin-message-text">{item.message}</p>
            <time className="flow-meta" dateTime={item.created_at}>
              {new Date(item.created_at).toLocaleString()}
            </time>
            <button
              type="button"
              className="flow-btn flow-btn--secondary admin-btn-danger"
              onClick={() => void handleDelete(item.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {!loading && messages.length === 0 && (
        <p className="flow-meta">No messages submitted yet.</p>
      )}
    </div>
  );
}
