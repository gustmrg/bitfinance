import { authApi } from "../shared/client";
import { normalizeApiError } from "../shared/errors";
import type { NotificationPage, NotificationPreferences } from "./notifications.types";

export const notificationsService = {
  async listAsync(organizationId: string): Promise<NotificationPage> {
    try { return (await authApi.get<NotificationPage>(`/organizations/${organizationId}/notifications`, { params: { page: 1, pageSize: 25 } })).data; }
    catch (error) { throw normalizeApiError(error, "api.notifications.load"); }
  },
  async unreadCountAsync(organizationId: string): Promise<number> {
    try { return (await authApi.get<{ count: number }>(`/organizations/${organizationId}/notifications/unread-count`)).data.count; }
    catch (error) { throw normalizeApiError(error, "api.notifications.load"); }
  },
  async markReadAsync(organizationId: string, notificationId: string): Promise<void> {
    try { await authApi.patch(`/organizations/${organizationId}/notifications/${notificationId}/read`); }
    catch (error) { throw normalizeApiError(error, "api.notifications.markRead"); }
  },
  async markAllReadAsync(organizationId: string): Promise<void> {
    try { await authApi.post(`/organizations/${organizationId}/notifications/read-all`); }
    catch (error) { throw normalizeApiError(error, "api.notifications.markRead"); }
  },
  async getPreferencesAsync(organizationId: string): Promise<NotificationPreferences> {
    try { return (await authApi.get<NotificationPreferences>(`/organizations/${organizationId}/notification-preferences`)).data; }
    catch (error) { throw normalizeApiError(error, "api.notifications.loadPreferences"); }
  },
  async updatePreferencesAsync(organizationId: string, enabled: boolean): Promise<NotificationPreferences> {
    try { return (await authApi.put<NotificationPreferences>(`/organizations/${organizationId}/notification-preferences`, { emailBillRemindersEnabled: enabled })).data; }
    catch (error) { throw normalizeApiError(error, "api.notifications.savePreferences"); }
  },
};
