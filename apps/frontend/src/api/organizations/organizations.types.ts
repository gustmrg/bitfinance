export type OrganizationRole = "Owner" | "Admin" | "Member";
export const inviteOrganizationRoles = ["Admin", "Member"] as const;
export type InviteOrganizationRole = (typeof inviteOrganizationRoles)[number];

export interface OrganizationSummary {
  id: string;
  name: string;
}

export interface OrganizationMember {
  id: string;
  username: string;
  email: string;
  role: OrganizationRole;
  joinedAt: string;
}

export interface OrganizationBudgetDetails {
  id: string;
  amount: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface OrganizationBudget extends OrganizationBudgetDetails {
  organizationId: string;
}

export interface OrganizationDetails {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string | null;
  budget: OrganizationBudgetDetails | null;
  members: OrganizationMember[];
}

export interface CreateOrganizationRequest {
  name: string;
}

export interface UpdateOrganizationRequest {
  organizationId: string;
  name: string;
}

export interface UpsertOrganizationBudgetRequest {
  organizationId: string;
  amount: number;
}

export interface CreateInvitationRequest {
  organizationId: string;
  email: string;
  role?: InviteOrganizationRole | null;
}

export interface CreateInvitationResponse {
  id: string;
  token: string;
  expiresAt: string;
}

export interface UpdateMemberRoleRequest {
  organizationId: string;
  userId: string;
  role: InviteOrganizationRole;
}

export interface RemoveOrganizationMemberRequest {
  organizationId: string;
  userId: string;
}
