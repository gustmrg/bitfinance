import axios, { isAxiosError } from "axios";

export class ApiError extends Error {
  readonly status: number | undefined;
  readonly code: string | undefined;
  readonly details: unknown;

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function normalizeApiError(error: unknown, fallback: string): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    const errors = data?.errors;
    const message = typeof data?.message === "string"
      ? data.message
      : typeof data?.error === "string"
        ? data.error
        : typeof data?.description === "string"
          ? data.description
          : errors
            ? "Please check the highlighted fields."
            : fallback;

    return new ApiError(message, error.response?.status, typeof data?.code === "string" ? data.code : undefined, errors);
  }

  if (axios.isCancel(error)) return new ApiError("Request canceled.");
  return new ApiError(error instanceof Error ? error.message : fallback);
}

export function isUnauthorized(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}
