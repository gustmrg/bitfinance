import { useQuery } from "@tanstack/react-query";

import { billsService, type Bill } from "@/api/bills";
import { queryKeys } from "@/lib/query-keys";

function normalizeBillStatus(status: string): Bill["status"] {
  return status.toLowerCase() as Bill["status"];
}

function mapBillResponse(bill: Bill): Bill {
  return {
    ...bill,
    createdDate: bill.createdAt ?? bill.createdDate ?? "",
    documents: bill.documents ?? [],
    status: normalizeBillStatus(bill.status),
  };
}

export function useBillQuery(
  organizationId: string | null,
  billId: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.bills.detail(organizationId ?? "", billId ?? ""),
    enabled: Boolean(organizationId) && Boolean(billId),
    queryFn: async (): Promise<Bill> => {
      if (!organizationId || !billId) {
        throw new Error("Missing organizationId or billId.");
      }

      const response = await billsService.getAsync(organizationId, billId);

      return mapBillResponse(response);
    },
  });
}
