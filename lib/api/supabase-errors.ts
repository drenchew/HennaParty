import { jsonError, serverError } from "@/lib/api/response";
import type { NextResponse } from "next/server";

interface PostgrestError {
  code?: string;
  message?: string;
}

export function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === "object" && error !== null && "code" in error;
}

/** Table/function missing — migrations not applied yet. */
export function isSchemaNotInitialized(error: unknown): boolean {
  return (
    isPostgrestError(error) &&
    (error.code === "PGRST205" || error.code === "42P01")
  );
}

export function handleDatabaseError(
  error: unknown,
  logPrefix: string,
): NextResponse {
  if (isSchemaNotInitialized(error)) {
    console.error(
      `[${logPrefix}] Database schema missing — run supabase/setup-all.sql in SQL Editor or npm run db:setup`,
    );
    return jsonError(
      "Database not initialized. Apply migrations in Supabase SQL Editor (see supabase/setup-all.sql).",
      503,
      "SCHEMA_NOT_INITIALIZED",
    );
  }

  console.error(`[${logPrefix}]`, error);
  return serverError();
}
