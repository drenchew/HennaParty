"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrCreateGuestToken } from "@/lib/guest/session";
import { initGuest, getGuestMe } from "@/services/guest.service";
import type { Guest, GuestProgress } from "@/types";
import { isApiError } from "@/lib/utils/api";

interface UseGuestState {
  guestToken: string | null;
  guest: Guest | null;
  progress: GuestProgress | null;
  isLoading: boolean;
  error: string | null;
}

interface UseGuestReturn extends UseGuestState {
  refresh: () => Promise<void>;
  ensureSession: () => Promise<void>;
}

/**
 * Bootstraps anonymous guest session:
 * 1. Read/create token in localStorage
 * 2. POST /api/guest/init
 * 3. GET /api/guest/me for progress
 */
export function useGuest(): UseGuestReturn {
  const [state, setState] = useState<UseGuestState>({
    guestToken: null,
    guest: null,
    progress: null,
    isLoading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    const me = await getGuestMe();
    if (isApiError(me)) {
      setState((prev) => ({ ...prev, error: me.error, isLoading: false }));
      return;
    }
    setState((prev) => ({
      ...prev,
      guest: me.data.guest,
      progress: me.data.progress,
      isLoading: false,
      error: null,
    }));
  }, []);

  const ensureSession = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const token = getOrCreateGuestToken();
    setState((prev) => ({ ...prev, guestToken: token }));

    const init = await initGuest();
    if (isApiError(init)) {
      setState((prev) => ({ ...prev, error: init.error, isLoading: false }));
      return;
    }

    await refresh();
  }, [refresh]);

  useEffect(() => {
    void ensureSession();
  }, [ensureSession]);

  return { ...state, refresh, ensureSession };
}
