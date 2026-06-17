import { NextRequest } from "next/server";

export function requireAdminSecret(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;

  const header = request.headers.get("X-Admin-Secret");
  const auth = request.headers.get("Authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  return header === secret || bearer === secret;
}

export function adminUnauthorized() {
  return Response.json(
    { error: "Invalid or missing admin credentials", code: "ADMIN_UNAUTHORIZED" },
    { status: 401 },
  );
}
