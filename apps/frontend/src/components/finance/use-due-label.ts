import { useTranslation } from "react-i18next";
import type { DueState } from "@/lib/due";

export function useDueLabel() {
  const { t } = useTranslation();
  return (state: DueState) => {
    switch (state.kind) {
      case "paid":
        return t("due.paid");
      case "cancelled":
        return t("due.cancelled");
      case "overdue":
        return state.days > 0 ? t("due.overdue", { count: state.days }) : t("due.overdueNow");
      case "today":
        return t("due.today");
      case "tomorrow":
        return t("due.tomorrow");
      default:
        return t("due.inDays", { count: state.days });
    }
  };
}
