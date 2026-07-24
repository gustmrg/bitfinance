import { CircleDollarSign } from "lucide-react";
import { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { DashboardBill, DashboardExpense } from "@/api/dashboard/dashboard.types";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";

export function CategoryBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="category-bar">
      <span>
        <i className={`tiny-dot tiny-dot--${color}`} />
        {label}
      </span>
      <span>{value}%</span>
      <div>
        <i
          className={`category-bar__fill category-bar__fill--${color}`}
          style={{ width: `${Math.min(value * 1.8, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function CashflowTimeline({
  bills,
  expenses,
  locale,
}: {
  bills: DashboardBill[];
  expenses: DashboardExpense[];
  locale: string;
}) {
  const { t } = useTranslation();
  const events = [
    ...bills.map((bill) => ({
      date: bill.dueDate,
      label: bill.description,
      amount: bill.amountDue,
      kind: "bill" as const,
    })),
    ...expenses.slice(0, 3).map((expense) => ({
      date: expense.date,
      label: expense.description,
      amount: expense.amount,
      kind: "expense" as const,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <section className="timeline-card">
      <div className="timeline-card__header">
        <div>
          <p className="eyebrow">{t("dashboard.flow")}</p>
          <h2>{t("dashboard.flowBody")}</h2>
        </div>
        <span className="timeline-card__legend">
          <i className="tiny-dot tiny-dot--amber" /> {t("dashboard.timelineCommitments")}{" "}
          <i className="tiny-dot tiny-dot--mint" /> {t("dashboard.timelineMoved")}
        </span>
      </div>
      <div className="timeline" role="list">
        {events.map((event, index) => (
          <div
            className={`timeline-event timeline-event--${event.kind}`}
            key={`${event.date}-${event.label}`}
            role="listitem"
            style={{ "--event-index": index } as CSSProperties}
          >
            <span className="timeline-event__date">{formatDate(event.date, locale)}</span>
            <span className="timeline-event__dot" />
            <span className="timeline-event__label">{event.label}</span>
            <strong>
              {event.kind === "expense" ? "−" : ""}
              {formatCurrency(event.amount, locale)}
            </strong>
          </div>
        ))}
      </div>
      {!events.length && (
        <EmptyState
          icon={CircleDollarSign}
          title={t("dashboard.noMovement")}
          description={t("dashboard.timelineEmpty")}
        />
      )}
    </section>
  );
}
