import type { User } from "@/auth/types";

export interface AuthSessionUser {
  id: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
}

export interface AuthSessionResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: AuthSessionUser;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface MeApiResponse {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  organizations?: User["organizations"];
}
