import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { env } from "../../env";
import { setAccessToken, getAccessToken, clearAccessToken } from "../../lib/auth-token";
import { notifySessionExpired } from "./session-events";

type RetriableRequest = InternalAxiosRequestConfig & { _authRetry?: boolean };

export const publicApi = axios.create({ baseURL: env.VITE_API_URL, withCredentials: true });
export const authApi = axios.create({ baseURL: env.VITE_API_URL, withCredentials: true });

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken() {
  const response = await publicApi.post<{ accessToken: string; accessTokenExpiresAt: string }>(
    "/identity/refresh",
  );
  setAccessToken(response.data.accessToken, response.data.accessTokenExpiresAt);
  return response.data.accessToken;
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
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    try {
      const token = await refreshPromise;
      request.headers.Authorization = `Bearer ${token}`;
      return authApi(request);
    } catch (refreshError) {
      clearAccessToken();
      notifySessionExpired();
      return Promise.reject(refreshError);
    }
  },
);

export function resetRefreshState() {
  refreshPromise = null;
}
