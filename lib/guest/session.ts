import {
  GUEST_TOKEN_HEADER,
  LOCAL_STORAGE_GUEST_TOKEN_KEY,
} from "@/lib/constants/steps";
import { generateGuestToken, isValidUuid } from "@/lib/utils/uuid";

/** Read guest token from localStorage (browser only). */
export function getStoredGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(LOCAL_STORAGE_GUEST_TOKEN_KEY);
  return token && isValidUuid(token) ? token : null;
}

/** Persist guest token to localStorage. */
export function setStoredGuestToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_GUEST_TOKEN_KEY, token);
}

/** Return existing token or create + store a new UUID. */
export function getOrCreateGuestToken(): string {
  const existing = getStoredGuestToken();
  if (existing) return existing;

  const token = generateGuestToken();
  setStoredGuestToken(token);
  return token;
}

/** Clear session (rare — e.g. debug reset). */
export function clearGuestToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_STORAGE_GUEST_TOKEN_KEY);
}

/** Header object for fetch calls to /api routes. */
export function guestAuthHeaders(token: string): HeadersInit {
  return {
    [GUEST_TOKEN_HEADER]: token,
    "Content-Type": "application/json",
  };
}
