import type { OrganizationSummary, PlanTier } from "../auth/auth.types";
export type { OrganizationSummary, PlanTier } from "../auth/auth.types";

export interface OrganizationDetails extends OrganizationSummary {
  createdAt: string;
  updatedAt?: string | null;
  planTier: PlanTier;
  planExpiresAt: string;
  budget: { id: string; amount: number; createdAt: string; updatedAt?: string | null } | null;
  members: Array<{
    id: string;
    username: string;
    email: string;
    role: "Owner" | "Admin" | "Member";
    joinedAt: string;
  }>;
}

export interface InvitationResult {
  id: string;
  token: string;
  expiresAt: string;
}
export interface Budget {
  id: string;
  organizationId?: string;
  amount: number;
  createdAt: string;
  updatedAt?: string | null;
}
