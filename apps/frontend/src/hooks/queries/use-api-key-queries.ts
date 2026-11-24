import { useQuery } from "@tanstack/react-query";
import { apiKeysService } from "@/api/api-keys/api-keys.service";
import { queryKeys } from "@/lib/query-keys";

export function useApiKeysQuery() {
  return useQuery({ queryKey: queryKeys.apiKeys.all, queryFn: apiKeysService.listAsync });
}
