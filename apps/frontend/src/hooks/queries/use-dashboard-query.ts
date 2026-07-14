import { useQuery } from "@tanstack/react-query";

import type { ExpenseResponseModel } from "@/api/dashboard/get-recent-expenses";
import { getRecentExpenses } from "@/api/dashboard/get-recent-expenses";
import {
  getDashboardSummary,
  type DashboardSummaryResponse,
} from "@/api/dashboard/get-summary";
import {
  getUpcomingBills,
  type UpcomingBillResponseModel,
} from "@/api/dashboard/get-upcoming-bills";
import type { Bill } from "@/api/bills";
import { queryKeys } from "@/lib/query-keys";

function mapUpcomingBillResponse(bill: UpcomingBillResponseModel): Bill {
  return {
    ...bill,
    status: bill.status.toLowerCase() as Bill["status"],
    createdDate: bill.createdAt ?? bill.createdDate ?? "",
  };
}

function mapRecentExpenseResponse(
  expense: ExpenseResponseModel
): ExpenseResponseModel {
  return {
    ...expense,
    category: expense.category.toLowerCase() as ExpenseResponseModel["category"],
  };
}

export interface DashboardDateFilters {
  from?: Date;
  to?: Date;
}

export function useDashboardSummaryQuery(
  organizationId: string | null,
  filters?: DashboardDateFilters,
) {
  const from = filters?.from;
  const to = filters?.to;

  return useQuery({
    queryKey: [
      ...queryKeys.dashboard.summary(organizationId ?? ""),
      from?.toISOString(),
      to?.toISOString(),
    ],
    enabled: Boolean(organizationId),
    queryFn: async (): Promise<DashboardSummaryResponse> => {
      if (!organizationId) {
        return {
          monthlyBudget: null,
          spentThisMonth: 0,
          remainingBudget: null,
          spentPercentage: null,
          upcomingBillsAmount: 0,
          upcomingBillsCount: 0,
        };
      }

      return getDashboardSummary(organizationId, { from, to });
    },
  });
}

export function useUpcomingBillsQuery(
  organizationId: string | null,
  filters?: DashboardDateFilters,
) {
  const from = filters?.from;
  const to = filters?.to;

  return useQuery({
    queryKey: [
      ...queryKeys.dashboard.upcomingBills(organizationId ?? ""),
      from?.toISOString(),
      to?.toISOString(),
    ],
    enabled: Boolean(organizationId),
    queryFn: async (): Promise<Bill[]> => {
      if (!organizationId) {
        return [];
      }

      const response = await getUpcomingBills(organizationId, { from, to });
      return response.data.map(mapUpcomingBillResponse);
    },
  });
}

export function useRecentExpensesQuery(
  organizationId: string | null,
  filters?: DashboardDateFilters,
) {
  const from = filters?.from;
  const to = filters?.to;

  return useQuery({
    queryKey: [
      ...queryKeys.dashboard.recentExpenses(organizationId ?? ""),
      from?.toISOString(),
      to?.toISOString(),
    ],
    enabled: Boolean(organizationId),
    queryFn: async (): Promise<ExpenseResponseModel[]> => {
      if (!organizationId) {
        return [];
      }

      const response = await getRecentExpenses(organizationId, { from, to });
      return response.data.map(mapRecentExpenseResponse);
    },
  });
}
