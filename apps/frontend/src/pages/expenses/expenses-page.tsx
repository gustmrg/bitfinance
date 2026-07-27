import { BarChart3, Building2, Filter, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Expense, ExpenseStatus, PaymentMethod } from "@/api/expenses/expenses.types";
import { useAuth } from "@/auth/auth-provider";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageContainer } from "@/components/layout/page-container";
import { Pagination } from "@/components/navigation/pagination";
import { PeriodPicker } from "@/components/navigation/period-picker";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { useExpenseMutations } from "@/hooks/mutations/use-expense-mutations";
import { useExpensesQuery } from "@/hooks/queries/use-expense-queries";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useDebounce } from "@/hooks/use-debounce";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { ExpenseModal } from "@/pages/expenses/components/expense-modal";
import { ExpenseRow } from "@/pages/expenses/components/expense-row";
import { paymentMethodLabels, paymentMethods } from "@/lib/finance-categories";

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
  const [selected, setSelected] = useState<Expense | null>(null);
  const query = useExpensesQuery(
    organizationId
      ? {
          organizationId,
          page,
          pageSize: 20,
          from: month.from,
          to: month.to,
          description: debouncedSearch,
          status: status === "all" ? undefined : status,
          paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
        }
      : null,
  );
  const mutations = useExpenseMutations(organizationId);
  const rows = query.data?.data ?? [];
  const total = query.data?.summary.totalAmount ?? 0;
  const average = query.data?.summary.averageAmount ?? 0;
  const transactionCount = query.data?.totalRecords ?? 0;
  const [pendingRemoval, setPendingRemoval] = useState<Expense | null>(null);
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
      <PageContainer>
        <EmptyState
          icon={Building2}
          title={t("expenses.selectOrganization")}
          description={t("expenses.scoped")}
        />
      </PageContainer>
    );
  return (
    <PageContainer>
      <PageHeader
        eyebrow={t("expenses.eyebrow")}
        title={t("expenses.title")}
        description={t("expenses.body")}
        actions={
          <Button onClick={() => setModal("add")}>
            <Plus size={17} /> {t("expenses.add")}
          </Button>
        }
      />
      <div className="stat-strip">
        <div>
          <span>{t("expenses.total")}</span>
          <strong>{formatCurrency(total, locale)}</strong>
        </div>
        <div>
          <span>{t("expenses.transactions")}</span>
          <strong>{transactionCount}</strong>
        </div>
        <div>
          <span>{t("expenses.average")}</span>
          <strong>{formatCurrency(average, locale)}</strong>
        </div>
      </div>
      <p className="page-header__description">{t("expenses.localFilters")}</p>
      <div className="filter-bar">
        <label className="search-field">
          <Search size={17} />
          <input
            placeholder={t("expenses.search")}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <div className="select-field">
          <Filter size={15} />
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
        <div className="select-field">
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
        <PeriodPicker onChange={() => setPage(1)} />
      </div>
      <section className="surface-card surface-card--table">
        {query.isPending ? (
          <LoadingState />
        ) : query.error ? (
          <ErrorState
            message={query.error.message}
            onRetry={() => {
              void query.refetch();
            }}
          />
        ) : (
          <>
            <div className="table-head table-head--expenses">
              <span>{t("expenses.expense")}</span>
              <span>{t("expenses.date")}</span>
              <span>{t("expenses.category")}</span>
              <span>{t("expenses.paymentMethod")}</span>
              <span>{t("expenses.amount")}</span>
              <span>{t("expenses.status")}</span>
              <span aria-label={t("common.actions")} />
            </div>
            {rows.length ? (
              rows.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  locale={locale}
                  onDetails={() => {
                    setSelected(expense);
                    setModal("edit");
                  }}
                  onDelete={() => setPendingRemoval(expense)}
                />
              ))
            ) : (
              <EmptyState
                icon={BarChart3}
                title={t("common.noResults")}
                description={t("expenses.empty")}
              />
            )}
          </>
        )}
      </section>
      {query.data && query.data.totalPages > 1 && (
        <div className="expenses-pagination">
          <Pagination page={page} totalPages={query.data.totalPages} onPageChange={setPage} />
        </div>
      )}
      {modal && (
        <ExpenseModal
          expense={modal === "edit" ? (selected ?? undefined) : undefined}
          onClose={() => {
            setModal(null);
            setSelected(null);
          }}
          organizationId={organizationId}
          userId={user.id}
        />
      )}
      {pendingRemoval && (
        <ConfirmDialog
          title={t("common.deleteExpenseConfirm")}
          confirmLabel={t("common.delete")}
          pending={mutations.remove.isPending}
          onConfirm={confirmRemoval}
          onClose={() => setPendingRemoval(null)}
        />
      )}
    </PageContainer>
  );
}
