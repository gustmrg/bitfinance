import { useQuery } from "@tanstack/react-query";
import { expensesService } from "@/api/expenses/expenses.service";
import { ExpenseListFilters } from "@/api/expenses/expenses.types";
import { queryKeys } from "@/lib/query-keys";

export function useExpensesQuery(filters: ExpenseListFilters | null) {
  return useQuery({
    queryKey: filters
      ? queryKeys.expenses.list(
          filters.organizationId,
          filters.page,
          filters.pageSize,
          filters.from,
          filters.to,
        )
      : ["expenses", "disabled"],
    queryFn: () => expensesService.listAsync(filters!),
    enabled: Boolean(filters),
  });
}

export function useExpenseQuery(organizationId: string | null, expenseId?: string) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(organizationId ?? "", expenseId ?? ""),
    queryFn: () => expensesService.getAsync(organizationId!, expenseId!),
    enabled: Boolean(organizationId && expenseId),
  });
}
