"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ApiResponse } from "@/types";

const STORAGE_KEY = "henna_admin_secret";

interface AdminContextValue {
  secret: string | null;
  setSecret: (secret: string) => void;
  clearSecret: () => void;
  adminFetch: <T>(path: string, options?: RequestInit) => Promise<ApiResponse<T>>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [secret, setSecretState] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) setSecretState(stored);
  }, []);

  const setSecret = useCallback((value: string) => {
    sessionStorage.setItem(STORAGE_KEY, value);
    setSecretState(value);
  }, []);

  const clearSecret = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSecretState(null);
  }, []);

  const adminFetch = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
      if (!secret) {
        return { error: "Not authenticated", code: "ADMIN_UNAUTHORIZED" };
      }

      const response = await fetch(path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Secret": secret,
          ...(options.headers ?? {}),
        },
      });

      return (await response.json()) as ApiResponse<T>;
    },
    [secret],
  );

  const value = useMemo(
    () => ({ secret, setSecret, clearSecret, adminFetch }),
    [secret, setSecret, clearSecret, adminFetch],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}
