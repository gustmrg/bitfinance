import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { accountService } from "../api/account/account.service";
import { authService } from "../api/auth/auth.service";
import type { AuthCredentials, RegisterCredentials, User } from "../api/auth/auth.types";
import { CanceledError } from "axios";
import { ApiError } from "../api/shared/errors";
import { resetRefreshState } from "../api/shared/client";
import { setSessionExpiredListener } from "../api/shared/session-events";
import { clearAccessToken, setAccessToken } from "../lib/auth-token";
import { queryKeys } from "../lib/query-keys";
import { useOrganizationStore } from "./auth-store";

type AuthStatus = "initializing" | "authenticated" | "unauthenticated" | "unavailable";
interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  sessionExpired: boolean;
  signIn: (credentials: AuthCredentials | RegisterCredentials) => Promise<User>;
  refreshUser: () => Promise<User>;
  signOut: (allDevices?: boolean) => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

function selectInitialOrganization(user: User) {
  const current = useOrganizationStore.getState().selectedOrganizationId;
  const valid = user.organizations.some((organization) => organization.id === current);
  useOrganizationStore
    .getState()
    .setSelectedOrganizationId(valid ? current : (user.organizations[0]?.id ?? null));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("initializing");
  const [user, setUser] = useState<User | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const authGeneration = useRef(0);
  const avatarObjectUrlRef = useRef<string | null>(null);

  const clearAvatarObjectUrl = useCallback(() => {
    if (avatarObjectUrlRef.current) URL.revokeObjectURL(avatarObjectUrlRef.current);
    avatarObjectUrlRef.current = null;
  }, []);

  const refreshUser = useCallback(async () => {
    const generation = authGeneration.current;
    const next = await authService.getMeAsync();
    let avatarUrl: string | null = null;

    if (next.hasAvatar) {
      try {
        avatarUrl = URL.createObjectURL(await accountService.getAvatarAsync());
      } catch {
        avatarUrl = avatarObjectUrlRef.current;
      }
    }

    if (generation !== authGeneration.current) {
      if (avatarUrl && avatarUrl !== avatarObjectUrlRef.current) URL.revokeObjectURL(avatarUrl);
      throw new CanceledError("Session changed");
    }
    if (avatarUrl !== avatarObjectUrlRef.current) {
      clearAvatarObjectUrl();
      avatarObjectUrlRef.current = avatarUrl;
    }

    const withAvatar = { ...next, avatarUrl };
    setUser(withAvatar);
    selectInitialOrganization(withAvatar);
    setStatus("authenticated");
    queryClient.setQueryData(queryKeys.auth.me(), withAvatar);
    return withAvatar;
  }, [clearAvatarObjectUrl, queryClient]);

  useEffect(() => {
    let active = true;
    const generation = authGeneration.current;
    const expire = () => {
      authGeneration.current += 1;
      resetRefreshState();
      setSessionExpired(true);
      clearAccessToken();
      clearAvatarObjectUrl();
      setUser(null);
      setStatus("unauthenticated");
      void queryClient.clear();
    };
    setSessionExpiredListener(expire);
    void authService
      .refreshAsync()
      .then((session) => {
        if (!active || generation !== authGeneration.current) return;
        setSessionExpired(false);
        setAccessToken(session.accessToken, session.accessTokenExpiresAt);
        return refreshUser();
      })
      .catch((error: unknown) => {
        if (!active || generation !== authGeneration.current) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearAccessToken();
          setSessionExpired(error.code === "session_expired");
          setStatus("unauthenticated");
        } else {
          setStatus("unavailable");
        }
      });
    return () => {
      active = false;
      setSessionExpiredListener(null);
    };
  }, [clearAvatarObjectUrl, queryClient, refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      sessionExpired,
      signIn: async (credentials) => {
        authGeneration.current += 1;
        const session =
          "firstName" in credentials
            ? await authService.registerAsync(credentials)
            : await authService.loginAsync(credentials);
        resetRefreshState();
        setSessionExpired(false);
        setAccessToken(session.accessToken, session.accessTokenExpiresAt);
        return refreshUser();
      },
      refreshUser,
      signOut: async (allDevices = false) => {
        authGeneration.current += 1;
        try {
          await authService[allDevices ? "logoutAllAsync" : "logoutAsync"]();
        } finally {
          resetRefreshState();
          setSessionExpired(false);
          clearAccessToken();
          clearAvatarObjectUrl();
          setUser(null);
          setStatus("unauthenticated");
          useOrganizationStore.getState().setSelectedOrganizationId(null);
          await queryClient.clear();
        }
      },
    }),
    [clearAvatarObjectUrl, queryClient, refreshUser, sessionExpired, status, user],
  );

  useEffect(
    () => () => {
      if (avatarObjectUrlRef.current) URL.revokeObjectURL(avatarObjectUrlRef.current);
    },
    [],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// This hook intentionally shares the provider's context for the app shell and routes.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
