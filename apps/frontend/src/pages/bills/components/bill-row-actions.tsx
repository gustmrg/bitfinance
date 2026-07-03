import { Suspense, lazy, useState } from "react";

import {
  Ellipsis,
  Eye,
  Pencil,
  Square,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { BillFileCategory } from "@/api/bills";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DeleteBillDialog } from "./delete-bill-dialog";
import { DetailsBillDialog } from "./details-bill-dialog";
import { MarkAsPaidDialog, type MarkAsPaidData } from "./mark-as-paid-dialog";
import { StopBillSeriesDialog } from "./stop-bill-series-dialog";
import type { Bill } from "../types";

const EditBillDialog = lazy(async () => ({
  default: (await import("./edit-bill-dialog")).EditBillDialog,
}));

const UploadDocumentsDialog = lazy(async () => ({
  default: (await import("./upload-documents-dialog")).UploadDocumentsDialog,
}));

interface EditBillFormValue {
  id: string;
  description: string;
  category: string;
  status: string;
  amountDue: number;
  amountPaid?: number;
  dueDate: Date;
  paymentDate?: Date;
}

interface BillRowActionsProps {
  bill: Bill;
  onDeleteBill: (id: string) => Promise<void>;
  onEditBill: (data: EditBillFormValue) => Promise<void>;
  onMarkAsPaid: (data: MarkAsPaidData) => Promise<void>;
  onStopBillSeries: (seriesId: string) => Promise<void>;
  onUploadDocuments: (
    billId: string,
    files: File[],
    documentType: BillFileCategory
  ) => Promise<void>;
}

function LazyEditBillMenuItem({
  bill,
  onEditBill,
}: {
  bill: Bill;
  onEditBill: (data: EditBillFormValue) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);

  const trigger = (
    <DropdownMenuItem
      onSelect={(event) => {
        event.preventDefault();
        setEnabled(true);
      }}
    >
      <Pencil className="h-4 w-4" />
      {t("labels.edit")}
    </DropdownMenuItem>
  );

  if (!enabled) {
    return trigger;
  }

  return (
    <Suspense fallback={trigger}>
      <EditBillDialog
        bill={bill}
        defaultOpen
        onEdit={onEditBill}
        trigger={trigger}
      />
    </Suspense>
  );
}

function LazyUploadBillMenuItem({
  bill,
  onUploadDocuments,
}: {
  bill: Bill;
  onUploadDocuments: (
    billId: string,
    files: File[],
    documentType: BillFileCategory
  ) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);

  const trigger = (
    <DropdownMenuItem
      onSelect={(event) => {
        event.preventDefault();
        setEnabled(true);
      }}
    >
      <Upload className="h-4 w-4" />
      {t("labels.attachments")}
    </DropdownMenuItem>
  );

  if (!enabled) {
    return trigger;
  }

  return (
    <Suspense fallback={trigger}>
      <UploadDocumentsDialog
        billId={bill.id}
        defaultOpen
        onUpload={onUploadDocuments}
        trigger={trigger}
      />
    </Suspense>
  );
}

export function BillRowActions({
  bill,
  onDeleteBill,
  onEditBill,
  onMarkAsPaid,
  onStopBillSeries,
  onUploadDocuments,
}: BillRowActionsProps) {
  const { t } = useTranslation();
  const canMarkAsPaid = bill.status !== "paid" && bill.status !== "cancelled";
  const canStopSeries = Boolean(bill.billSeriesId && bill.billSeriesIsActive);

  return (
    <div className="flex items-center justify-end gap-2">
      {canMarkAsPaid ? (
        <MarkAsPaidDialog bill={bill} onMarkAsPaid={onMarkAsPaid} />
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            aria-label={t("bills.actions.more")}
            title={t("bills.actions.more")}
          >
            <Ellipsis className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DetailsBillDialog
            bill={bill}
            trigger={
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                <Eye className="h-4 w-4" />
                {t("labels.details")}
              </DropdownMenuItem>
            }
          />
          <LazyEditBillMenuItem bill={bill} onEditBill={onEditBill} />
          <LazyUploadBillMenuItem
            bill={bill}
            onUploadDocuments={onUploadDocuments}
          />
          {canStopSeries && bill.billSeriesId ? (
            <StopBillSeriesDialog
              seriesId={bill.billSeriesId}
              onStop={onStopBillSeries}
              trigger={
                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                  <Square className="h-4 w-4" />
                  {t("bills.stopFuture.cta")}
                </DropdownMenuItem>
              }
            />
          ) : null}
          <DropdownMenuSeparator />
          <DeleteBillDialog
            id={bill.id}
            onDelete={onDeleteBill}
            trigger={
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onSelect={(event) => event.preventDefault()}
              >
                <Trash2 className="h-4 w-4" />
                {t("labels.delete")}
              </DropdownMenuItem>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
