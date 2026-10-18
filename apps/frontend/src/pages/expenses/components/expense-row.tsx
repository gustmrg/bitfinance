import { ArrowUpRight, CreditCard, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import type { Expense } from "@/api/expenses/expenses.types";
import { ActionsMenu } from "@/components/base/actions-menu";
import { Amount } from "@/components/base/amount";
import { Badge } from "@/components/base/badge";
import { cn } from "@/lib/cn";
import { categoryLabel, paymentMethodLabels } from "@/lib/finance-categories";

export function ExpenseRow({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cancelled = expense.status === "cancelled";
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 border-t border-line py-3 first:border-t-0 md:grid-cols-[auto_minmax(0,1fr)_160px_120px_130px_40px] md:gap-4">
      <span className="inline-grid size-10 place-items-center rounded-full bg-brand-soft text-brand-ink">
        <CreditCard size={18} aria-hidden="true" />
      </span>
      <span className="grid min-w-0 gap-0.5">
        <Link
          to={`/expenses/${expense.id}`}
          className={cn(
            "truncate text-[15px] font-bold hover:underline md:text-sm",
            cancelled ? "text-ink-muted line-through" : "text-ink",
          )}
        >
          {expense.description}
        </Link>
        <span className="truncate text-[13px] text-ink-muted md:hidden">
          {t(categoryLabel(expense.category))}
          {expense.paymentMethod && ` · ${t(paymentMethodLabels[expense.paymentMethod])}`}
        </span>
      </span>
      <span className="hidden truncate text-sm text-ink-muted md:block">
        {t(categoryLabel(expense.category))}
      </span>
      <span className="hidden truncate text-sm text-ink-muted md:block">
        {expense.paymentMethod
          ? t(paymentMethodLabels[expense.paymentMethod])
          : t("common.notSpecified")}
      </span>
      <span className="grid justify-items-end gap-1">
        <Amount
          value={expense.amount}
          negative
          className={cn(
            "text-[15px] font-extrabold md:text-sm",
            cancelled && "text-ink-muted line-through",
          )}
        />
        {expense.status !== "paid" && (
          <Badge tone={expense.status === "pending" ? "warning" : "neutral"}>
            {t(`statuses.${expense.status}`)}
          </Badge>
        )}
      </span>
      <span className="justify-self-end">
        <ActionsMenu
          label={t("expenses.actionsFor", { name: expense.description })}
          actions={[
            {
              label: t("common.viewDetails"),
              icon: <ArrowUpRight size={16} aria-hidden="true" />,
              onSelect: () => navigate(`/expenses/${expense.id}`),
            },
            {
              label: t("expenses.edit"),
              icon: <Pencil size={16} aria-hidden="true" />,
              onSelect: onEdit,
            },
            {
              label: t("common.delete"),
              icon: <Trash2 size={16} aria-hidden="true" />,
              onSelect: onDelete,
              tone: "danger",
            },
          ]}
        />
      </span>
    </div>
  );
}
