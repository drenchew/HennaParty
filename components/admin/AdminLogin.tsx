"use client";

import { useState } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import { isApiError } from "@/lib/utils/api";

export function AdminLogin() {
  const { setSecret } = useAdmin();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;

    setLoading(true);
    setError(null);

    const response = await fetch("/api/admin/overview", {
      headers: { "X-Admin-Secret": value.trim() },
    });

    if (!response.ok) {
      setError("Invalid admin secret");
      setLoading(false);
      return;
    }

    setSecret(value.trim());
    setLoading(false);
  }

  return (
    <form className="admin-login flow-card" onSubmit={(e) => void handleSubmit(e)}>
      <h1 className="flow-title">Admin Panel</h1>
      <p className="flow-subtitle">
        Enter your admin secret to manage photos, videos, duas, and guest data.
      </p>
      <input
        type="password"
        className="flow-textarea admin-secret-input"
        placeholder="Admin secret"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="current-password"
      />
      <button type="submit" className="flow-btn flow-btn--primary" disabled={loading || !value}>
        {loading ? "Verifying…" : "Sign in"}
      </button>
      {error && <p className="flow-error">{error}</p>}
      <p className="flow-meta">
        Set <code>ADMIN_SECRET</code> in <code>.env.local</code> (local) or Vercel env vars
        (production).
      </p>
    </form>
  );
}
