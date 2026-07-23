import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accountService } from "@/api/account/account.service";
import { authService } from "@/api/auth/auth.service";
import { queryKeys } from "@/lib/query-keys";

export function useAccountMutations() {
  const client = useQueryClient();
  const invalidate = () => void client.invalidateQueries({ queryKey: queryKeys.auth.me() });
  return {
    profile: useMutation({
      mutationFn: ({ firstName, lastName }: { firstName: string; lastName: string }) =>
        accountService.updateProfileAsync(firstName, lastName),
      onSuccess: invalidate,
    }),
    avatar: useMutation({ mutationFn: accountService.uploadAvatarAsync, onSuccess: invalidate }),
    deleteAvatar: useMutation({
      mutationFn: accountService.deleteAvatarAsync,
      onSuccess: invalidate,
    }),
    logoutAll: useMutation({ mutationFn: authService.logoutAllAsync }),
  };
}
