import { useMutation, useQueryClient } from "@tanstack/react-query";

import { accountService, type UpdateProfileRequest } from "@/api/account";
import { useAuthStore } from "@/auth/auth-store";
import { useSetSelectedOrganizationId } from "@/auth/auth-provider";
import { clearAccessToken } from "@/lib/auth-token";
import { queryKeys } from "@/lib/query-keys";

export function useAccountMutations() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const setSelectedOrganizationId = useSetSelectedOrganizationId();

  const refreshCurrentUser = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.auth.me(),
    });
    await queryClient.refetchQueries({
      queryKey: queryKeys.auth.me(),
    });
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (request: UpdateProfileRequest) =>
      accountService.updateProfileAsync(request),
    onSuccess: refreshCurrentUser,
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => accountService.uploadAvatarAsync(file),
    onSuccess: refreshCurrentUser,
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: async () => accountService.deleteAvatarAsync(),
    onSuccess: refreshCurrentUser,
  });

  const logoutAllDevicesMutation = useMutation({
    mutationFn: async () => accountService.logoutAllDevicesAsync(),
    onSuccess: async () => {
      clearSession();
      setSelectedOrganizationId(null);
      setInitialized(true);
      clearAccessToken();
      queryClient.clear();
    },
  });

  return {
    deleteAvatarAsync: deleteAvatarMutation.mutateAsync,
    isDeletingAvatar: deleteAvatarMutation.isPending,
    isLoggingOutAllDevices: logoutAllDevicesMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    logoutAllDevicesAsync: logoutAllDevicesMutation.mutateAsync,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    uploadAvatarAsync: uploadAvatarMutation.mutateAsync,
  };
}
