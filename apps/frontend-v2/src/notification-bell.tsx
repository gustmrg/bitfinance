import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, ReceiptText, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { AppNotification, NotificationType } from "./api/notifications/notifications.types";
import { useOrganizationStore } from "./auth/auth-store";
import { useNotificationMutations, useNotificationsQuery, useNotificationUnreadCountQuery } from "./hooks/use-queries";

const billTypes = new Set<NotificationType>(["BillDueSoon", "BillDueToday", "BillOverdue"]);

function NotificationCopy({ notification }: { notification: AppNotification }) {
  const { t } = useTranslation();
  const key = notification.type.charAt(0).toLowerCase() + notification.type.slice(1);
  return <span className="notification-item__copy"><strong>{t(`notifications.${key}.title`)}</strong><small>{t(`notifications.${key}.body`, { ...notification.parameters })}</small><time dateTime={notification.createdAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.createdAt))}</time></span>;
}

export function NotificationBell() {
  const { t } = useTranslation();
  const organizationId = useOrganizationStore((state) => state.selectedOrganizationId);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const notifications = useNotificationsQuery(organizationId, open);
  const unread = useNotificationUnreadCountQuery(organizationId);
  const mutations = useNotificationMutations(organizationId);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [open]);

  const items = notifications.data?.data ?? [];
  return <div className="notification-bell" ref={root}>
    <button type="button" className="icon-button notification-bell__trigger" aria-label={t("common.notifications")} title={t("common.notifications")} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((value) => !value)}>
      <Bell size={18} />
      {(unread.data ?? 0) > 0 && <span className="notification-bell__badge" aria-label={t("notifications.unreadCount", { count: unread.data })}>{Math.min(unread.data ?? 0, 99)}</span>}
    </button>
    {open && <section className="notification-panel" role="dialog" aria-label={t("common.notifications")}>
      <header className="notification-panel__header"><span><strong>{t("common.notifications")}</strong><small>{t("notifications.currentOrganization")}</small></span>{(unread.data ?? 0) > 0 && <button type="button" onClick={() => mutations.markAllRead.mutate()} disabled={mutations.markAllRead.isPending}><CheckCheck size={14} /> {t("notifications.markAllRead")}</button>}</header>
      <div className="notification-panel__list">
        {notifications.isPending && <p className="notification-panel__state">{t("common.loading")}</p>}
        {notifications.isError && <p className="notification-panel__state" role="alert">{t("api.notifications.load")}</p>}
        {!notifications.isPending && !notifications.isError && items.length === 0 && <p className="notification-panel__state">{t("notifications.empty")}</p>}
        {items.map((notification) => {
          const Icon = billTypes.has(notification.type) ? ReceiptText : UsersRound;
          return <Link key={notification.id} className={`notification-item ${notification.readAt ? "" : "notification-item--unread"}`} to={notification.actionPath} onClick={() => { setOpen(false); if (!notification.readAt) mutations.markRead.mutate(notification.id); }}><span className="notification-item__icon"><Icon size={16} /></span><NotificationCopy notification={notification} /></Link>;
        })}
      </div>
    </section>}
  </div>;
}
