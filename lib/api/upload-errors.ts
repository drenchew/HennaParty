import { jsonError, serverError, unauthorized } from "@/lib/api/response";

const CLIENT_ERROR_CODES = new Set([
  "EMPTY_FILE",
  "FILE_TOO_LARGE",
  "INVALID_MIME",
  "INVALID_DURATION",
  "VIDEO_TOO_LONG",
  "PHOTO_LIMIT_REACHED",
  "HIJAB_PREFERENCE_REQUIRED",
  "HIJAB_PREFERENCE_LOCKED",
  "UPLOAD_NOT_FOUND",
  "VIDEO_EXISTS",
  "INVALID_PAYLOAD",
]);

/** Map thrown `CODE:message` errors from upload handlers to JSON responses. */
export function handleUploadRouteError(error: unknown, route: string) {
  if (error instanceof Error) {
    if (error.message === "GUEST_NOT_FOUND") return unauthorized();

    const [code, message] = error.message.split(":");
    if (code && message && CLIENT_ERROR_CODES.has(code)) {
      const status =
        code === "PHOTO_LIMIT_REACHED" || code === "VIDEO_EXISTS" ? 409 : 400;
      return jsonError(message, status, code);
    }
  }

  console.error(route, error);
  return serverError();
}
