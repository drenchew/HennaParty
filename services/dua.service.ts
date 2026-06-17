import { getOrCreateGuestToken, guestAuthHeaders } from "@/lib/guest/session";
import type { ApiResponse, AssignDuaResponse, Dua } from "@/types";

async function duaFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getOrCreateGuestToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      ...guestAuthHeaders(token),
      ...(options.headers ?? {}),
    },
  });

  const json = (await response.json()) as ApiResponse<T>;
  if (!response.ok && !("error" in json)) {
    return { error: "Request failed", code: String(response.status) };
  }
  return json;
}

/** POST /api/dua/assign — fetch unused dua, assign to guest_token. */
export async function assignDuaFromApi() {
  return duaFetch<AssignDuaResponse>("/api/dua/assign", { method: "POST" });
}

/** POST /api/dua/accept — mark dua accepted, idempotent. */
export async function acceptDuaFromApi() {
  return duaFetch<{ dua: Dua; accepted_at: string }>("/api/dua/accept", {
    method: "POST",
  });
}
