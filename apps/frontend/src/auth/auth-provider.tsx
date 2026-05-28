import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authService } from "@/api/auth";
import { useAuthStore } from "@/auth/auth-store";
import type { Organization } from "@/auth/types";
import { fetchMeAsync, useMeQuery } from "@/hooks/queries/use-me-query";
import { setOnRefreshFailure } from "@/lib/axios";
import { clearAccessToken, setAccessToken } from "@/lib/auth-token";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/query-keys";

export type { Organization, User } from "@/auth/types";

interface AuthProviderProps {
  children: React.ReactNode;
}

export interface RegisterBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface LoginCredentialsBody {
  email: string;
  password: string;
}

interface ClearAuthStateOptions {
  resetInitialization?: boolean;
}

function syncAccessToken(
  token: string | null,
  tokenExpiresAt?: string | null
): void {
  if (token) {
    setAccessToken(token, tokenExpiresAt);
    return;
  }

  clearAccessToken();
}

export function useAuthInitialization(): boolean {
  return useAuthStore((state) => state.isInitialized);
}

export function useAuthToken(): string | null {
  return useAuthStore((state) => state.token);
}

export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => Boolean(state.token));
}

export function useSelectedOrganizationId(): string | null {
  return useAuthStore((state) => state.selectedOrganizationId);
}

export function useSetSelectedOrganizationId(): (
  selectedOrganizationId: string | null
) => void {
  return useAuthStore((state) => state.setSelectedOrganizationId);
}

export function useCurrentUser() {
  const isInitialized = useAuthInitialization();
  const isAuthenticated = useIsAuthenticated();

  return useMeQuery(isInitialized && isAuthenticated);
}

export function useSelectedOrganization(): Organization | null {
  const selectedOrganizationId = useSelectedOrganizationId();
  const currentUserQuery = useCurrentUser();
  const organizations = currentUserQuery.data?.organizations ?? [];

  return useMemo(() => {
    if (organizations.length === 0) {
      return null;
    }

    if (!selectedOrganizationId) {
      return organizations[0];
    }

    return (
      organizations.find((organization) => organization.id === selectedOrganizationId) ??
      organizations[0]
    );
  }, [organizations, selectedOrganizationId]);
}

export function useGetMeAction(): () => Promise<void> {
  const queryClient = useQueryClient();
  const token = useAuthToken();

  return useCallback(async (): Promise<void> => {
    if (!token) {
      return;
    }

    await queryClient.fetchQuery({
      queryKey: queryKeys.auth.me(),
      queryFn: fetchMeAsync,
    });
  }, [queryClient, token]);
}

export function useRegisterAction(): (
  body: RegisterBody
) => Promise<boolean> {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  return useCallback(
    async ({
      firstName,
      lastName,
      email,
      password,
    }: RegisterBody): Promise<boolean> => {
      try {
        const response = await authService.signUpAsync({
          firstName,
          lastName,
          email,
          password,
        });

        const { accessToken, accessTokenExpiresAt } = response;
        setSession(accessToken, accessTokenExpiresAt);
        syncAccessToken(accessToken, accessTokenExpiresAt);
        await queryClient.fetchQuery({
          queryKey: queryKeys.auth.me(),
          queryFn: fetchMeAsync,
        });
        return true;
      } catch (error) {
        logger.error("Registration failed", error);
        return false;
      }
    },
    [queryClient, setSession]
  );
}

export function useLoginAction(): (
  credentials: LoginCredentialsBody
) => Promise<boolean> {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  return useCallback(
    async ({ email, password }: LoginCredentialsBody): Promise<boolean> => {
      try {
        const response = await authService.signInAsync({
          email,
          password,
        });

        const { accessToken, accessTokenExpiresAt } = response;
        setSession(accessToken, accessTokenExpiresAt);
        syncAccessToken(accessToken, accessTokenExpiresAt);
        await queryClient.fetchQuery({
          queryKey: queryKeys.auth.me(),
          queryFn: fetchMeAsync,
        });
        return true;
      } catch (error) {
        logger.error("Login failed", error);
        return false;
      }
    },
    [queryClient, setSession]
  );
}

export function useLogoutAction(): () => Promise<void> {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const setSelectedOrganizationId = useSetSelectedOrganizationId();

  return useCallback(async (): Promise<void> => {
    try {
      await authService.logoutAsync();
    } catch (error) {
      logger.error("Logout API call failed", error);
    } finally {
      clearSession();
      setSelectedOrganizationId(null);
      setInitialized(true);
      syncAccessToken(null);
      queryClient.clear();
    }
  }, [clearSession, queryClient, setInitialized, setSelectedOrganizationId]);
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const initializationRef = useRef(false);
  const isInitialized = useAuthInitialization();
  const isAuthenticated = useIsAuthenticated();
  const selectedOrganizationId = useSelectedOrganizationId();
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const setSelectedOrganizationId = useSetSelectedOrganizationId();
  const resetAuthClientState = useAuthStore((state) => state.resetAuthClientState);
  const meQuery = useMeQuery(isInitialized && isAuthenticated);
  const user = meQuery.data ?? null;

  const clearAuthState = useCallback(
    (options: ClearAuthStateOptions = {}) => {
      if (options.resetInitialization) {
        resetAuthClientState();
      } else {
        clearSession();
        setSelectedOrganizationId(null);
        setInitialized(true);
      }

      syncAccessToken(null);
      queryClient.clear();
    },
    [
      clearSession,
      queryClient,
      resetAuthClientState,
      setInitialized,
      setSelectedOrganizationId,
    ]
  );

  useEffect(() => {
    setOnRefreshFailure(() => {
      clearAuthState();
      window.location.href = "/auth/sign-in";
    });
  }, [clearAuthState]);

  useEffect(() => {
    if (!user) {
      setSelectedOrganizationId(null);
      return;
    }

    if (user.organizations.length === 0) {
      setSelectedOrganizationId(null);
      return;
    }

    if (
      selectedOrganizationId &&
      user.organizations.some((organization) => organization.id === selectedOrganizationId)
    ) {
      return;
    }

    setSelectedOrganizationId(user.organizations[0].id);
  }, [selectedOrganizationId, setSelectedOrganizationId, user]);

  useEffect(() => {
    if (initializationRef.current) {
      return;
    }

    initializationRef.current = true;

    const initializeAuth = async () => {
      localStorage.removeItem("_authAccessToken");
      localStorage.removeItem("_authTokenType");
      localStorage.removeItem("_authExpiresIn");
      localStorage.removeItem("_authRefreshToken");

      try {
        const response = await authService.refreshAsync();
        const { accessToken, accessTokenExpiresAt } = response;
        setSession(accessToken, accessTokenExpiresAt);
        syncAccessToken(accessToken, accessTokenExpiresAt);
      } catch {
        logger.debug("No existing session to restore");
        clearAuthState({ resetInitialization: true });
      } finally {
        setInitialized(true);
      }
    };

    initializeAuth();
  }, [clearAuthState, setInitialized, setSession]);

  return <>{children}</>;
}
