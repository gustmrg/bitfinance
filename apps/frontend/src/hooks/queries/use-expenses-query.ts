import { useQuery } from "@tanstack/react-query";

import { expensesService, type Expense } from "@/api/expenses";
import { queryKeys } from "@/lib/query-keys";

export interface ExpensesQueryFilters {
  from?: Date;
  to?: Date;
}

function normalizeExpenseStatus(status: string): Expense["status"] {
  return status.toLowerCase() as Expense["status"];
}

function mapExpenseResponse(expense: Expense): Expense {
  return {
    ...expense,
    documents: expense.documents ?? [],
    status: normalizeExpenseStatus(expense.status),
  };
}

export function useExpensesQuery(
  organizationId: string | null,
  filters: ExpensesQueryFilters
) {
  return useQuery({
    queryKey: queryKeys.expenses.list(
      organizationId ?? "",
      filters.from,
      filters.to
    ),
    enabled: Boolean(organizationId),
    queryFn: async (): Promise<Expense[]> => {
      if (!organizationId) {
        return [];
      }

      const response = await expensesService.listAsync({
        organizationId,
        from: filters.from,
        to: filters.to,
      });

      return response.data.map(mapExpenseResponse);
    },
  });
}
