import { useQuery } from "@tanstack/react-query";
import { notificationsService } from "@/api/notifications/notifications.service";
import { queryKeys } from "@/lib/query-keys";

export function useNotificationsQuery(organizationId: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.list(organizationId ?? ""),
    queryFn: () => notificationsService.listAsync(organizationId!),
    enabled: Boolean(organizationId) && enabled,
    refetchInterval: 60_000,
  });
}

export function useNotificationUnreadCountQuery(organizationId: string | null) {
  return useQuery({
    queryKey: queryKeys.notifications.unread(organizationId ?? ""),
    queryFn: () => notificationsService.unreadCountAsync(organizationId!),
    enabled: Boolean(organizationId),
    refetchInterval: 60_000,
  });
}

export function useNotificationPreferencesQuery(organizationId: string | null) {
  return useQuery({
    queryKey: queryKeys.notifications.preferences(organizationId ?? ""),
    queryFn: () => notificationsService.getPreferencesAsync(organizationId!),
    enabled: Boolean(organizationId),
  });
}
