import { useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesService } from "@/api/expenses/expenses.service";
import { ExpenseInput } from "@/api/expenses/expenses.types";
import { queryKeys } from "@/lib/query-keys";

export function useExpenseMutations(organizationId: string | null) {
  const client = useQueryClient();
  const invalidate = () => {
    void client.invalidateQueries({ queryKey: queryKeys.expenses.all });
    void client.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };
  return {
    create: useMutation({
      mutationFn: (input: ExpenseInput & { createdBy: string }) =>
        expensesService.createAsync(organizationId!, input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: ExpenseInput }) =>
        expensesService.updateAsync(organizationId!, id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => expensesService.deleteAsync(organizationId!, id),
      onSuccess: invalidate,
    }),
    upload: useMutation({
      mutationFn: ({ id, file, category }: { id: string; file: File; category: string }) =>
        expensesService.uploadDocumentAsync(organizationId!, id, file, category),
      onSuccess: invalidate,
    }),
    removeDocument: useMutation({
      mutationFn: ({ expenseId, attachmentId }: { expenseId: string; attachmentId: string }) =>
        expensesService.deleteDocumentAsync(organizationId!, expenseId, attachmentId),
      onSuccess: invalidate,
    }),
  };
}
