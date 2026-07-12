import { authApi } from "../shared/client";
import { normalizeApiError } from "../shared/errors";
import type { OrganizationSummary } from "../auth/auth.types";
import type { Budget, InvitationResult, OrganizationDetails } from "./organizations.types";

export const organizationsService = {
  async listAsync(): Promise<OrganizationSummary[]> {
    try { return (await authApi.get<OrganizationSummary[]>("/organizations")).data; }
    catch (error) { throw normalizeApiError(error, "Unable to load organizations."); }
  },
  async getAsync(organizationId: string): Promise<OrganizationDetails> {
    try { return (await authApi.get<OrganizationDetails>(`/organizations/${organizationId}`)).data; }
    catch (error) { throw normalizeApiError(error, "Unable to load this organization."); }
  },
  async createAsync(name: string): Promise<OrganizationSummary> {
    try { return (await authApi.post<OrganizationSummary>("/organizations", { name })).data; }
    catch (error) { throw normalizeApiError(error, "Unable to create the organization."); }
  },
  async updateAsync(organizationId: string, name: string): Promise<OrganizationSummary> {
    try { return (await authApi.patch<OrganizationSummary>(`/organizations/${organizationId}`, { name })).data; }
    catch (error) { throw normalizeApiError(error, "Unable to update the organization."); }
  },
  async getBudgetAsync(organizationId: string): Promise<Budget | null> {
    try { return (await authApi.get<Budget>(`/organizations/${organizationId}/budget`)).data; }
    catch (error) { const normalized = normalizeApiError(error, "Unable to load the budget."); if (normalized.status === 404) return null; throw normalized; }
  },
  async upsertBudgetAsync(organizationId: string, amount: number): Promise<Budget> {
    try { return (await authApi.put<Budget>(`/organizations/${organizationId}/budget`, { amount })).data; }
    catch (error) { throw normalizeApiError(error, "Unable to save the budget."); }
  },
  async createInviteAsync(organizationId: string, email: string, role: "Owner" | "Admin" | "Member"): Promise<InvitationResult> {
    try {
      const roleValue = { Owner: 1, Admin: 2, Member: 3 }[role];
      return (await authApi.post<InvitationResult>(`/organizations/${organizationId}/invite`, { email, role: roleValue })).data;
    } catch (error) { throw normalizeApiError(error, "Unable to create the invitation."); }
  },
  async joinAsync(token: string) {
    try { return (await authApi.post<OrganizationSummary>(`/organizations/join?token=${encodeURIComponent(token)}`)).data; }
    catch (error) { throw normalizeApiError(error, "Unable to join the organization."); }
  },
};
