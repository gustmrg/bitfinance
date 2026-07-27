import { Building2, Filter, Plus, ReceiptText, RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Bill, BillSeriesType, BillStatus } from "@/api/bills/bills.types";
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
import { useBillMutations } from "@/hooks/mutations/use-bill-mutations";
import { useBillsQuery } from "@/hooks/queries/use-bill-queries";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useDebounce } from "@/hooks/use-debounce";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { isAcceptedDocument } from "@/lib/file-validation";
import { BillModal } from "@/pages/bills/components/bill-modal";
import { BillRow } from "@/pages/bills/components/bill-row";

export function BillsPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const organizationId = useSelectedOrganization();
  const month = useCurrentMonth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState<BillStatus | "all">("all");
  const [series, setSeries] = useState<BillSeriesType | "all">("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Bill | null>(null);
  const query = useBillsQuery(
    organizationId
      ? {
          organizationId,
          page,
          pageSize: 20,
          from: month.from,
          to: month.to,
          status: status === "all" ? undefined : status,
          description: debouncedSearch,
        }
      : null,
  );
  const mutations = useBillMutations(organizationId);
  const rows = (query.data?.data ?? []).filter(
    (bill) => series === "all" || bill.billSeriesType === series,
  );
  const total = rows.reduce((sum, bill) => sum + bill.amountDue, 0);
  const due = rows
    .filter((bill) => ["due", "overdue"].includes(bill.status))
    .reduce((sum, bill) => sum + bill.amountDue, 0);
  const paid = rows
    .filter((bill) => bill.status === "paid")
    .reduce((sum, bill) => sum + (bill.amountPaid ?? 0), 0);
  const clear = () => {
    setSearch("");
    setStatus("all");
    setSeries("all");
    setPage(1);
  };
  const [pendingRemoval, setPendingRemoval] = useState<Bill | null>(null);
  const confirmRemoval = () => {
    if (!pendingRemoval) return;
    mutations.remove.mutate(pendingRemoval.id, {
      onSuccess: () => {
        setPendingRemoval(null);
        toast.success(t("bills.removed"));
      },
      onError: (error) => toast.error(error.message),
    });
  };
  const markPaid = (bill: Bill) =>
    mutations.update.mutate(
      {
        id: bill.id,
        input: {
          description: bill.description,
          notes: bill.notes ?? "",
          category: bill.category,
          status: "paid",
          dueDate: bill.dueDate,
          paymentDate: new Date().toISOString(),
          amountDue: bill.amountDue,
          amountPaid: bill.amountDue,
        },
      },
      {
        onSuccess: () => toast.success(t("bills.markedPaid")),
        onError: (error) => toast.error(error.message),
      },
    );
  const upload = async (bill: Bill, files: File[]) => {
    if (files.some((file) => !isAcceptedDocument(file))) {
      toast.error(t("bills.invalidFile"));
      return;
    }

    try {
      await Promise.all(
        files.map((file) => mutations.upload.mutateAsync({ id: bill.id, file, category: "Other" })),
      );
      toast.success(t("bills.uploaded"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("bills.invalidFile"));
    }
  };

  if (!organizationId)
    return (
      <PageContainer>
        <EmptyState
          icon={Building2}
          title={t("bills.selectOrganization")}
          description={t("bills.scoped")}
        />
      </PageContainer>
    );
  return (
    <PageContainer>
      <PageHeader
        eyebrow={t("bills.eyebrow")}
        title={t("bills.title")}
        description={t("bills.body")}
        actions={
          <Button onClick={() => setModal("add")}>
            <Plus size={17} /> {t("bills.add")}
          </Button>
        }
      />
      <div className="stat-strip">
        <div>
          <span>{t("bills.total")}</span>
          <strong>{formatCurrency(total, locale)}</strong>
        </div>
        <div>
          <span>{t("bills.due")}</span>
          <strong className="text-amber">{formatCurrency(due, locale)}</strong>
        </div>
        <div>
          <span>{t("bills.paid")}</span>
          <strong className="text-mint">{formatCurrency(paid, locale)}</strong>
        </div>
      </div>
      <div className="filter-bar">
        <label className="search-field">
          <Search size={17} />
          <input
            placeholder={t("bills.search")}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <div className="select-field">
          <Filter size={15} />
          <Select<BillStatus | "all">
            ariaLabel={t("bills.status")}
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={[
              { value: "all", label: t("bills.allStatuses") },
              ...(["upcoming", "due", "overdue", "paid", "cancelled"] as BillStatus[]).map(
                (value) => ({ value, label: t(`statuses.${value}`) }),
              ),
            ]}
          />
        </div>
        <div className="select-field">
          <Select<BillSeriesType | "all">
            ariaLabel={t("bills.type")}
            value={series}
            onValueChange={setSeries}
            options={[
              { value: "all", label: t("bills.allTypes") },
              { value: "recurring", label: t("bills.recurring") },
              { value: "installment", label: t("bills.installments") },
            ]}
          />
        </div>
        <PeriodPicker />
        {(search || status !== "all" || series !== "all") && (
          <Button type="button" variant="ghost" className="clear-filters-button" onClick={clear}>
            <RotateCcw size={15} /> {t("common.clearFilters")}
          </Button>
        )}
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
            <div className="table-head">
              <span>{t("bills.commitment")}</span>
              <span>{t("bills.dueDate")}</span>
              <span>{t("bills.type")}</span>
              <span>{t("common.amount")}</span>
              <span>{t("bills.status")}</span>
              <span aria-label={t("common.actions")} />
            </div>
            {rows.length ? (
              rows.map((bill) => (
                <BillRow
                  key={bill.id}
                  bill={bill}
                  locale={locale}
                  onDetails={() => {
                    setSelected(bill);
                    setModal("edit");
                  }}
                  onDelete={() => setPendingRemoval(bill)}
                  onPaid={() => markPaid(bill)}
                  onUpload={(files) => upload(bill, files)}
                />
              ))
            ) : (
              <EmptyState
                icon={ReceiptText}
                title={t("common.noResults")}
                description={t("bills.empty")}
                action={
                  <Button variant="secondary" onClick={clear}>
                    {t("common.clearFilters")}
                  </Button>
                }
              />
            )}
          </>
        )}
      </section>
      {query.data && query.data.totalPages > 1 && (
        <Pagination page={page} totalPages={query.data.totalPages} onPageChange={setPage} />
      )}
      {modal === "add" && (
        <BillModal onClose={() => setModal(null)} organizationId={organizationId} />
      )}
      {modal === "edit" && selected && (
        <BillModal
          bill={selected}
          onClose={() => {
            setModal(null);
            setSelected(null);
          }}
          organizationId={organizationId}
        />
      )}
      {pendingRemoval && (
        <ConfirmDialog
          title={t("common.deleteBillConfirm")}
          confirmLabel={t("common.delete")}
          pending={mutations.remove.isPending}
          onConfirm={confirmRemoval}
          onClose={() => setPendingRemoval(null)}
        />
      )}
    </PageContainer>
  );
}
