import { authApi } from "../shared/client";
import { normalizeApiError } from "../shared/errors";
import type { OrganizationSummary } from "../auth/auth.types";
import type { Budget, InvitationResult, OrganizationDetails } from "./organizations.types";

export type OrganizationMemberRole = "Owner" | "Admin" | "Member";
export type EditableOrganizationMemberRole = "Admin" | "Member";

export const organizationsService = {
  async listAsync(): Promise<OrganizationSummary[]> {
    try { return (await authApi.get<OrganizationSummary[]>("/organizations")).data; }
    catch (error) { throw normalizeApiError(error, "api.organizations.load"); }
  },
  async getAsync(organizationId: string): Promise<OrganizationDetails> {
    try { return (await authApi.get<OrganizationDetails>(`/organizations/${organizationId}`)).data; }
    catch (error) { throw normalizeApiError(error, "api.organizations.loadOne"); }
  },
  async createAsync(name: string): Promise<OrganizationSummary> {
    try { return (await authApi.post<OrganizationSummary>("/organizations", { name })).data; }
    catch (error) { throw normalizeApiError(error, "api.organizations.create"); }
  },
  async updateAsync(organizationId: string, name: string): Promise<OrganizationSummary> {
    try { return (await authApi.patch<OrganizationSummary>(`/organizations/${organizationId}`, { name })).data; }
    catch (error) { throw normalizeApiError(error, "api.organizations.update"); }
  },
  async getBudgetAsync(organizationId: string): Promise<Budget | null> {
    try { return (await authApi.get<Budget>(`/organizations/${organizationId}/budget`)).data; }
    catch (error) { const normalized = normalizeApiError(error, "api.organizations.loadBudget"); if (normalized.status === 404) return null; throw normalized; }
  },
  async upsertBudgetAsync(organizationId: string, amount: number): Promise<Budget> {
    try { return (await authApi.put<Budget>(`/organizations/${organizationId}/budget`, { amount })).data; }
    catch (error) { throw normalizeApiError(error, "api.organizations.saveBudget"); }
  },
  async createInviteAsync(organizationId: string, email: string, role: EditableOrganizationMemberRole): Promise<InvitationResult> {
    try {
      const roleValue = { Admin: 2, Member: 3 }[role];
      return (await authApi.post<InvitationResult>(`/organizations/${organizationId}/invite`, { email, role: roleValue })).data;
    } catch (error) { throw normalizeApiError(error, "api.organizations.createInvitation"); }
  },
  async updateMemberRoleAsync(organizationId: string, userId: string, role: EditableOrganizationMemberRole): Promise<void> {
    try { await authApi.patch(`/organizations/${organizationId}/members/${userId}/role`, { role }); }
    catch (error) { throw normalizeApiError(error, "api.organizations.updateRole"); }
  },
  async removeMemberAsync(organizationId: string, userId: string): Promise<void> {
    try { await authApi.delete(`/organizations/${organizationId}/members/${userId}`); }
    catch (error) { throw normalizeApiError(error, "api.organizations.removeMember"); }
  },
  async joinAsync(token: string): Promise<void> {
    try { await authApi.post(`/organizations/join?token=${encodeURIComponent(token)}`); }
    catch (error) { throw normalizeApiError(error, "api.organizations.join"); }
  },
};
