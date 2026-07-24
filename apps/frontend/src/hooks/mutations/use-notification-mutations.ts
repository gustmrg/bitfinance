import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/api/notifications/notifications.service";
import { queryKeys } from "@/lib/query-keys";

export function useNotificationMutations(organizationId: string | null) {
  const client = useQueryClient();
  const invalidate = () => void client.invalidateQueries({ queryKey: queryKeys.notifications.all });
  return {
    markRead: useMutation({
      mutationFn: (notificationId: string) =>
        notificationsService.markReadAsync(organizationId!, notificationId),
      onSuccess: invalidate,
    }),
    markAllRead: useMutation({
      mutationFn: () => notificationsService.markAllReadAsync(organizationId!),
      onSuccess: invalidate,
    }),
    updatePreferences: useMutation({
      mutationFn: (enabled: boolean) =>
        notificationsService.updatePreferencesAsync(organizationId!, enabled),
      onSuccess: invalidate,
    }),
  };
}
