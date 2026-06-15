import { LOCAL_STORAGE_GUEST_TOKEN_KEY } from "@/lib/constants/steps";
import type { GuestStep } from "@/lib/constants/steps";

const STEP_STORAGE_KEY = "henna_guest_step";

export function getStoredStep(): GuestStep | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(STEP_STORAGE_KEY);
  return value as GuestStep | null;
}

export function setStoredStep(step: GuestStep): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STEP_STORAGE_KEY, step);
}

export function clearStoredStep(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STEP_STORAGE_KEY);
}

/** Clears all guest session keys (debug / reset). */
export function clearGuestSession(): void {
  clearStoredStep();
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_STORAGE_GUEST_TOKEN_KEY);
}
