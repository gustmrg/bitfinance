import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface AuthClientState {
  token: string | null;
  tokenExpiresAt: string | null;
  isInitialized: boolean;
  selectedOrganizationId: string | null;
}

export interface AuthClientActions {
  setSession: (token: string | null, tokenExpiresAt?: string | null) => void;
  clearSession: () => void;
  setInitialized: (isInitialized: boolean) => void;
  setSelectedOrganizationId: (selectedOrganizationId: string | null) => void;
  resetAuthClientState: () => void;
}

type AuthStore = AuthClientState & AuthClientActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      tokenExpiresAt: null,
      isInitialized: false,
      selectedOrganizationId: null,
      setSession: (token, tokenExpiresAt) =>
        set({
          token,
          tokenExpiresAt: tokenExpiresAt ?? null,
        }),
      clearSession: () =>
        set({
          token: null,
          tokenExpiresAt: null,
        }),
      setInitialized: (isInitialized) =>
        set({
          isInitialized,
        }),
      setSelectedOrganizationId: (selectedOrganizationId) =>
        set({
          selectedOrganizationId,
        }),
      resetAuthClientState: () =>
        set({
          token: null,
          tokenExpiresAt: null,
          isInitialized: false,
          selectedOrganizationId: null,
        }),
    }),
    {
      name: "bitfinance-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedOrganizationId: state.selectedOrganizationId,
      }),
    }
  )
);
