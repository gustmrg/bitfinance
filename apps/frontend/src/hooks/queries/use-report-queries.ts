import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/api/reports/reports.service";
import { queryKeys } from "@/lib/query-keys";

export function useReportQuery(organizationId: string | null, months: number) {
  return useQuery({
    queryKey: queryKeys.reports.summary(organizationId ?? "", months),
    queryFn: () => reportsService.getAsync(organizationId!, months),
    enabled: Boolean(organizationId),
  });
}
