import { authApi } from "../shared/client";
import { normalizeApiError } from "../shared/errors";
import type { DashboardBill, DashboardExpense, DashboardSummary } from "./dashboard.types";

type DateFilters = { from?: Date; to?: Date };
const params = (filters?: DateFilters) => ({ from: filters?.from?.toISOString(), to: filters?.to?.toISOString() });
const lower = (value: string) => value.toLowerCase();

export const dashboardService = {
  async getSummaryAsync(organizationId: string, filters?: DateFilters) {
    try { return (await authApi.get<DashboardSummary>(`/organizations/${organizationId}/dashboard/summary`, { params: params(filters) })).data; }
    catch (error) { throw normalizeApiError(error, "api.dashboard.summary"); }
  },
  async getUpcomingBillsAsync(organizationId: string, filters?: DateFilters): Promise<DashboardBill[]> {
    try { const data = (await authApi.get<{ data: DashboardBill[] }>(`/organizations/${organizationId}/dashboard/upcoming-bills`, { params: params(filters) })).data.data; return data.map((item) => ({ ...item, category: lower(item.category), status: lower(item.status) })); }
    catch (error) { throw normalizeApiError(error, "api.dashboard.upcoming"); }
  },
  async getRecentExpensesAsync(organizationId: string, filters?: DateFilters): Promise<DashboardExpense[]> {
    try { const data = (await authApi.get<{ data: DashboardExpense[] }>(`/organizations/${organizationId}/dashboard/recent-expenses`, { params: params(filters) })).data.data; return data.map((item) => ({ ...item, category: lower(item.category) })); }
    catch (error) { throw normalizeApiError(error, "api.dashboard.recent"); }
  },
};
