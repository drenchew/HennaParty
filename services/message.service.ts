import { getOrCreateGuestToken, guestAuthHeaders } from "@/lib/guest/session";
import type { ApiResponse } from "@/types";
import type { Message } from "@/types";

export interface MessageStatus {
  message: Message | null;
  submitted: boolean;
}

async function messageFetch<T>(
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
  return (await response.json()) as ApiResponse<T>;
}

/** GET /api/message */
export async function getGuestMessage() {
  return messageFetch<MessageStatus>("/api/message");
}

/** POST /api/message/create */
export async function createMessage(text: string) {
  return messageFetch<{ message: Message }>("/api/message/create", {
    method: "POST",
    body: JSON.stringify({ message: text }),
  });
}

export interface AdminMessage {
  id: string;
  message: string;
  created_at: string;
}

/** GET /api/admin/messages */
export async function fetchAdminMessages(adminSecret: string) {
  const response = await fetch("/api/admin/messages", {
    headers: {
      "X-Admin-Secret": adminSecret,
    },
  });
  return (await response.json()) as ApiResponse<{
    messages: AdminMessage[];
    count: number;
  }>;
}
