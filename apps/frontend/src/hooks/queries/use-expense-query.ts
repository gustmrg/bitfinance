import { useQuery } from "@tanstack/react-query";

import { expensesService, type Expense } from "@/api/expenses";
import { queryKeys } from "@/lib/query-keys";

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

export function useExpenseQuery(
  organizationId: string | null,
  expenseId: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(organizationId ?? "", expenseId ?? ""),
    enabled: Boolean(organizationId) && Boolean(expenseId),
    queryFn: async (): Promise<Expense> => {
      if (!organizationId || !expenseId) {
        throw new Error("Missing organizationId or expenseId.");
      }

      const response = await expensesService.getAsync(organizationId, expenseId);

      return mapExpenseResponse(response);
    },
  });
}
