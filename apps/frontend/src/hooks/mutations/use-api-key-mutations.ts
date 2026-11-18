import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiKeysService } from "@/api/api-keys/api-keys.service";
import { queryKeys } from "@/lib/query-keys";

export function useApiKeyMutations() {
  const client = useQueryClient();
  const invalidate = () => void client.invalidateQueries({ queryKey: queryKeys.apiKeys.all });
  return {
    create: useMutation({ mutationFn: apiKeysService.createAsync, onSuccess: invalidate }),
    revoke: useMutation({ mutationFn: apiKeysService.revokeAsync, onSuccess: invalidate }),
  };
}
