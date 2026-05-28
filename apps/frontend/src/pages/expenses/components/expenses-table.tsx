import { Suspense, lazy, type ReactNode, useState } from "react";

import { Eye, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export interface ExpensesTableProps {
  expenses: Expense[];
  totalAmount: string;
  renderStatusBadge: (status: string) => ReactNode;
  onDeleteExpense: (id: string) => Promise<void>;
  onEditExpense: (data: EditExpenseFormValue) => Promise<void>;
}

export function ExpensesTable({
  expenses,
  totalAmount,
  renderStatusBadge,
  onDeleteExpense,
  onEditExpense,
}: ExpensesTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("labels.description")}</TableHead>
              <TableHead>{t("labels.category")}</TableHead>
              <TableHead>{t("labels.date")}</TableHead>
              <TableHead>{t("labels.createdBy")}</TableHead>
              <TableHead>{t("labels.status")}</TableHead>
              <TableHead>{t("labels.amount")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell className="capitalize">{expense.category}</TableCell>
                <TableCell>
                  {dateFormatter.format(new Date(expense.occurredAt))}
                </TableCell>
                <TableCell className="max-w-48 truncate">{expense.createdBy}</TableCell>
                <TableCell>{renderStatusBadge(expense.status)}</TableCell>
                <TableCell>{formatCurrency(expense.amount)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-semibold">
              <TableCell colSpan={5}>Total</TableCell>
              <TableCell>{formatCurrency(parseFloat(totalAmount))}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
