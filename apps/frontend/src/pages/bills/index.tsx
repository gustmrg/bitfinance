import { Suspense, lazy, useState } from "react";

import { Plus, ReceiptText } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";

import type {
  BillCategory,
  BillFileCategory,
  BillStatus,
  BillType,
  Frequency,
  UpdateBillRequest,
} from "@/api/bills";
import { useSelectedOrganization } from "@/auth/auth-provider";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { useBillMutations } from "@/hooks/mutations/use-bill-mutations";
import { useBillsQuery } from "@/hooks/queries/use-bills-query";

import {
  BillsFilterBar,
  type BillTypeFilter,
} from "./components/bills-filter-bar";
import { BillsMobileList } from "./components/bills-mobile-list";
import { BillsTable } from "./components/bills-table";

const AddBillDialog = lazy(async () => ({
  default: (await import("./components/add-bill-dialog")).AddBillDialog,
}));

interface AddBillFormValues {
  description: string;
  category: string;
  dueDate: Date;
  amount: number;
  billType: BillType;
  frequency?: Frequency;
  installments?: number;
}

interface EditBillFormValues {
  id: string;
  description: string;
  category: string;
  status: string;
  amountDue: number;
  amountPaid?: number;
  dueDate: Date;
  paymentDate?: Date;
}

function LazyAddBillAction({
  onAddBill,
}: {
  onAddBill: (data: AddBillFormValues) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);

  if (!enabled) {
    return (
      <Button onClick={() => setEnabled(true)}>
        <Plus className="h-4 w-4" />
        {t("bills.cta")}
      </Button>
    );
  }

  return (
    <Suspense
      fallback={
        <Button disabled>
          <Plus className="h-4 w-4" />
          {t("bills.cta")}
        </Button>
      }
    >
      <AddBillDialog defaultOpen onAddBill={onAddBill} />
    </Suspense>
  );
}

export function Bills() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  });
  const [selectedStatuses, setSelectedStatuses] = useState<BillStatus[]>([]);
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [billTypeFilter, setBillTypeFilter] = useState<BillTypeFilter>("all");
  const debouncedDescription = useDebounce(descriptionSearch, 300);

  const selectedOrganization = useSelectedOrganization();
  const { t } = useTranslation();

  const billsQuery = useBillsQuery(selectedOrganization?.id ?? null, {
    from: dateRange?.from,
    to: dateRange?.to,
    status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    description: debouncedDescription || undefined,
  });
  const {
    addBillAsync,
    deleteBillAsync,
    updateBillAsync,
    uploadBillDocumentsAsync,
    stopBillSeriesAsync,
  } = useBillMutations({
    organizationId: selectedOrganization?.id ?? null,
  });

  const bills = billsQuery.data ?? [];
  const filteredBills = bills.filter((bill) => {
    if (billTypeFilter === "all") {
      return true;
    }

    if (billTypeFilter === "normal") {
      return !bill.billSeriesType;
    }

    return bill.billSeriesType === billTypeFilter;
  });

  const handleDateFilterChange = (newDate: DateRange) => {
    setDateRange(newDate);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <StatusBadge variant="green">{t("labels.paid")}</StatusBadge>;
      case "upcoming":
        return <StatusBadge variant="yellow">{t("labels.upcoming")}</StatusBadge>;
      case "due":
        return <StatusBadge variant="red">{t("labels.due")}</StatusBadge>;
      case "overdue":
        return <StatusBadge variant="red">{t("labels.overdue")}</StatusBadge>;
      case "cancelled":
        return <StatusBadge variant="gray">{t("labels.cancelled")}</StatusBadge>;
      default:
        return <StatusBadge variant="indigo">{t("labels.created")}</StatusBadge>;
    }
  };

  const getTotalAmount = () => {
    return filteredBills
      .reduce((total, bill) => total + bill.amountDue, 0)
      .toFixed(2);
  };

  const handleAddBill = async (data: AddBillFormValues) => {
    try {
      const frequency = data.billType === "one-time" ? null : data.frequency ?? null;
      const installments =
        data.billType === "installment" ? data.installments ?? null : null;

      await addBillAsync({
        description: data.description,
        category: data.category as BillCategory,
        status: "upcoming",
        dueDate: data.dueDate.toISOString(),
        amountDue: data.amount,
        paymentDate: null,
        amountPaid: null,
        frequency,
        installments,
      });
    } catch (error) {
      console.error("Failed to add the bill:", error);
    }
  };

  const handleDeleteBill = async (id: string) => {
    try {
      await deleteBillAsync(id);
    } catch (error) {
      console.error("Failed to delete the bill:", error);
    }
  };

  const handleEditBill = async (data: EditBillFormValues) => {
    try {
      const payload: Omit<UpdateBillRequest, "organizationId"> = {
        id: data.id,
        description: data.description,
        category: data.category as BillCategory,
        status: data.status as BillStatus,
        dueDate: data.dueDate.toISOString(),
        paymentDate: data.paymentDate ? data.paymentDate.toISOString() : null,
        amountDue: data.amountDue,
        amountPaid: data.amountPaid ?? null,
      };

      await updateBillAsync(payload);
    } catch (error) {
      console.error("Failed to update the bill:", error);
    }
  };

  const handleMarkAsPaid = async (data: { id: string; amountPaid: number; paymentDate: Date }) => {
    const bill = bills.find((b) => b.id === data.id);
    if (!bill) return;

    try {
      await updateBillAsync({
        id: data.id,
        description: bill.description,
        category: bill.category as BillCategory,
        status: "paid" as BillStatus,
        dueDate: bill.dueDate,
        paymentDate: data.paymentDate.toISOString(),
        amountDue: bill.amountDue,
        amountPaid: data.amountPaid,
      });
    } catch (error) {
      console.error("Failed to mark bill as paid:", error);
    }
  };

  const handleUploadDocuments = async (
    billId: string,
    files: File[],
    documentType: BillFileCategory
  ) => {
    try {
      await uploadBillDocumentsAsync({
        billId,
        files,
        documentType,
      });
    } catch (error) {
      console.error("Failed to upload documents:", error);
      throw error;
    }
  };

  const handleStopBillSeries = async (seriesId: string) => {
    try {
      await stopBillSeriesAsync({ seriesId });
    } catch (error) {
      console.error("Failed to stop future bills:", error);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={t("bills.title")}
        description={t("bills.subtitle")}
      />

      <BillsFilterBar
        dateRange={dateRange}
        onDateRangeChange={handleDateFilterChange}
        selectedStatuses={selectedStatuses}
        onStatusChange={setSelectedStatuses}
        descriptionSearch={descriptionSearch}
        onDescriptionChange={setDescriptionSearch}
        billTypeFilter={billTypeFilter}
        onBillTypeChange={setBillTypeFilter}
        actions={<LazyAddBillAction onAddBill={handleAddBill} />}
      />

      {billsQuery.isPending ? (
        <TableSkeleton columns={6} />
      ) : filteredBills.length === 0 ? (
        <div className="rounded-lg border p-10 text-center">
          <ReceiptText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-2 text-lg font-semibold">
            {bills.length === 0
              ? t("bills.emptyTitle")
              : t("bills.filters.emptyTitle")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {bills.length === 0
              ? t("bills.emptyDescription")
              : t("bills.filters.emptyDescription")}
          </p>
        </div>
      ) : (
        <>
          <div className="md:hidden">
            <BillsMobileList
              bills={filteredBills}
              renderStatusBadge={renderStatusBadge}
              onDeleteBill={handleDeleteBill}
              onEditBill={handleEditBill}
              onMarkAsPaid={handleMarkAsPaid}
              onStopBillSeries={handleStopBillSeries}
              onUploadDocuments={handleUploadDocuments}
            />
          </div>
          <div className="hidden md:block">
            <BillsTable
              bills={filteredBills}
              totalAmount={getTotalAmount()}
              renderStatusBadge={renderStatusBadge}
              onDeleteBill={handleDeleteBill}
              onEditBill={handleEditBill}
              onMarkAsPaid={handleMarkAsPaid}
              onStopBillSeries={handleStopBillSeries}
              onUploadDocuments={handleUploadDocuments}
            />
          </div>
        </>
      )}
    </PageContainer>
  );
}
