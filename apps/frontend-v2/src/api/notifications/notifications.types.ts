import type { Paged } from "../bills/bills.types";

export type NotificationType =
  | "BillDueSoon"
  | "BillDueToday"
  | "BillOverdue"
  | "MemberJoined"
  | "MemberRoleChanged"
  | "MemberRemoved";

export interface NotificationParameters {
  billId?: string;
  billDescription?: string;
  amountDue?: number;
  dueDate?: string;
  memberUserId?: string;
  memberName?: string;
  actorName?: string;
  previousRole?: string;
  newRole?: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  parameters: NotificationParameters;
  actionPath: string;
  createdAt: string;
  readAt: string | null;
}

export type NotificationPage = Paged<AppNotification>;
export interface NotificationPreferences {
  emailBillRemindersEnabled: boolean;
  emailAvailable: boolean;
}
