import { NextRequest } from "next/server";
import { requireAdminSecret, adminUnauthorized } from "@/lib/api/admin";
import { jsonError, serverError } from "@/lib/api/response";

const CLIENT_ERROR_CODES = new Set([
  "INVALID_PAYLOAD",
  "NOT_FOUND",
  "CONFIRM_REQUIRED",
]);

export function withAdminAuth(
  handler: (request: NextRequest) => Promise<Response>,
) {
  return async (request: NextRequest) => {
    if (!requireAdminSecret(request)) {
      return adminUnauthorized();
    }
    try {
      return await handler(request);
    } catch (error) {
      return handleAdminError(error);
    }
  };
}

export function handleAdminError(error: unknown) {
  if (error instanceof Error) {
    const [code, message] = error.message.split(":");
    if (code && message && CLIENT_ERROR_CODES.has(code)) {
      const status = code === "NOT_FOUND" ? 404 : 400;
      return jsonError(message, status, code);
    }
  }

  console.error("[admin]", error);
  return serverError();
}

export function parseMediaSection(value: string | null) {
  if (value === "hijabi" || value === "standard" || value === "all") {
    return value;
  }
  return "all";
}
