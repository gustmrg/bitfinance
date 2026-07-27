export type PlanTier = "Free" | "Basic" | "Premium";

export interface OrganizationSummary {
  id: string;
  name: string;
  planTier?: PlanTier;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  organizations: OrganizationSummary[];
  hasAvatar: boolean;
  avatarUrl?: string | null;
}

export interface AuthSessionResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: { id: string; email: string; userName: string; firstName: string; lastName: string };
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends AuthCredentials {
  firstName: string;
  lastName: string;
}

interface MeResponse {
  id: string;
  fullName: string;
  email: string;
  userName: string;
  organizations?: OrganizationSummary[];
  hasAvatar?: boolean;
}

export function mapMeResponse(response: MeResponse): User {
  return {
    id: response.id,
    username: response.userName,
    fullName: response.fullName,
    email: response.email,
    organizations: response.organizations ?? [],
    hasAvatar: response.hasAvatar ?? false,
  };
}
