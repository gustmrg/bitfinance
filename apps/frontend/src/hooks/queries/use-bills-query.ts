import { useQuery } from "@tanstack/react-query";

import { billsService, type Bill, type BillStatus } from "@/api/bills";
import { queryKeys } from "@/lib/query-keys";

export interface BillsQueryFilters {
  from?: Date;
  to?: Date;
  status?: BillStatus[];
  description?: string;
}

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

export function useBillsQuery(
  organizationId: string | null,
  filters: BillsQueryFilters
) {
  return useQuery({
    queryKey: queryKeys.bills.list(
      organizationId ?? "",
      filters.from,
      filters.to,
      filters.status,
      filters.description
    ),
    enabled: Boolean(organizationId),
    queryFn: async (): Promise<Bill[]> => {
      if (!organizationId) {
        return [];
      }

      const response = await billsService.listAsync({
        organizationId,
        from: filters.from,
        to: filters.to,
        status: filters.status,
        description: filters.description,
      });

      return response.data.map(mapBillResponse);
    },
  });
}
