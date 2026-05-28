import { QueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 300_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (failureCount >= 2) {
          return false;
        }

        const statusCode = (error as AxiosError).response?.status;
        if (statusCode && statusCode < 500) {
          return false;
        }

        return true;
      },
    },
  },
});
