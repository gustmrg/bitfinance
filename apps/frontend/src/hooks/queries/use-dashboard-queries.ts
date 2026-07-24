import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/api/dashboard/dashboard.service";
import { queryKeys } from "@/lib/query-keys";

export function useDashboardQueries(organizationId: string | null, from?: Date, to?: Date) {
  const enabled = Boolean(organizationId);
  return {
    summary: useQuery({
      queryKey: queryKeys.dashboard.summary(organizationId ?? "", from, to),
      queryFn: () => dashboardService.getSummaryAsync(organizationId!, { from, to }),
      enabled,
    }),
    upcoming: useQuery({
      queryKey: queryKeys.dashboard.upcoming(organizationId ?? "", from, to),
      queryFn: () => dashboardService.getUpcomingBillsAsync(organizationId!, { from, to }),
      enabled,
    }),
    recent: useQuery({
      queryKey: queryKeys.dashboard.recent(organizationId ?? "", from, to),
      queryFn: () => dashboardService.getRecentExpensesAsync(organizationId!, { from, to }),
      enabled,
    }),
  };
}
