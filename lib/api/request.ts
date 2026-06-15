import { NextRequest } from "next/server";
import { GUEST_TOKEN_HEADER } from "@/lib/constants/steps";
import { isValidUuid } from "@/lib/utils/uuid";

export function getGuestTokenFromRequest(request: NextRequest): string | null {
  const token = request.headers.get(GUEST_TOKEN_HEADER);
  if (!token || !isValidUuid(token)) return null;
  return token;
}

export function requireGuestToken(request: NextRequest): string | null {
  return getGuestTokenFromRequest(request);
}
