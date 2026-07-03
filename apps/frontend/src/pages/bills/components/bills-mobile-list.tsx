import { type ReactNode } from "react";

import { useTranslation } from "react-i18next";

import type { BillFileCategory } from "@/api/bills";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { dateFormatter } from "@/utils/formatter";

import type { MarkAsPaidData } from "./mark-as-paid-dialog";
import { BillSeriesLabel } from "./bill-series-label";
import { BillRowActions } from "./bill-row-actions";
import type { Bill } from "../types";

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

export interface BillsMobileListProps {
  bills: Bill[];
  renderStatusBadge: (status: string) => ReactNode;
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

export function BillsMobileList({
  bills,
  renderStatusBadge,
  onDeleteBill,
  onEditBill,
  onMarkAsPaid,
  onStopBillSeries,
  onUploadDocuments,
}: BillsMobileListProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {bills.map((bill) => (
        <Card key={bill.id}>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-semibold leading-5">{bill.description}</p>
                <BillSeriesLabel bill={bill} />
                <p className="mt-1 text-sm capitalize text-muted-foreground">
                  {bill.category}
                </p>
              </div>
              {renderStatusBadge(bill.status)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("labels.dueDate")}
                </p>
                <p className="font-medium">{dateFormatter.format(new Date(bill.dueDate))}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("labels.amount")}
                </p>
                <p className="font-medium">{formatCurrency(bill.amountDue)}</p>
              </div>
            </div>

            <BillRowActions
              bill={bill}
              onDeleteBill={onDeleteBill}
              onEditBill={onEditBill}
              onMarkAsPaid={onMarkAsPaid}
              onStopBillSeries={onStopBillSeries}
              onUploadDocuments={onUploadDocuments}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
