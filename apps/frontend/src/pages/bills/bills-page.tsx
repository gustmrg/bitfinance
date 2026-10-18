import { Building2, Plus, ReceiptText, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { Bill, BillSeriesType, BillStatus } from "@/api/bills/bills.types";
import { Amount } from "@/components/base/amount";
import { Button } from "@/components/base/button";
import { Card } from "@/components/base/card";
import { ConfirmDialog } from "@/components/base/dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/base/feedback";
import { PageHeader } from "@/components/base/page-header";
import { SearchField } from "@/components/base/search-field";
import { SegmentedControl } from "@/components/base/segmented-control";
import { Select } from "@/components/base/select";
import { Stat } from "@/components/base/stat";
import { Page } from "@/components/layout/page";
import { Pagination } from "@/components/navigation/pagination";
import { PeriodFilter } from "@/components/navigation/period-filter";
import { useBillMutations } from "@/hooks/mutations/use-bill-mutations";
import { useBillsQuery } from "@/hooks/queries/use-bill-queries";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useDebounce } from "@/hooks/use-debounce";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { cn } from "@/lib/cn";
import { dueState } from "@/lib/due";
import { isAcceptedDocument } from "@/lib/file-validation";
import { BillModal } from "@/pages/bills/components/bill-modal";
import { BillRow } from "@/pages/bills/components/bill-row";
import { billRowGrid } from "@/pages/bills/components/bill-row-grid";
import { buildMarkPaidInput } from "@/pages/bills/mark-paid";

type StatusFilter = "all" | "open" | "overdue" | "paid";
type GroupKey = "overdue" | "week" | "later" | "settled";

const serverStatus: Record<StatusFilter, BillStatus | undefined> = {
  all: undefined,
  open: undefined,
  overdue: "overdue",
  paid: "paid",
};

function groupOf(bill: Bill): GroupKey {
  const state = dueState(bill.dueDate, bill.status);
  if (state.kind === "paid" || state.kind === "cancelled") return "settled";
  if (state.kind === "overdue") return "overdue";
  if (state.kind === "later" && state.days > 7) return "later";
  return "week";
}

const groupOrder: GroupKey[] = ["overdue", "week", "later", "settled"];

export function BillsPage() {
  const { t } = useTranslation();
  const organizationId = useSelectedOrganization();
  const month = useCurrentMonth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [series, setSeries] = useState<BillSeriesType | "one-time" | "all">("all");
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
  const [selected, setSelected] = useState<Bill | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<Bill | null>(null);
  const query = useBillsQuery(
    organizationId
      ? {
          organizationId,
          page,
          pageSize: 50,
          from: month.from,
          to: month.to,
          status: serverStatus[status],
          description: debouncedSearch,
        }
      : null,
  );
  const mutations = useBillMutations(organizationId);
  const rows = (query.data?.data ?? [])
    .filter((bill) =>
      series === "all"
        ? true
        : series === "one-time"
          ? !bill.billSeriesType
          : bill.billSeriesType === series,
    )
    .filter((bill) => status !== "open" || groupOf(bill) !== "settled")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const sumOf = (items: Bill[]) => items.reduce((sum, bill) => sum + bill.amountDue, 0);
  const groups = groupOrder
    .map((key) => ({ key, items: rows.filter((bill) => groupOf(bill) === key) }))
    .filter((group) => group.items.length > 0);
  const open = rows.filter((bill) => groupOf(bill) !== "settled");
  const overdue = rows.filter((bill) => groupOf(bill) === "overdue");
  const week = rows.filter((bill) => groupOf(bill) === "week");
  const paidTotal = rows
    .filter((bill) => bill.status === "paid")
    .reduce((sum, bill) => sum + (bill.amountPaid ?? bill.amountDue), 0);
  const filtered = Boolean(search) || status !== "all" || series !== "all";
  const clear = () => {
    setSearch("");
    setStatus("all");
    setSeries("all");
    setPage(1);
  };
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
      { id: bill.id, input: buildMarkPaidInput(bill) },
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
      <Page>
        <Card>
          <EmptyState
            icon={Building2}
            title={t("bills.selectOrganization")}
            description={t("bills.scoped")}
          />
        </Card>
      </Page>
    );

  return (
    <Page>
      <PageHeader
        title={t("bills.title")}
        description={t("bills.body")}
        actions={
          <Button onClick={() => setModal("add")} className="max-sm:hidden">
            <Plus size={17} aria-hidden="true" /> {t("bills.add")}
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <PeriodFilter onChange={() => setPage(1)} />
        <SegmentedControl<StatusFilter>
          label={t("bills.status")}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[
            { value: "all", label: t("bills.filterAll") },
            { value: "open", label: t("bills.filterOpen") },
            { value: "overdue", label: t("bills.filterOverdue"), tone: "danger" },
            { value: "paid", label: t("bills.filterPaid") },
          ]}
        />
        <div className="w-44">
          <Select<BillSeriesType | "one-time" | "all">
            ariaLabel={t("bills.type")}
            value={series}
            onValueChange={setSeries}
            options={[
              { value: "all", label: t("bills.allTypes") },
              { value: "one-time", label: t("bills.oneTime") },
              { value: "recurring", label: t("bills.recurring") },
              { value: "installment", label: t("bills.installments") },
            ]}
          />
        </div>
        <SearchField
          label={t("bills.search")}
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
      <Card padding="none" className="grid grid-cols-2 md:grid-cols-4">
        <Stat
          className="border-b border-r border-line p-5 md:border-b-0"
          label={t("bills.toPay")}
          value={<Amount value={sumOf(open)} />}
        />
        <Stat
          className="border-b border-line p-5 md:border-b-0 md:border-r"
          tone="danger"
          label={t("bills.overdueTotal")}
          value={<Amount value={sumOf(overdue)} />}
        />
        <Stat
          className="border-r border-line p-5"
          label={t("bills.nextSevenDays")}
          value={<Amount value={sumOf(week)} />}
        />
        <Stat
          className="p-5"
          tone="success"
          label={t("bills.paidTotal")}
          value={<Amount value={paidTotal} />}
        />
      </Card>
      <Card padding="none" className="px-4 pb-3 sm:px-6">
        {query.isPending ? (
          <LoadingState />
        ) : query.error ? (
          <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
        ) : groups.length ? (
          <>
            <div
              className={cn(
                "hidden gap-4 pb-1 pt-4 text-xs font-semibold text-ink-muted md:grid",
                billRowGrid,
              )}
            >
              <span>{t("dashboard.dueColumn")}</span>
              <span>{t("dashboard.billColumn")}</span>
              <span>{t("common.category")}</span>
              <span className="text-right">{t("common.amount")}</span>
              <span className="text-right">{t("dashboard.statusColumn")}</span>
              <span />
            </div>
            {groups.map((group) => (
              <section key={group.key} aria-labelledby={`bills-group-${group.key}`}>
                <div
                  className={cn(
                    "flex items-center justify-between pb-1 pt-5 text-[13px] font-bold",
                    group.key === "overdue" && "text-danger",
                    group.key === "settled" && "text-success",
                    (group.key === "week" || group.key === "later") && "text-ink-muted",
                  )}
                >
                  <h2 id={`bills-group-${group.key}`} className="m-0 text-[13px] font-bold">
                    {t(`bills.group.${group.key}`)}
                  </h2>
                  <Amount value={sumOf(group.items)} />
                </div>
                {group.items.map((bill) => (
                  <BillRow
                    key={bill.id}
                    bill={bill}
                    paying={mutations.update.isPending}
                    onEdit={() => {
                      setSelected(bill);
                      setModal("edit");
                    }}
                    onDelete={() => setPendingRemoval(bill)}
                    onPaid={() => markPaid(bill)}
                    onUpload={(files) => void upload(bill, files)}
                  />
                ))}
              </section>
            ))}
          </>
        ) : (
          <EmptyState
            icon={ReceiptText}
            title={filtered ? t("common.noResults") : t("bills.emptyTitle")}
            description={filtered ? t("bills.empty") : t("bills.emptyBody")}
            action={
              filtered ? (
                <Button variant="secondary" onClick={clear}>
                  {t("common.clearFilters")}
                </Button>
              ) : (
                <Button onClick={() => setModal("add")}>
                  <Plus size={17} aria-hidden="true" /> {t("bills.add")}
                </Button>
              )
            }
          />
        )}
      </Card>
      {query.data && query.data.totalPages > 1 && (
        <Pagination page={page} totalPages={query.data.totalPages} onPageChange={setPage} />
      )}
      {(modal === "add" || quickAdd) && (
        <BillModal onClose={closeModal} organizationId={organizationId} />
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
      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        onOpenChange={(next) => !next && setPendingRemoval(null)}
        title={t("common.deleteBillConfirm")}
        description={pendingRemoval?.description}
        confirmLabel={t("common.delete")}
        pending={mutations.remove.isPending}
        onConfirm={confirmRemoval}
      />
    </Page>
  );
}
