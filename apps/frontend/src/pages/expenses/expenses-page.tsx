import { BarChart3, Building2, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { Expense, ExpenseStatus, PaymentMethod } from "@/api/expenses/expenses.types";
import { useAuth } from "@/auth/auth-provider";
import { Amount } from "@/components/base/amount";
import { Button } from "@/components/base/button";
import { Card } from "@/components/base/card";
import { ConfirmDialog } from "@/components/base/dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/base/feedback";
import { PageHeader } from "@/components/base/page-header";
import { SearchField } from "@/components/base/search-field";
import { Select } from "@/components/base/select";
import { Stat } from "@/components/base/stat";
import { Page } from "@/components/layout/page";
import { Pagination } from "@/components/navigation/pagination";
import { PeriodFilter } from "@/components/navigation/period-filter";
import { useExpenseMutations } from "@/hooks/mutations/use-expense-mutations";
import { useExpensesQuery } from "@/hooks/queries/use-expense-queries";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useDebounce } from "@/hooks/use-debounce";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { daysUntil } from "@/lib/due";
import { paymentMethodLabels, paymentMethods } from "@/lib/finance-categories";
import { ExpenseModal } from "@/pages/expenses/components/expense-modal";
import { ExpenseRow } from "@/pages/expenses/components/expense-row";

function dayKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ExpensesPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const organizationId = useSelectedOrganization();
  const month = useCurrentMonth();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState<ExpenseStatus | "all">("all");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "all">("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const quickAdd = searchParams.has("new");
  const closeModal = () => {
    setModal(null);
    if (quickAdd)
      setSearchParams(
        (params) => {
          params.delete("new");
          return params;
        },
        { replace: true },
      );
  };
  const [selected, setSelected] = useState<Expense | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<Expense | null>(null);
  const query = useExpensesQuery(
    organizationId
      ? {
          organizationId,
          page,
          pageSize: 30,
          from: month.from,
          to: month.to,
          description: debouncedSearch,
          status: status === "all" ? undefined : status,
          paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
        }
      : null,
  );
  const mutations = useExpenseMutations(organizationId);
  const rows = [...(query.data?.data ?? [])].sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt),
  );
  const days = rows.reduce<Array<{ key: string; items: Expense[] }>>((groups, expense) => {
    const key = dayKey(expense.occurredAt);
    const group = groups.find((item) => item.key === key);
    if (group) group.items.push(expense);
    else groups.push({ key, items: [expense] });
    return groups;
  }, []);
  const dayLabel = (key: string) => {
    const offset = daysUntil(key);
    if (offset === 0) return t("expenses.today");
    if (offset === -1) return t("expenses.yesterday");
    const [year, monthIndex, day] = key.split("-").map(Number);
    const label = new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(year, monthIndex - 1, day));
    return label.charAt(0).toUpperCase() + label.slice(1);
  };
  const filtered = Boolean(search) || status !== "all" || paymentMethod !== "all";
  const clear = () => {
    setSearch("");
    setStatus("all");
    setPaymentMethod("all");
    setPage(1);
  };
  const confirmRemoval = () => {
    if (!pendingRemoval) return;
    mutations.remove.mutate(pendingRemoval.id, {
      onSuccess: () => {
        setPendingRemoval(null);
        toast.success(t("expenses.removed"));
      },
      onError: (error) => toast.error(error.message),
    });
  };

  if (!organizationId || !user)
    return (
      <Page>
        <Card>
          <EmptyState
            icon={Building2}
            title={t("expenses.selectOrganization")}
            description={t("expenses.scoped")}
          />
        </Card>
      </Page>
    );

  return (
    <Page>
      <PageHeader
        title={t("expenses.title")}
        description={t("expenses.body")}
        actions={
          <Button onClick={() => setModal("add")} className="max-sm:hidden">
            <Plus size={17} aria-hidden="true" /> {t("expenses.add")}
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <PeriodFilter onChange={() => setPage(1)} />
        <div className="w-[calc(50%-6px)] sm:w-48">
          <Select<PaymentMethod | "all">
            ariaLabel={t("expenses.paymentMethod")}
            value={paymentMethod}
            onValueChange={(value) => {
              setPaymentMethod(value);
              setPage(1);
            }}
            options={[
              { value: "all", label: t("expenses.allPaymentMethods") },
              ...paymentMethods.map((value) => ({
                value,
                label: t(paymentMethodLabels[value]),
              })),
            ]}
          />
        </div>
        <div className="w-[calc(50%-6px)] sm:w-44">
          <Select<ExpenseStatus | "all">
            ariaLabel={t("expenses.status")}
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={[
              { value: "all", label: t("expenses.allStatuses") },
              ...(["paid", "pending", "cancelled"] as ExpenseStatus[]).map((value) => ({
                value,
                label: t(`statuses.${value}`),
              })),
            ]}
          />
        </div>
        <SearchField
          label={t("expenses.search")}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="min-w-52 flex-1"
        />
        {filtered && (
          <Button variant="ghost" onClick={clear}>
            <RotateCcw size={15} aria-hidden="true" /> {t("common.clearFilters")}
          </Button>
        )}
      </div>
      <Card padding="none" className="grid grid-cols-2 sm:grid-cols-3">
        <Stat
          className="col-span-2 border-b border-line p-5 sm:col-span-1 sm:border-b-0 sm:border-r"
          label={t("expenses.total")}
          value={<Amount value={query.data?.summary.totalAmount ?? 0} />}
        />
        <Stat
          className="border-r border-line p-5"
          label={t("expenses.transactions")}
          value={query.data?.totalRecords ?? 0}
        />
        <Stat
          className="p-5"
          label={t("expenses.average")}
          value={<Amount value={query.data?.summary.averageAmount ?? 0} />}
        />
      </Card>
      <Card padding="none" className="px-4 pb-3 sm:px-6">
        {query.isPending ? (
          <LoadingState />
        ) : query.error ? (
          <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
        ) : days.length ? (
          days.map((day) => (
            <section key={day.key} aria-labelledby={`expenses-day-${day.key}`}>
              <div className="flex items-center justify-between pb-1 pt-5 text-[13px] font-bold text-ink-muted">
                <h2 id={`expenses-day-${day.key}`} className="m-0 text-[13px] font-bold">
                  {dayLabel(day.key)}
                </h2>
                <Amount
                  value={day.items
                    .filter((expense) => expense.status !== "cancelled")
                    .reduce((sum, expense) => sum + expense.amount, 0)}
                  negative
                />
              </div>
              {day.items.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  onEdit={() => {
                    setSelected(expense);
                    setModal("edit");
                  }}
                  onDelete={() => setPendingRemoval(expense)}
                />
              ))}
            </section>
          ))
        ) : (
          <EmptyState
            icon={BarChart3}
            title={filtered ? t("common.noResults") : t("expenses.emptyTitle")}
            description={filtered ? t("expenses.empty") : t("expenses.emptyBody")}
            action={
              filtered ? (
                <Button variant="secondary" onClick={clear}>
                  {t("common.clearFilters")}
                </Button>
              ) : (
                <Button onClick={() => setModal("add")}>
                  <Plus size={17} aria-hidden="true" /> {t("expenses.add")}
                </Button>
              )
            }
          />
        )}
      </Card>
      {query.data && query.data.totalPages > 1 && (
        <Pagination page={page} totalPages={query.data.totalPages} onPageChange={setPage} />
      )}
      {(modal || quickAdd) && (
        <ExpenseModal
          expense={modal === "edit" ? (selected ?? undefined) : undefined}
          onClose={() => {
            closeModal();
            setSelected(null);
          }}
          organizationId={organizationId}
          userId={user.id}
        />
      )}
      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        onOpenChange={(next) => !next && setPendingRemoval(null)}
        title={t("common.deleteExpenseConfirm")}
        description={pendingRemoval?.description}
        confirmLabel={t("common.delete")}
        pending={mutations.remove.isPending}
        onConfirm={confirmRemoval}
      />
    </Page>
  );
}
