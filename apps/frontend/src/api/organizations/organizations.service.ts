import { privateAPI } from "@/lib/axios";

import { normalizeError } from "@/api/shared/normalize-error";

import type {
  CreateInvitationRequest,
  CreateInvitationResponse,
  CreateOrganizationRequest,
  OrganizationDetails,
  OrganizationRole,
  OrganizationSummary,
  UpdateOrganizationRequest,
} from "./organizations.types";

const authApi = privateAPI();

const organizationRoleToApiValue: Record<OrganizationRole, number> = {
  Owner: 1,
  Admin: 2,
  Member: 3,
};

function mapInviteRole(role?: OrganizationRole | null) {
  if (!role) {
    return undefined;
  }

  return organizationRoleToApiValue[role];
}

export const organizationsService = {
  async listAsync(): Promise<OrganizationSummary[]> {
    try {
      const response = await authApi.get<OrganizationSummary[]>("/organizations");
      return response.data;
    } catch (error) {
      throw normalizeError(error, "Failed to fetch organizations.");
    }
  },

  async getAsync(organizationId: string): Promise<OrganizationDetails> {
    try {
      const response = await authApi.get<OrganizationDetails>(
        `/organizations/${organizationId}`
      );

      return response.data;
    } catch (error) {
      throw normalizeError(error, "Failed to fetch organization details.");
    }
  },

  async createAsync(
    request: CreateOrganizationRequest
  ): Promise<OrganizationSummary> {
    try {
      const response = await authApi.post<OrganizationSummary>("/organizations", {
        name: request.name,
      });

      return response.data;
    } catch (error) {
      throw normalizeError(error, "Failed to create organization.");
    }
  },

  async updateAsync(
    request: UpdateOrganizationRequest
  ): Promise<OrganizationSummary> {
    try {
      const response = await authApi.patch<OrganizationSummary>(
        `/organizations/${request.organizationId}`,
        {
          name: request.name,
        }
      );

      return response.data;
    } catch (error) {
      throw normalizeError(error, "Failed to update organization.");
    }
  },

  async createInviteAsync(
    request: CreateInvitationRequest
  ): Promise<CreateInvitationResponse> {
    try {
      const response = await authApi.post<CreateInvitationResponse>(
        `/organizations/${request.organizationId}/invite`,
        {
          email: request.email,
          role: mapInviteRole(request.role),
        }
      );

      return response.data;
    } catch (error) {
      throw normalizeError(error, "Failed to create organization invite.");
    }
  },

  async joinAsync(token: string): Promise<void> {
    try {
      await authApi.post("/organizations/join", undefined, {
        params: { token },
      });
    } catch (error) {
      throw normalizeError(error, "Failed to join organization.");
    }
  },
};
