"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useGuest } from "@/hooks/useGuest";
import type { Guest, GuestProgress } from "@/types";

interface GuestContextValue {
  guestToken: string | null;
  guest: Guest | null;
  progress: GuestProgress | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  ensureSession: () => Promise<void>;
}

const GuestContext = createContext<GuestContextValue | null>(null);

/** Provides guest session state to the entire app tree. */
export function GuestProvider({ children }: { children: ReactNode }) {
  const value = useGuest();
  return (
    <GuestContext.Provider value={value}>{children}</GuestContext.Provider>
  );
}

export function useGuestContext(): GuestContextValue {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error("useGuestContext must be used within GuestProvider");
  }
  return context;
}
