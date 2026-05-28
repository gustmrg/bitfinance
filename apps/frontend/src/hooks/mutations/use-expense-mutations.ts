import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  expensesService,
  type CreateExpenseRequest,
  type ExpenseFileCategory,
  type UpdateExpenseRequest,
} from "@/api/expenses";
import { queryKeys } from "@/lib/query-keys";

interface UploadExpenseDocumentsPayload {
  expenseId: string;
  files: File[];
  fileCategory: ExpenseFileCategory;
}

interface DeleteExpenseDocumentPayload {
  expenseId: string;
  documentId: string;
}

interface UseExpenseMutationsOptions {
  organizationId: string | null;
}

function requireOrganizationId(organizationId: string | null): string {
  if (!organizationId) {
    throw new Error("No organization selected.");
  }

  return organizationId;
}

export function useExpenseMutations({
  organizationId,
}: UseExpenseMutationsOptions) {
  const queryClient = useQueryClient();

  const invalidateExpenseQueries = async (orgId: string, expenseId?: string) => {
    const promises: Promise<void>[] = [
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.listByOrganization(orgId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.recentExpenses(orgId),
      }),
    ];

    if (expenseId) {
      promises.push(
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.detail(orgId, expenseId),
        })
      );
    }

    await Promise.all(promises);
  };

  const addExpenseMutation = useMutation({
    mutationFn: async (
      request: Omit<CreateExpenseRequest, "organizationId">
    ) => {
      const orgId = requireOrganizationId(organizationId);

      return expensesService.createAsync({
        ...request,
        organizationId: orgId,
      });
    },
    onSuccess: async () => {
      if (organizationId) {
        await invalidateExpenseQueries(organizationId);
      }
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async (request: Omit<UpdateExpenseRequest, "organizationId">) => {
      const orgId = requireOrganizationId(organizationId);

      return expensesService.updateAsync({
        ...request,
        organizationId: orgId,
      });
    },
    onSuccess: async (_data, variables) => {
      if (organizationId) {
        await invalidateExpenseQueries(organizationId, variables.id);
      }
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const orgId = requireOrganizationId(organizationId);
      return expensesService.deleteAsync(expenseId, orgId);
    },
    onSuccess: async (_data, expenseId) => {
      if (organizationId) {
        await invalidateExpenseQueries(organizationId, expenseId);
      }
    },
  });

  const uploadExpenseDocumentsMutation = useMutation({
    mutationFn: async (payload: UploadExpenseDocumentsPayload) => {
      const orgId = requireOrganizationId(organizationId);

      return expensesService.uploadDocumentsAsync({
        organizationId: orgId,
        expenseId: payload.expenseId,
        files: payload.files,
        fileCategory: payload.fileCategory,
      });
    },
    onSuccess: async (_data, variables) => {
      if (organizationId) {
        await invalidateExpenseQueries(organizationId, variables.expenseId);
      }
    },
  });

  const deleteExpenseDocumentMutation = useMutation({
    mutationFn: async (payload: DeleteExpenseDocumentPayload) => {
      const orgId = requireOrganizationId(organizationId);

      return expensesService.deleteDocumentAsync({
        organizationId: orgId,
        expenseId: payload.expenseId,
        documentId: payload.documentId,
      });
    },
    onSuccess: async (_data, variables) => {
      if (organizationId) {
        await invalidateExpenseQueries(organizationId, variables.expenseId);
      }
    },
  });

  return {
    addExpenseAsync: addExpenseMutation.mutateAsync,
    deleteExpenseAsync: deleteExpenseMutation.mutateAsync,
    deleteExpenseDocumentAsync: deleteExpenseDocumentMutation.mutateAsync,
    updateExpenseAsync: updateExpenseMutation.mutateAsync,
    uploadExpenseDocumentsAsync: uploadExpenseDocumentsMutation.mutateAsync,
    isAddingExpense: addExpenseMutation.isPending,
    isDeletingExpense: deleteExpenseMutation.isPending,
    isDeletingExpenseDocument: deleteExpenseDocumentMutation.isPending,
    isUpdatingExpense: updateExpenseMutation.isPending,
    isUploadingExpenseDocuments: uploadExpenseDocumentsMutation.isPending,
  };
}
