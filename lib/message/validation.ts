export const MESSAGE_MIN_LENGTH = 1;
export const MESSAGE_MAX_LENGTH = 2000;

export function validateMessageText(
  raw: string | undefined | null,
): { ok: true; message: string } | { ok: false; code: string; error: string } {
  const message = raw?.trim() ?? "";

  if (message.length < MESSAGE_MIN_LENGTH) {
    return {
      ok: false,
      code: "INVALID_MESSAGE",
      error: "Message must be at least 1 character",
    };
  }

  if (message.length > MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      code: "INVALID_MESSAGE",
      error: `Message must be under ${MESSAGE_MAX_LENGTH} characters`,
    };
  }

  return { ok: true, message };
}
