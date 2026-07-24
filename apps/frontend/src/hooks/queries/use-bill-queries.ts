import { useQuery } from "@tanstack/react-query";
import { billsService } from "@/api/bills/bills.service";
import { BillListFilters } from "@/api/bills/bills.types";
import { queryKeys } from "@/lib/query-keys";

export function useBillsQuery(filters: BillListFilters | null) {
  return useQuery({
    queryKey: filters
      ? queryKeys.bills.list(
          filters.organizationId,
          filters.page,
          filters.pageSize,
          filters.from,
          filters.to,
          filters.status,
          filters.description,
        )
      : ["bills", "disabled"],
    queryFn: () => billsService.listAsync(filters!),
    enabled: Boolean(filters),
  });
}

export function useBillQuery(organizationId: string | null, billId?: string) {
  return useQuery({
    queryKey: queryKeys.bills.detail(organizationId ?? "", billId ?? ""),
    queryFn: () => billsService.getAsync(organizationId!, billId!),
    enabled: Boolean(organizationId && billId),
  });
}
