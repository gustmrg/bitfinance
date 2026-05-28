import { api, authApi } from "@/lib/axios";

import { normalizeError } from "@/api/shared/normalize-error";
import type { User } from "@/auth/types";

import type {
  AuthSessionResponse,
  MeApiResponse,
  SignInRequest,
  SignUpRequest,
} from "./auth.types";

function mapMeApiResponse(response: MeApiResponse): User {
  return {
    id: response.id,
    username: response.username,
    fullName: response.fullName,
    email: response.email,
    avatarUrl: response.avatarUrl ?? null,
    organizations: response.organizations ?? [],
  };
}

export const authService = {
  async signInAsync(request: SignInRequest): Promise<AuthSessionResponse> {
    try {
      const response = await api.post<AuthSessionResponse>(
        "/identity/login",
        request
      );

      return response.data;
    } catch (error) {
      throw normalizeError(error, "Failed to sign in.");
    }
  },

  async signUpAsync(request: SignUpRequest): Promise<AuthSessionResponse> {
    try {
      const response = await api.post<AuthSessionResponse>(
        "/identity/register",
        request
      );

      return response.data;
    } catch (error) {
      throw normalizeError(error, "Failed to sign up.");
    }
  },

  async refreshAsync(): Promise<AuthSessionResponse> {
    try {
      const response = await api.post<AuthSessionResponse>("/identity/refresh");
      return response.data;
    } catch (error) {
      throw normalizeError(error, "Failed to restore session.");
    }
  },

  async getMeAsync(): Promise<User> {
    try {
      const response = await authApi.get<MeApiResponse>("/identity/me");
      return mapMeApiResponse(response.data);
    } catch (error) {
      throw normalizeError(error, "Failed to load current user.");
    }
  },

  async logoutAsync(): Promise<void> {
    try {
      await authApi.post("/identity/logout");
    } catch (error) {
      throw normalizeError(error, "Failed to sign out.");
    }
  },
};
