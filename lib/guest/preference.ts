import type { Guest } from "@/types";

export function requireGuestHijabiPreference(
  guest: Guest,
): asserts guest is Guest & { hijabi: boolean } {
  if (guest.hijabi === null || guest.hijabi === undefined) {
    throw new Error("HIJAB_PREFERENCE_REQUIRED:Please choose your photo section first");
  }
}
