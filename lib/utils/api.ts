import type { ApiError, ApiResponse } from "@/types";

export function apiSuccess<T>(data: T): ApiResponse<T> {
  return { data };
}

export function apiError(error: string, code?: string): ApiError {
  return code ? { error, code } : { error };
}

export function isApiError<T>(response: ApiResponse<T>): response is ApiError {
  return "error" in response;
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}
