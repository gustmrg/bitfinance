import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "../api/shared/errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => !(error instanceof ApiError && error.status && error.status < 500) && failureCount < 2,
    },
  },
});
