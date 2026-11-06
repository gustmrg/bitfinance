import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { env } from "../../env";
import { setAccessToken, getAccessToken, clearAccessToken } from "../../lib/auth-token";
import type { AuthSessionResponse } from "../auth/auth.types";
import { notifySessionExpired } from "./session-events";

type RetriableRequest = InternalAxiosRequestConfig & { _authRetry?: boolean };

export const publicApi = axios.create({ baseURL: env.VITE_API_URL, withCredentials: true });
export const authApi = axios.create({ baseURL: env.VITE_API_URL, withCredentials: true });

let refreshPromise: Promise<AuthSessionResponse> | null = null;
let sessionGeneration = 0;

// The cookie is shared by tabs. Serialize the entire request/Set-Cookie cycle,
// not just callers in this JS context. No token is stored in localStorage.
export function refreshSession(): Promise<AuthSessionResponse> {
  if (refreshPromise) return refreshPromise;
  const generation = sessionGeneration;
  const refresh = async () => {
    const response = await publicApi.post<AuthSessionResponse>("/identity/refresh");
    if (generation !== sessionGeneration) throw new axios.CanceledError("Session changed");
    setAccessToken(response.data.accessToken, response.data.accessTokenExpiresAt);
    return response.data;
  };
  const operation = (async () => {
    if (typeof navigator !== "undefined" && navigator.locks) {
      return await navigator.locks.request("bitfinance-session-refresh", refresh);
    }
    return await refresh();
  })();
  const pending = operation.finally(() => {
    refreshPromise = null;
  });
  refreshPromise = pending;
  return pending;
}

function expireSession() {
  clearAccessToken();
  notifySessionExpired();
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
    if (error.response?.status !== 401 || !request) return Promise.reject(error);
    if (request._authRetry) {
      expireSession();
      return Promise.reject(error);
    }

    request._authRetry = true;
    let token = getAccessToken();
    // A late 401 may belong to an access token another request already replaced.
    if (!token || request.headers.Authorization === `Bearer ${token}`) {
      try {
        token = (await refreshSession()).accessToken;
      } catch (refreshError) {
        // Offline/timeouts/5xx must not destroy an otherwise valid session.
        if (
          axios.isAxiosError(refreshError) &&
          (refreshError.response?.status === 401 || refreshError.response?.status === 403)
        ) {
          expireSession();
        }
        return Promise.reject(refreshError);
      }
    }
    request.headers.Authorization = `Bearer ${token}`;
    return authApi(request);
  },
);

export function resetRefreshState() {
  sessionGeneration += 1;
}
