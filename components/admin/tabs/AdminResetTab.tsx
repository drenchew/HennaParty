"use client";

import { useState } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import type { AdminResetResult } from "@/lib/admin/server";
import { isApiError } from "@/lib/utils/api";

export function AdminResetTab() {
  const { adminFetch } = useAdmin();
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdminResetResult | null>(null);

  async function handleReset(event: React.FormEvent) {
    event.preventDefault();
    if (confirm !== "RESET") return;

    if (
      !window.confirm(
        "This deletes ALL guests, photos, videos, votes, and messages, and resets dua assignments. Continue?",
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const response = await adminFetch<AdminResetResult>("/api/admin/reset", {
      method: "POST",
      body: JSON.stringify({ confirm: "RESET" }),
    });

    if (isApiError(response)) {
      setError(response.error);
      setLoading(false);
      return;
    }

    setResult(response.data);
    setConfirm("");
    setLoading(false);
  }

  return (
    <div className="admin-tab">
      <header className="admin-tab__header">
        <h2 className="admin-tab__title">Reset test data</h2>
      </header>

      <div className="flow-card admin-danger-zone">
        <p className="flow-subtitle">
          Clears the entire <strong>guests</strong> table (and all linked photos, videos,
          votes, messages), removes files from storage, and resets all duas to available.
        </p>
        <p className="flow-meta">Duas themselves are kept — only assignments are cleared.</p>

        <form className="admin-reset-form" onSubmit={(e) => void handleReset(e)}>
          <label className="flow-meta">
            Type <strong>RESET</strong> to confirm
          </label>
          <input
            type="text"
            className="flow-textarea admin-secret-input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="RESET"
            autoComplete="off"
          />
          <button
            type="submit"
            className="flow-btn flow-btn--secondary admin-btn-danger"
            disabled={loading || confirm !== "RESET"}
          >
            {loading ? "Resetting…" : "Clear all guest data"}
          </button>
        </form>

        {error && <p className="flow-error">{error}</p>}

        {result && (
          <div className="flow-success admin-reset-result">
            <p>Reset complete:</p>
            <ul className="flow-meta">
              <li>{result.deleted_guests} guests removed</li>
              <li>{result.storage_files_removed} storage files deleted</li>
              <li>{result.duas_reset} duas unassigned</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
