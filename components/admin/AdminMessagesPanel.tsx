"use client";

import { useState } from "react";
import { isApiError } from "@/lib/utils/api";
import {
  fetchAdminMessages,
  type AdminMessage,
} from "@/services/message.service";

export function AdminMessagesPanel() {
  const [secret, setSecret] = useState("");
  const [storedSecret, setStoredSecret] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnlock(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await fetchAdminMessages(secret);
    if (isApiError(result)) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setStoredSecret(secret);
    setMessages(result.data.messages);
    setLoading(false);
  }

  async function handleRefresh() {
    if (!storedSecret) return;
    setLoading(true);
    const result = await fetchAdminMessages(storedSecret);
    if (!isApiError(result)) {
      setMessages(result.data.messages);
    }
    setLoading(false);
  }

  if (!storedSecret) {
    return (
      <form className="flow-card flow-stack admin-panel" onSubmit={(e) => void handleUnlock(e)}>
        <h1 className="flow-title">Admin — Guest Messages</h1>
        <p className="flow-subtitle">Enter your admin secret to view submitted advice.</p>
        <input
          type="password"
          className="flow-textarea admin-secret-input"
          placeholder="Admin secret"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          autoComplete="current-password"
        />
        <button type="submit" className="flow-btn flow-btn--primary" disabled={loading || !secret}>
          {loading ? "Verifying…" : "View messages"}
        </button>
        {error && <p className="flow-error">{error}</p>}
      </form>
    );
  }

  return (
    <div className="flow-stack admin-panel">
      <header className="flow-header">
        <h1 className="flow-title">Guest Messages</h1>
        <p className="flow-subtitle">{messages.length} messages submitted</p>
      </header>

      <button
        type="button"
        className="flow-btn flow-btn--secondary"
        onClick={() => void handleRefresh()}
        disabled={loading}
      >
        {loading ? "Refreshing…" : "Refresh"}
      </button>

      <ul className="admin-message-list">
        {messages.map((item) => (
          <li key={item.id} className="flow-card admin-message">
            <p className="admin-message-text">{item.message}</p>
            <time className="flow-meta" dateTime={item.created_at}>
              {new Intl.DateTimeFormat(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(item.created_at))}
            </time>
          </li>
        ))}
      </ul>

      {messages.length === 0 && (
        <p className="flow-meta">No messages submitted yet.</p>
      )}
    </div>
  );
}
