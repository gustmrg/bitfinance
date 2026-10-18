import { useQuery } from "@tanstack/react-query";
import { authService } from "@/api/auth/auth.service";
import { queryKeys } from "@/lib/query-keys";

export function useExternalProvidersQuery() {
  return useQuery({
    queryKey: queryKeys.auth.providers(),
    queryFn: authService.getExternalProvidersAsync,
    staleTime: Infinity,
  });
}
