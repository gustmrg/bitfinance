import { authApi, publicApi } from "../shared/client";
import { normalizeApiError } from "../shared/errors";
import type { AuthCredentials, AuthSessionResponse, RegisterCredentials, User } from "./auth.types";
import { mapMeResponse } from "./auth.types";

export const authService = {
  async registerAsync(credentials: RegisterCredentials): Promise<AuthSessionResponse> {
    try {
      return (await publicApi.post<AuthSessionResponse>("/identity/register", credentials)).data;
    } catch (error) {
      throw normalizeApiError(error, "api.auth.createAccount");
    }
  },
  async loginAsync(credentials: AuthCredentials): Promise<AuthSessionResponse> {
    try {
      return (await publicApi.post<AuthSessionResponse>("/identity/login", credentials)).data;
    } catch (error) {
      throw normalizeApiError(error, "api.auth.signIn");
    }
  },
  async refreshAsync(): Promise<AuthSessionResponse> {
    try {
      return (await publicApi.post<AuthSessionResponse>("/identity/refresh")).data;
    } catch (error) {
      throw normalizeApiError(error, "api.auth.restoreSession");
    }
  },
  async logoutAsync() {
    try {
      await authApi.post("/identity/logout");
    } catch (error) {
      throw normalizeApiError(error, "api.auth.signOut");
    }
  },
  async logoutAllAsync() {
    try {
      await authApi.post("/identity/logout-all");
    } catch (error) {
      throw normalizeApiError(error, "api.auth.signOutAll");
    }
  },
  async getMeAsync(): Promise<User> {
    try {
      return mapMeResponse((await authApi.get("/identity/me")).data);
    } catch (error) {
      throw normalizeApiError(error, "api.auth.loadAccount");
    }
  },
};
