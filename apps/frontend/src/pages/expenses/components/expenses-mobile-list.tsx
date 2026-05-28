import { Suspense, lazy, type ReactNode, useState } from "react";

import { Eye, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { dateFormatter } from "@/utils/formatter";

import { DeleteExpenseDialog } from "./delete-expense-dialog";
import type { Expense } from "../types";

const EditExpenseDialog = lazy(() => import("./edit-expense-dialog"));

interface EditExpenseFormValue {
  id: string;
  description: string;
  category: string;
  amount: number;
  occurredAt: Date;
  status: string;
}

function LazyEditExpenseAction({
  expense,
  onEditExpense,
}: {
  expense: Expense;
  onEditExpense: (data: EditExpenseFormValue) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);

  if (!enabled) {
    return (
      <Button size="icon" variant="outline" onClick={() => setEnabled(true)}>
        <Pencil className="h-4 w-4" />
        <span className="sr-only">{t("labels.edit")}</span>
      </Button>
    );
  }

  return (
    <Suspense
      fallback={
        <Button disabled size="icon" variant="outline">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">{t("labels.edit")}</span>
        </Button>
      }
    >
      <EditExpenseDialog
        defaultOpen
        expense={expense}
        onEdit={onEditExpense}
        trigger={
          <Button size="icon" variant="outline">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">{t("labels.edit")}</span>
          </Button>
        }
      />
    </Suspense>
  );
}

export interface ExpensesMobileListProps {
  expenses: Expense[];
  renderStatusBadge: (status: string) => ReactNode;
  onDeleteExpense: (id: string) => Promise<void>;
  onEditExpense: (data: EditExpenseFormValue) => Promise<void>;
}

export function ExpensesMobileList({
  expenses,
  renderStatusBadge,
  onDeleteExpense,
  onEditExpense,
}: ExpensesMobileListProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <Card key={expense.id}>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold leading-5">{expense.description}</p>
                <p className="mt-1 text-sm capitalize text-muted-foreground">{expense.category}</p>
              </div>
              {renderStatusBadge(expense.status)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("labels.date")}
                </p>
                <p className="font-medium">
                  {dateFormatter.format(new Date(expense.occurredAt))}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("labels.amount")}
                </p>
                <p className="font-medium">{formatCurrency(expense.amount)}</p>
              </div>
            </div>

             <div className="flex items-center justify-between gap-3">
               <div className="min-w-0">
                 <p className="text-xs uppercase tracking-wide text-muted-foreground">
                   {t("labels.createdBy")}
                 </p>
                 <p className="truncate text-sm font-medium">{expense.createdBy}</p>
               </div>
               <div className="flex items-center gap-2">
               <Button asChild size="icon" variant="outline">
                  <Link to={`/dashboard/expenses/${expense.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">{t("labels.details")}</span>
                  </Link>
                </Button>
                <LazyEditExpenseAction expense={expense} onEditExpense={onEditExpense} />
                <DeleteExpenseDialog
                  id={expense.id}
                  onDelete={onDeleteExpense}
                 />
               </div>
             </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
