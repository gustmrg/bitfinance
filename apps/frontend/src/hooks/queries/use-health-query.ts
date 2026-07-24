import { useQuery } from "@tanstack/react-query";
import { healthService } from "@/api/health/health.service";
import { queryKeys } from "@/lib/query-keys";

export function useHealthQuery() {
  return useQuery({
    queryKey: queryKeys.health.all,
    queryFn: healthService.getAsync,
    retry: 0,
    staleTime: 60_000,
  });
}
