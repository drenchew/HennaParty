import { NextResponse } from "next/server";
import type { ApiError } from "@/types";

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function jsonError(
  error: string,
  status = 400,
  code?: string,
): NextResponse {
  const body: ApiError = code ? { error, code } : { error };
  return NextResponse.json(body, { status });
}

export function unauthorized(): NextResponse {
  return jsonError("Missing or invalid guest token", 401, "UNAUTHORIZED");
}

export function notFound(message = "Not found"): NextResponse {
  return jsonError(message, 404, "NOT_FOUND");
}

export function serverError(message = "Internal server error"): NextResponse {
  return jsonError(message, 500, "INTERNAL_ERROR");
}
