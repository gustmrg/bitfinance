import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { accountService } from "../api/account/account.service";
import { authService } from "../api/auth/auth.service";
import { billsService } from "../api/bills/bills.service";
import { dashboardService } from "../api/dashboard/dashboard.service";
import { expensesService } from "../api/expenses/expenses.service";
import { healthService } from "../api/health/health.service";
import { organizationsService } from "../api/organizations/organizations.service";
import type { BillInput, BillListFilters } from "../api/bills/bills.types";
import type { ExpenseInput, ExpenseListFilters } from "../api/expenses/expenses.types";
import { queryKeys } from "../lib/query-keys";

export function useHealthQuery() { return useQuery({ queryKey: queryKeys.health.all, queryFn: healthService.getAsync, retry: 0, staleTime: 60_000 }); }
export function useOrganizationsQuery(enabled = true) { return useQuery({ queryKey: queryKeys.organizations.list(), queryFn: organizationsService.listAsync, enabled }); }
export function useOrganizationQuery(organizationId: string | null) { return useQuery({ queryKey: queryKeys.organizations.detail(organizationId ?? ""), queryFn: () => organizationsService.getAsync(organizationId!), enabled: Boolean(organizationId) }); }
export function useBudgetQuery(organizationId: string | null) { return useQuery({ queryKey: queryKeys.organizations.budget(organizationId ?? ""), queryFn: () => organizationsService.getBudgetAsync(organizationId!), enabled: Boolean(organizationId) }); }
export function useDashboardQueries(organizationId: string | null, from?: Date, to?: Date) {
  const enabled = Boolean(organizationId);
  return {
    summary: useQuery({ queryKey: queryKeys.dashboard.summary(organizationId ?? "", from, to), queryFn: () => dashboardService.getSummaryAsync(organizationId!, { from, to }), enabled }),
    upcoming: useQuery({ queryKey: queryKeys.dashboard.upcoming(organizationId ?? "", from, to), queryFn: () => dashboardService.getUpcomingBillsAsync(organizationId!, { from, to }), enabled }),
    recent: useQuery({ queryKey: queryKeys.dashboard.recent(organizationId ?? "", from, to), queryFn: () => dashboardService.getRecentExpensesAsync(organizationId!, { from, to }), enabled }),
  };
}
export function useBillsQuery(filters: BillListFilters | null) { return useQuery({ queryKey: filters ? queryKeys.bills.list(filters.organizationId, filters.page, filters.pageSize, filters.from, filters.to, filters.status, filters.description) : ["bills", "disabled"], queryFn: () => billsService.listAsync(filters!), enabled: Boolean(filters) }); }
export function useBillQuery(organizationId: string | null, billId?: string) { return useQuery({ queryKey: queryKeys.bills.detail(organizationId ?? "", billId ?? ""), queryFn: () => billsService.getAsync(organizationId!, billId!), enabled: Boolean(organizationId && billId) }); }
export function useExpensesQuery(filters: ExpenseListFilters | null) { return useQuery({ queryKey: filters ? queryKeys.expenses.list(filters.organizationId, filters.page, filters.pageSize, filters.from, filters.to) : ["expenses", "disabled"], queryFn: () => expensesService.listAsync(filters!), enabled: Boolean(filters) }); }
export function useExpenseQuery(organizationId: string | null, expenseId?: string) { return useQuery({ queryKey: queryKeys.expenses.detail(organizationId ?? "", expenseId ?? ""), queryFn: () => expensesService.getAsync(organizationId!, expenseId!), enabled: Boolean(organizationId && expenseId) }); }

export function useOrganizationMutations(organizationId: string | null) {
  const client = useQueryClient();
  const invalidate = () => { void client.invalidateQueries({ queryKey: queryKeys.organizations.all }); void client.invalidateQueries({ queryKey: queryKeys.auth.me() }); void client.invalidateQueries({ queryKey: queryKeys.dashboard.all }); };
  const update = useMutation({ mutationFn: (name: string) => organizationsService.updateAsync(organizationId!, name), onSuccess: invalidate });
  const budget = useMutation({ mutationFn: (amount: number) => organizationsService.upsertBudgetAsync(organizationId!, amount), onSuccess: () => { invalidate(); void client.invalidateQueries({ queryKey: queryKeys.organizations.budget(organizationId!) }); } });
  return { update, budget };
}
export function useAccountMutations() {
  const client = useQueryClient();
  const invalidate = () => void client.invalidateQueries({ queryKey: queryKeys.auth.me() });
  return { profile: useMutation({ mutationFn: ({ firstName, lastName }: { firstName: string; lastName: string }) => accountService.updateProfileAsync(firstName, lastName), onSuccess: invalidate }), avatar: useMutation({ mutationFn: accountService.uploadAvatarAsync, onSuccess: invalidate }), deleteAvatar: useMutation({ mutationFn: accountService.deleteAvatarAsync, onSuccess: invalidate }), logoutAll: useMutation({ mutationFn: authService.logoutAllAsync }) };
}
export function useBillMutations(organizationId: string | null) {
  const client = useQueryClient();
  const invalidate = () => { void client.invalidateQueries({ queryKey: queryKeys.bills.all }); void client.invalidateQueries({ queryKey: queryKeys.dashboard.all }); };
  return { create: useMutation({ mutationFn: (input: BillInput) => billsService.createAsync(organizationId!, input), onSuccess: invalidate }), update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Omit<BillInput, "frequency" | "installments"> }) => billsService.updateAsync(organizationId!, id, input), onSuccess: invalidate }), remove: useMutation({ mutationFn: (id: string) => billsService.deleteAsync(organizationId!, id), onSuccess: invalidate }), upload: useMutation({ mutationFn: ({ id, file, category }: { id: string; file: File; category: string }) => billsService.uploadDocumentAsync(organizationId!, id, file, category), onSuccess: invalidate }), removeDocument: useMutation({ mutationFn: ({ billId, documentId }: { billId: string; documentId: string }) => billsService.deleteDocumentAsync(organizationId!, billId, documentId), onSuccess: invalidate }), stopSeries: useMutation({ mutationFn: (seriesId: string) => billsService.stopSeriesAsync(organizationId!, seriesId), onSuccess: invalidate }) };
}
export function useExpenseMutations(organizationId: string | null) {
  const client = useQueryClient();
  const invalidate = () => { void client.invalidateQueries({ queryKey: queryKeys.expenses.all }); void client.invalidateQueries({ queryKey: queryKeys.dashboard.all }); };
  return { create: useMutation({ mutationFn: (input: ExpenseInput & { createdBy: string }) => expensesService.createAsync(organizationId!, input), onSuccess: invalidate }), update: useMutation({ mutationFn: ({ id, input }: { id: string; input: ExpenseInput }) => expensesService.updateAsync(organizationId!, id, input), onSuccess: invalidate }), remove: useMutation({ mutationFn: (id: string) => expensesService.deleteAsync(organizationId!, id), onSuccess: invalidate }), upload: useMutation({ mutationFn: ({ id, file, category }: { id: string; file: File; category: string }) => expensesService.uploadDocumentAsync(organizationId!, id, file, category), onSuccess: invalidate }), removeDocument: useMutation({ mutationFn: ({ expenseId, attachmentId }: { expenseId: string; attachmentId: string }) => expensesService.deleteDocumentAsync(organizationId!, expenseId, attachmentId), onSuccess: invalidate }) };
}
