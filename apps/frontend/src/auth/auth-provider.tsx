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
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { accountService } from "../api/account/account.service";
import { authService } from "../api/auth/auth.service";
import type { AuthCredentials, RegisterCredentials, User } from "../api/auth/auth.types";
import { refreshAccessToken } from "../api/shared/client";
import { setSessionExpiredListener } from "../api/shared/session-events";
import i18n from "../i18n";
import {
  clearAccessToken,
  forgetSession,
  hadSession,
  rememberSession,
  setAccessToken,
} from "../lib/auth-token";
import { queryKeys } from "../lib/query-keys";
import { useOrganizationStore } from "./auth-store";

type AuthStatus = "initializing" | "authenticated" | "unauthenticated";
interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
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
  const avatarObjectUrlRef = useRef<string | null>(null);

  const clearAvatarObjectUrl = useCallback(() => {
    if (avatarObjectUrlRef.current) URL.revokeObjectURL(avatarObjectUrlRef.current);
    avatarObjectUrlRef.current = null;
  }, []);

  const loadAvatar = useCallback(async () => {
    let avatarUrl: string;
    try {
      avatarUrl = URL.createObjectURL(await accountService.getAvatarAsync());
    } catch {
      return;
    }

    // The user may have signed out while the avatar was downloading.
    if (!hadSession()) {
      URL.revokeObjectURL(avatarUrl);
      return;
    }

    clearAvatarObjectUrl();
    avatarObjectUrlRef.current = avatarUrl;
    setUser((current) => (current ? { ...current, avatarUrl } : current));
    queryClient.setQueryData<User>(queryKeys.auth.me(), (current) =>
      current ? { ...current, avatarUrl } : current,
    );
  }, [clearAvatarObjectUrl, queryClient]);

  // The avatar loads in the background so a slow download doesn't hold the session in "initializing".
  const refreshUser = useCallback(async () => {
    const next = await authService.getMeAsync();
    if (!next.hasAvatar) clearAvatarObjectUrl();

    const withAvatar = { ...next, avatarUrl: avatarObjectUrlRef.current };
    rememberSession();
    setUser(withAvatar);
    selectInitialOrganization(withAvatar);
    setStatus("authenticated");
    queryClient.setQueryData(queryKeys.auth.me(), withAvatar);
    if (next.hasAvatar) void loadAvatar();
    return withAvatar;
  }, [clearAvatarObjectUrl, loadAvatar, queryClient]);

  useEffect(() => {
    const expire = (error: unknown) => {
      if (hadSession()) {
        const unauthorized = isAxiosError(error) && error.response?.status === 401;
        toast.error(i18n.t(unauthorized ? "auth.sessionExpired" : "api.auth.restoreSession"));
      }
      forgetSession();
      clearAccessToken();
      clearAvatarObjectUrl();
      setUser(null);
      setStatus("unauthenticated");
      void queryClient.clear();
    };
    setSessionExpiredListener(expire);
    void refreshAccessToken()
      .then(() => refreshUser())
      .catch(expire);
    return () => setSessionExpiredListener(null);
  }, [clearAvatarObjectUrl, queryClient, refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      signIn: async (credentials) => {
        const session =
          "firstName" in credentials
            ? await authService.registerAsync(credentials)
            : await authService.loginAsync(credentials);
        setAccessToken(session.accessToken, session.accessTokenExpiresAt);
        return refreshUser();
      },
      refreshUser,
      signOut: async (allDevices = false) => {
        try {
          await authService[allDevices ? "logoutAllAsync" : "logoutAsync"]();
        } finally {
          forgetSession();
          clearAccessToken();
          clearAvatarObjectUrl();
          setUser(null);
          setStatus("unauthenticated");
          useOrganizationStore.getState().setSelectedOrganizationId(null);
          await queryClient.clear();
        }
      },
    }),
    [clearAvatarObjectUrl, queryClient, refreshUser, status, user],
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
