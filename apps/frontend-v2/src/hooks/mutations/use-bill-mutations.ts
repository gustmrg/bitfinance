import { useMutation, useQueryClient } from "@tanstack/react-query";
import { billsService } from "@/api/bills/bills.service";
import { BillInput } from "@/api/bills/bills.types";
import { queryKeys } from "@/lib/query-keys";

export function useBillMutations(organizationId: string | null) {
  const client = useQueryClient();
  const invalidate = () => {
    void client.invalidateQueries({ queryKey: queryKeys.bills.all });
    void client.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };
  return {
    create: useMutation({
      mutationFn: (input: BillInput) => billsService.createAsync(organizationId!, input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string;
        input: Omit<BillInput, "frequency" | "installments">;
      }) => billsService.updateAsync(organizationId!, id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => billsService.deleteAsync(organizationId!, id),
      onSuccess: invalidate,
    }),
    upload: useMutation({
      mutationFn: ({ id, file, category }: { id: string; file: File; category: string }) =>
        billsService.uploadDocumentAsync(organizationId!, id, file, category),
      onSuccess: invalidate,
    }),
    removeDocument: useMutation({
      mutationFn: ({ billId, documentId }: { billId: string; documentId: string }) =>
        billsService.deleteDocumentAsync(organizationId!, billId, documentId),
      onSuccess: invalidate,
    }),
    stopSeries: useMutation({
      mutationFn: (seriesId: string) => billsService.stopSeriesAsync(organizationId!, seriesId),
      onSuccess: invalidate,
    }),
  };
}
