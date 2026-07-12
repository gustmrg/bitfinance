import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authService } from "../api/auth/auth.service";
import type { AuthCredentials, RegisterCredentials, User } from "../api/auth/auth.types";
import { setSessionExpiredListener } from "../api/shared/session-events";
import { clearAccessToken, setAccessToken } from "../lib/auth-token";
import { queryKeys } from "../lib/query-keys";
import { useOrganizationStore } from "./auth-store";

type AuthStatus = "initializing" | "authenticated" | "unauthenticated";
interface AuthContextValue { status: AuthStatus; user: User | null; signIn: (credentials: AuthCredentials | RegisterCredentials) => Promise<User>; refreshUser: () => Promise<User>; signOut: (allDevices?: boolean) => Promise<void> }
const AuthContext = createContext<AuthContextValue | null>(null);

function selectInitialOrganization(user: User) {
  const current = useOrganizationStore.getState().selectedOrganizationId;
  const valid = user.organizations.some((organization) => organization.id === current);
  useOrganizationStore.getState().setSelectedOrganizationId(valid ? current : user.organizations[0]?.id ?? null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("initializing");
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = useCallback(async () => {
    const next = await authService.getMeAsync();
    setUser(next); selectInitialOrganization(next); setStatus("authenticated");
    queryClient.setQueryData(queryKeys.auth.me(), next);
    return next;
  }, [queryClient]);

  useEffect(() => {
    const expire = () => { clearAccessToken(); setUser(null); setStatus("unauthenticated"); void queryClient.clear(); };
    setSessionExpiredListener(expire);
    void authService.refreshAsync().then((session) => { setAccessToken(session.accessToken, session.accessTokenExpiresAt); return refreshUser(); }).catch(expire);
    return () => setSessionExpiredListener(null);
  }, [queryClient, refreshUser]);

  const value = useMemo<AuthContextValue>(() => ({
    status, user,
    signIn: async (credentials) => {
      const session = "firstName" in credentials ? await authService.registerAsync(credentials) : await authService.loginAsync(credentials);
      setAccessToken(session.accessToken, session.accessTokenExpiresAt);
      return refreshUser();
    },
    refreshUser,
    signOut: async (allDevices = false) => {
      try { await authService[allDevices ? "logoutAllAsync" : "logoutAsync"](); } finally { clearAccessToken(); setUser(null); setStatus("unauthenticated"); useOrganizationStore.getState().setSelectedOrganizationId(null); await queryClient.clear(); }
    },
  }), [queryClient, refreshUser, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// This hook intentionally shares the provider's context for the app shell and routes.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
