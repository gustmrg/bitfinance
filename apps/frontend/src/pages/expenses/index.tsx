import { Suspense, lazy, useState } from "react";

import { CreditCard as CreditCardIcon, Plus } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";

import type {
  ExpenseCategory,
  ExpenseStatus,
  UpdateExpenseRequest,
} from "@/api/expenses";
import {
  useCurrentUser,
  useSelectedOrganization,
} from "@/auth/auth-provider";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { CalendarDateRangePicker } from "@/components/ui/date-range-picker";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useExpenseMutations } from "@/hooks/mutations/use-expense-mutations";
import { useExpensesQuery } from "@/hooks/queries/use-expenses-query";

import { ExpensesMobileList } from "./components/expenses-mobile-list";
import { ExpensesTable } from "./components/expenses-table";

const AddExpenseDialog = lazy(async () => ({
  default: (await import("./components/add-expense-dialog")).AddExpenseDialog,
}));

interface AddExpenseFormValues {
  description: string;
  category: string;
  amount: number;
  status: string;
  occurredAt: Date;
}

interface EditExpenseFormValues {
  id: string;
  description: string;
  category: string;
  amount: number;
  status: string;
  occurredAt: Date;
}

function LazyAddExpenseAction({
  onAddExpense,
}: {
  onAddExpense: (data: AddExpenseFormValues) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);

  if (!enabled) {
    return (
      <Button onClick={() => setEnabled(true)}>
        <Plus className="h-4 w-4" />
        {t("expenses.cta")}
      </Button>
    );
  }

  return (
    <Suspense
      fallback={
        <Button disabled>
          <Plus className="h-4 w-4" />
          {t("expenses.cta")}
        </Button>
      }
    >
      <AddExpenseDialog defaultOpen onAddExpense={onAddExpense} />
    </Suspense>
  );
}

export function Expenses() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  });

  const selectedOrganization = useSelectedOrganization();
  const currentUserQuery = useCurrentUser();
  const user = currentUserQuery.data ?? null;
  const { t } = useTranslation();

  const expensesQuery = useExpensesQuery(selectedOrganization?.id ?? null, {
    from: dateRange?.from,
    to: dateRange?.to,
  });
  const { addExpenseAsync, deleteExpenseAsync, updateExpenseAsync } = useExpenseMutations({
    organizationId: selectedOrganization?.id ?? null,
  });

  const expenses = expensesQuery.data ?? [];

  const handleDateFilterChange = (newDate: DateRange) => {
    setDateRange(newDate);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <StatusBadge variant="yellow">{t("labels.pending")}</StatusBadge>;
      case "paid":
        return <StatusBadge variant="green">{t("labels.paid")}</StatusBadge>;
      case "cancelled":
        return <StatusBadge variant="red">{t("labels.cancelled")}</StatusBadge>;
      default:
        return <StatusBadge variant="indigo">{t("labels.created")}</StatusBadge>;
    }
  };

  const getTotalAmount = () => {
    return expenses
      .reduce((total, expense) => total + expense.amount, 0)
      .toFixed(2);
  };

  const handleAddExpense = async (data: AddExpenseFormValues) => {
    if (!user) {
      return;
    }

    try {
      await addExpenseAsync({
        description: data.description,
        category: data.category as ExpenseCategory,
        status: data.status as ExpenseStatus,
        amount: data.amount,
        occurredAt: data.occurredAt.toISOString(),
        createdBy: user.id,
      });
    } catch (error) {
      console.error("Failed to add the expense:", error);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpenseAsync(id);
    } catch (error) {
      console.error("Failed to delete the expense:", error);
    }
  };

  const handleEditExpense = async (data: EditExpenseFormValues) => {
    if (!user) {
      return;
    }

    try {
      const payload: Omit<UpdateExpenseRequest, "organizationId"> = {
        id: data.id,
        description: data.description,
        category: data.category as ExpenseCategory,
        amount: data.amount,
        status: data.status as ExpenseStatus,
        occurredAt: data.occurredAt.toISOString(),
        createdBy: user.id,
      };

      await updateExpenseAsync(payload);
    } catch (error) {
      console.error("Failed to update the expense:", error);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={t("expenses.title")}
        description={t("expenses.subtitle")}
        actions={
          <>
            <LazyAddExpenseAction onAddExpense={handleAddExpense} />
            <CalendarDateRangePicker
              startDate={dateRange?.from}
              endDate={dateRange?.to}
              onDateChange={handleDateFilterChange}
            />
          </>
        }
      />

      {expensesQuery.isPending ? (
        <TableSkeleton columns={7} />
      ) : expenses.length === 0 ? (
        <div className="rounded-lg border p-10 text-center">
          <CreditCardIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-2 text-lg font-semibold">{t("expenses.emptyTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("expenses.emptyDescription")}
          </p>
        </div>
      ) : (
        <>
          <div className="md:hidden">
             <ExpensesMobileList
               expenses={expenses}
               renderStatusBadge={renderStatusBadge}
               onDeleteExpense={handleDeleteExpense}
               onEditExpense={handleEditExpense}
             />
          </div>
          <div className="hidden md:block">
            <ExpensesTable
              expenses={expenses}
              totalAmount={getTotalAmount()}
              renderStatusBadge={renderStatusBadge}
              onDeleteExpense={handleDeleteExpense}
              onEditExpense={handleEditExpense}
            />
          </div>
        </>
      )}
    </PageContainer>
  );
}
