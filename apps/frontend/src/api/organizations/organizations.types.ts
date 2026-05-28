export type OrganizationRole = "Owner" | "Admin" | "Member";

export interface OrganizationSummary {
  id: string;
  name: string;
}

export interface OrganizationMember {
  id: string;
  username: string;
  email: string;
  role?: OrganizationRole | null;
}

export interface OrganizationDetails {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string | null;
  members: OrganizationMember[];
}

export interface CreateOrganizationRequest {
  name: string;
}

export interface UpdateOrganizationRequest {
  organizationId: string;
  name: string;
}

export interface CreateInvitationRequest {
  organizationId: string;
  email: string;
  role?: OrganizationRole | null;
}

export interface CreateInvitationResponse {
  id: string;
  token: string;
  expiresAt: string;
}
