import { type ReactNode } from "react";

import { useTranslation } from "react-i18next";

import type { BillFileCategory } from "@/api/bills";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dateFormatter } from "@/utils/formatter";

import type { MarkAsPaidData } from "./mark-as-paid-dialog";
import { BillSeriesLabel } from "./bill-series-label";
import { BillRowActions } from "./bill-row-actions";
import type { Bill } from "../types";

export interface BillsTableProps {
  bills: Bill[];
  totalAmount: string;
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

export function BillsTable({
  bills,
  totalAmount,
  renderStatusBadge,
  onDeleteBill,
  onEditBill,
  onMarkAsPaid,
  onStopBillSeries,
  onUploadDocuments,
}: BillsTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("labels.description")}</TableHead>
              <TableHead>{t("labels.category")}</TableHead>
              <TableHead>{t("labels.dueDate")}</TableHead>
              <TableHead>{t("labels.status")}</TableHead>
              <TableHead>{t("labels.amount")}</TableHead>
              <TableHead className="text-right">{t("labels.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{bill.description}</span>
                    <BillSeriesLabel bill={bill} />
                  </div>
                </TableCell>
                <TableCell className="capitalize">{bill.category}</TableCell>
                <TableCell>{dateFormatter.format(new Date(bill.dueDate))}</TableCell>
                <TableCell>{renderStatusBadge(bill.status)}</TableCell>
                <TableCell>{formatCurrency(bill.amountDue)}</TableCell>
                <TableCell>
                  <BillRowActions
                    bill={bill}
                    onDeleteBill={onDeleteBill}
                    onEditBill={onEditBill}
                    onMarkAsPaid={onMarkAsPaid}
                    onStopBillSeries={onStopBillSeries}
                    onUploadDocuments={onUploadDocuments}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-semibold">
              <TableCell colSpan={4}>Total</TableCell>
              <TableCell>{formatCurrency(parseFloat(totalAmount))}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
