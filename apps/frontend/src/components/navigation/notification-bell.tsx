import { Popover } from "@base-ui/react/popover";
import { Bell, CheckCheck, ReceiptText, UsersRound } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { AppNotification, NotificationType } from "@/api/notifications/notifications.types";
import { useOrganizationStore } from "@/auth/auth-store";
import { useNotificationMutations } from "@/hooks/mutations/use-notification-mutations";
import { useLocale } from "@/hooks/use-locale";
import {
  useNotificationsQuery,
  useNotificationUnreadCountQuery,
} from "@/hooks/queries/use-notification-queries";
import { cn } from "@/lib/cn";

const billTypes = new Set<NotificationType>(["BillDueSoon", "BillDueToday", "BillOverdue"]);

function NotificationCopy({ notification }: { notification: AppNotification }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const key = notification.type.charAt(0).toLowerCase() + notification.type.slice(1);
  return (
    <span className="grid min-w-0 gap-0.5">
      <strong className="text-sm font-bold text-ink">{t(`notifications.${key}.title`)}</strong>
      <span className="text-[13px] text-ink-muted">
        {t(`notifications.${key}.body`, { ...notification.parameters })}
      </span>
      <time dateTime={notification.createdAt} className="text-xs text-ink-muted">
        {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
          new Date(notification.createdAt),
        )}
      </time>
    </span>
  );
}

export function NotificationBell() {
  const { t } = useTranslation();
  const organizationId = useOrganizationStore((state) => state.selectedOrganizationId);
  const [open, setOpen] = useState(false);
  const notifications = useNotificationsQuery(organizationId, open);
  const unread = useNotificationUnreadCountQuery(organizationId);
  const mutations = useNotificationMutations(organizationId);
  const unreadCount = unread.data ?? 0;
  const items = notifications.data?.data ?? [];

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={
          unreadCount > 0
            ? `${t("common.notifications")} · ${t("notifications.unreadCount", { count: unreadCount })}`
            : t("common.notifications")
        }
        className="relative inline-grid size-11 cursor-pointer place-items-center rounded-control text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger-solid px-1 text-[11px] font-bold text-on-brand"
          >
            {Math.min(unreadCount, 99)}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end" collisionPadding={12} className="z-50">
          <Popover.Popup className="w-[min(calc(100vw-24px),380px)] overflow-hidden rounded-card border border-line bg-surface font-sans text-ink shadow-xl outline-none">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div className="grid min-w-0 flex-1 gap-0.5">
                <Popover.Title className="m-0 text-base font-extrabold">
                  {t("common.notifications")}
                </Popover.Title>
                <Popover.Description className="m-0 text-xs text-ink-muted">
                  {t("notifications.currentOrganization")}
                </Popover.Description>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => mutations.markAllRead.mutate()}
                  disabled={mutations.markAllRead.isPending}
                  className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[10px] px-2.5 text-[13px] font-bold text-brand-ink hover:bg-brand-soft disabled:opacity-50"
                >
                  <CheckCheck size={15} aria-hidden="true" /> {t("notifications.markAllRead")}
                </button>
              )}
            </div>
            <div className="max-h-[min(60dvh,420px)] overflow-y-auto">
              {notifications.isPending && (
                <p className="m-0 px-5 py-8 text-center text-sm text-ink-muted">
                  {t("common.loading")}
                </p>
              )}
              {notifications.isError && (
                <p className="m-0 px-5 py-8 text-center text-sm text-danger" role="alert">
                  {t("api.notifications.load")}
                </p>
              )}
              {!notifications.isPending && !notifications.isError && items.length === 0 && (
                <p className="m-0 px-5 py-8 text-center text-sm text-ink-muted">
                  {t("notifications.empty")}
                </p>
              )}
              {items.map((notification) => {
                const Icon = billTypes.has(notification.type) ? ReceiptText : UsersRound;
                return (
                  <Link
                    key={notification.id}
                    to={notification.actionPath}
                    onClick={() => {
                      setOpen(false);
                      if (!notification.readAt) mutations.markRead.mutate(notification.id);
                    }}
                    className={cn(
                      "flex gap-3 border-b border-line px-5 py-3.5 last:border-b-0 hover:bg-surface-muted",
                      !notification.readAt && "bg-brand-soft/50",
                    )}
                  >
                    <span className="inline-grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-ink">
                      <Icon size={17} aria-hidden="true" />
                    </span>
                    <NotificationCopy notification={notification} />
                  </Link>
                );
              })}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
