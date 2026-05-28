import { isAxiosError } from "axios";

import type { ApiError } from "./http-error";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function extractValidationErrorMessage(errors: unknown): string | null {
  if (Array.isArray(errors)) {
    for (const item of errors) {
      const message = toNonEmptyString(item);
      if (message) {
        return message;
      }
    }

    return null;
  }

  if (!isObject(errors)) {
    return null;
  }

  for (const value of Object.values(errors)) {
    const directMessage = toNonEmptyString(value);
    if (directMessage) {
      return directMessage;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const arrayMessage = toNonEmptyString(item);
        if (arrayMessage) {
          return arrayMessage;
        }
      }
    }
  }

  return null;
}

function extractResponseMessage(responseData: unknown): string | null {
  if (!isObject(responseData)) {
    return null;
  }

  const validationMessage = extractValidationErrorMessage(responseData.errors);
  if (validationMessage) {
    return validationMessage;
  }

  const message = toNonEmptyString(responseData.message);
  if (message) {
    return message;
  }

  const detail = toNonEmptyString(responseData.detail);
  if (detail) {
    return detail;
  }

  const title = toNonEmptyString(responseData.title);
  if (title) {
    return title;
  }

  return null;
}

export function extractApiErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (isAxiosError(error)) {
    const responseMessage = extractResponseMessage(error.response?.data);
    if (responseMessage) {
      return responseMessage;
    }

    const axiosMessage = toNonEmptyString(error.message);
    if (axiosMessage) {
      return axiosMessage;
    }

    return fallbackMessage;
  }

  if (error instanceof Error) {
    const nativeMessage = toNonEmptyString(error.message);
    if (nativeMessage) {
      return nativeMessage;
    }

    return fallbackMessage;
  }

  const stringMessage = toNonEmptyString(error);
  if (stringMessage) {
    return stringMessage;
  }

  return fallbackMessage;
}

export function normalizeError(
  error: unknown,
  fallbackMessage: string
): ApiError {
  if (isAxiosError(error)) {
    const statusCode = error.response?.status;
    const responseData = isObject(error.response?.data)
      ? error.response.data
      : undefined;
    const responseCode = toNonEmptyString(responseData?.code);

    return {
      name: "ApiError",
      message: extractApiErrorMessage(error, fallbackMessage),
      statusCode,
      code: responseCode ?? error.code,
      details: responseData?.details ?? error.response?.data,
      cause: error,
    };
  }

  if (error instanceof Error) {
    return {
      name: "ApiError",
      message: error.message || fallbackMessage,
      cause: error,
    };
  }

  return {
    name: "ApiError",
    message: fallbackMessage,
    cause: error,
  };
}
