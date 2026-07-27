import { useTranslation } from "react-i18next";
import { Expense } from "@/api/expenses/expenses.types";
import { ActionMenu } from "@/components/navigation/action-menu";
import { DataIcon } from "@/components/ui/data-icon";
import { StatusPill } from "@/components/ui/status-pill";
import { formatCurrency, formatDate, relativeDate } from "@/lib/format";
import { categoryLabels, paymentMethodLabels } from "@/lib/finance-categories";

export function ExpenseRow({
  expense,
  locale,
  onDetails,
  onDelete,
}: {
  expense: Expense;
  locale: string;
  onDetails: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="table-row table-row--expense">
      <div className="table-row__primary">
        <DataIcon type="expense" />
        <span>
          <strong>{expense.description}</strong>
          <small>{t("expenses.added", { date: relativeDate(expense.occurredAt, locale) })}</small>
        </span>
      </div>
      <span>{formatDate(expense.occurredAt, locale)}</span>
      <span>
        <span className="type-label">
          <i className="tiny-dot tiny-dot--mint" />
          {t(categoryLabels[expense.category])}
        </span>
      </span>
      <span>
        {expense.paymentMethod ? (
          t(paymentMethodLabels[expense.paymentMethod])
        ) : (
          <span className="muted">{t("common.notSpecified")}</span>
        )}
      </span>
      <strong>{formatCurrency(expense.amount, locale)}</strong>
      <StatusPill status={expense.status} />
      <div className="row-actions">
        <ActionMenu
          onEdit={onDetails}
          detailHref={`/dashboard/expenses/${expense.id}`}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
