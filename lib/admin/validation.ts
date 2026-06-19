export function validateAdminDuaInput(input: {
  arabic?: unknown;
  translation?: unknown;
}): { ok: true; arabic: string; translation: string } | { ok: false; message: string } {
  const arabic = typeof input.arabic === "string" ? input.arabic.trim() : "";
  const translation =
    typeof input.translation === "string" ? input.translation.trim() : "";

  if (!arabic) {
    return { ok: false, message: "Arabic text is required" };
  }

  if (!translation) {
    return { ok: false, message: "Translation is required" };
  }

  if (arabic.length > 2000 || translation.length > 2000) {
    return { ok: false, message: "Text is too long (max 2000 characters)" };
  }

  return { ok: true, arabic, translation };
}

export const RESET_GUESTS_CONFIRM_PHRASE = "RESET-GUESTS";
