import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  isAxiosError,
} from "axios";
import { toast } from "sonner";

import { normalizeError } from "@/api/shared/normalize-error";
import { env } from "@/env";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from "@/lib/auth-token";
import { logger } from "@/lib/logger";

const NETWORK_ERROR_MESSAGE = "Network error. Please check your connection.";
const SERVER_ERROR_MESSAGE = "Server error. Please try again later.";
const REQUEST_FAILED_MESSAGE = "Request failed. Please try again.";
const MISSING_API_MESSAGE_SENTINEL = "__MISSING_API_MESSAGE__";

interface HandleApiExceptionToastOptions {
  suppressUnauthorized?: boolean;
}

function handleApiExceptionToast(
  error: unknown,
  options: HandleApiExceptionToastOptions = {}
): void {
  if (!isAxiosError(error)) {
    toast.error(normalizeError(error, REQUEST_FAILED_MESSAGE).message);
    return;
  }

  if (error.code === "ERR_CANCELED") {
    return;
  }

  const statusCode = error.response?.status;

  if (options.suppressUnauthorized && statusCode === 401) {
    return;
  }

  if (!error.response) {
    toast.error(NETWORK_ERROR_MESSAGE);
    return;
  }

  const extractedMessage = normalizeError(
    error,
    MISSING_API_MESSAGE_SENTINEL
  ).message;
  const hasBackendMessage =
    extractedMessage !== MISSING_API_MESSAGE_SENTINEL &&
    extractedMessage !== error.message;

  if (hasBackendMessage) {
    toast.error(extractedMessage);
    return;
  }

  if (statusCode && statusCode >= 500) {
    toast.error(SERVER_ERROR_MESSAGE);
    return;
  }

  toast.error(REQUEST_FAILED_MESSAGE);
}

// --- Public API instance (no auth) ---
export const api = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    handleApiExceptionToast(error);
    return Promise.reject(error);
  }
);

// --- Authenticated API instance (single, shared) ---
export const authApi = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Refresh queue mechanism ---
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
let refreshFailSubscribers: Array<(error: AxiosError) => void> = [];

let _onRefreshFailure: (() => void) | null = null;

export function setOnRefreshFailure(callback: () => void): void {
  _onRefreshFailure = callback;
}

function subscribeToRefresh(
  onSuccess: (token: string) => void,
  onFailure: (error: AxiosError) => void
): void {
  refreshSubscribers.push(onSuccess);
  refreshFailSubscribers.push(onFailure);
}

function notifyRefreshSuccess(newToken: string): void {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
  refreshFailSubscribers = [];
}

function notifyRefreshFailure(error: AxiosError): void {
  refreshFailSubscribers.forEach((cb) => cb(error));
  refreshSubscribers = [];
  refreshFailSubscribers = [];
}

async function performTokenRefresh(): Promise<string | null> {
  try {
    const response = await api.post("/identity/refresh");

    if (response.status === 200) {
      const { accessToken, accessTokenExpiresAt } = response.data;
      setAccessToken(accessToken, accessTokenExpiresAt);
      return accessToken;
    }
    return null;
  } catch (error) {
    logger.error("Token refresh failed", error);
    return null;
  }
}

// --- Request interceptor: attach Bearer token ---
authApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response interceptor: handle 401 with refresh queue ---
authApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeToRefresh(
            (newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(authApi(originalRequest));
            },
            (refreshError: AxiosError) => {
              reject(refreshError);
            }
          );
        });
      }

      isRefreshing = true;

      try {
        const newToken = await performTokenRefresh();

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          notifyRefreshSuccess(newToken);
          return authApi(originalRequest);
        } else {
          clearAccessToken();
          const refreshError = new AxiosError("Token refresh failed");
          notifyRefreshFailure(refreshError);
          if (_onRefreshFailure) {
            _onRefreshFailure();
          }
          return Promise.reject(error);
        }
      } catch (refreshError) {
        clearAccessToken();
        notifyRefreshFailure(refreshError as AxiosError);
        if (_onRefreshFailure) {
          _onRefreshFailure();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    handleApiExceptionToast(error, { suppressUnauthorized: true });

    return Promise.reject(error);
  }
);

// Backward-compatible alias — all 14 API modules import this
export const privateAPI = (): typeof authApi => authApi;
