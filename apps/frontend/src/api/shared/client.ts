import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { env } from "../../env";
import { setAccessToken, getAccessToken, clearAccessToken } from "../../lib/auth-token";
import { notifySessionExpired } from "./session-events";

type RetriableRequest = InternalAxiosRequestConfig & { _authRetry?: boolean };

export const publicApi = axios.create({ baseURL: env.VITE_API_URL, withCredentials: true });
export const authApi = axios.create({ baseURL: env.VITE_API_URL, withCredentials: true });

const refreshLockName = "bitfinance-session-refresh";

let refreshPromise: Promise<string> | null = null;

async function requestAccessToken() {
  const response = await publicApi.post<{ accessToken: string; accessTokenExpiresAt: string }>(
    "/identity/refresh",
  );
  setAccessToken(response.data.accessToken, response.data.accessTokenExpiresAt);
  return response.data.accessToken;
}

async function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  if (!("locks" in navigator)) return task();
  return await navigator.locks.request(refreshLockName, task);
}

export function refreshAccessToken(): Promise<string> {
  refreshPromise ??= withRefreshLock(requestAccessToken).finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

authApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

authApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetriableRequest | undefined;
    if (error.response?.status !== 401 || !request || request._authRetry) {
      return Promise.reject(error);
    }

    request._authRetry = true;

    try {
      const token = await refreshAccessToken();
      request.headers.Authorization = `Bearer ${token}`;
      return authApi(request);
    } catch (refreshError) {
      clearAccessToken();
      notifySessionExpired(refreshError);
      return Promise.reject(refreshError);
    }
  },
);

export function resetRefreshState() {
  refreshPromise = null;
}
