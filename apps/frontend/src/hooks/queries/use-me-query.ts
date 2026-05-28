import { useQuery } from "@tanstack/react-query";

import { authService } from "@/api/auth";
import type { User } from "@/auth/types";
import { queryKeys } from "@/lib/query-keys";

export async function fetchMeAsync(): Promise<User> {
  return authService.getMeAsync();
}

export function useMeQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: fetchMeAsync,
    enabled,
  });
}
