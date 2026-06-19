"use client";

import { useCallback, useEffect, useState } from "react";
import { isApiError } from "@/lib/utils/api";
import { getGuestMe } from "@/services/guest.service";

/** Loads guest hijabi section preference from the server. */
export function useGuestHijabi() {
  const [hijabi, setHijabi] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setIsLoading(true);
    void getGuestMe().then((result) => {
      if (isApiError(result)) {
        setIsLoading(false);
        return;
      }
      setHijabi(result.data.guest.hijabi);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { hijabi, isLoading, refresh };
}
