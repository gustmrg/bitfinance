import { Suspense, lazy, type ReactNode, useState } from "react";

import { Eye, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { dateFormatter } from "@/utils/formatter";

import { DeleteBillDialog } from "./delete-bill-dialog";
import { MarkAsPaidDialog, type MarkAsPaidData } from "./mark-as-paid-dialog";
import type { Bill } from "../types";

const EditBillDialog = lazy(async () => ({
  default: (await import("./edit-bill-dialog")).EditBillDialog,
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

function LazyEditBillAction({
  bill,
  onEditBill,
}: {
  bill: Bill;
  onEditBill: (data: EditBillFormValue) => Promise<void>;
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
      <EditBillDialog
        bill={bill}
        defaultOpen
        onEdit={onEditBill}
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

export interface BillsMobileListProps {
  bills: Bill[];
  renderStatusBadge: (status: string) => ReactNode;
  onDeleteBill: (id: string) => Promise<void>;
  onEditBill: (data: EditBillFormValue) => Promise<void>;
  onMarkAsPaid: (data: MarkAsPaidData) => Promise<void>;
}

export function BillsMobileList({
  bills,
  renderStatusBadge,
  onDeleteBill,
  onEditBill,
  onMarkAsPaid,
}: BillsMobileListProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {bills.map((bill) => (
        <Card key={bill.id}>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold leading-5">{bill.description}</p>
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

            <div className="flex items-center justify-end gap-2">
              <Button asChild size="icon" variant="outline">
                <Link to={`/dashboard/bills/${bill.id}`}>
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">{t("labels.details")}</span>
                </Link>
              </Button>
              {bill.status !== "paid" && bill.status !== "cancelled" && (
                <MarkAsPaidDialog bill={bill} onMarkAsPaid={onMarkAsPaid} />
              )}
              <LazyEditBillAction bill={bill} onEditBill={onEditBill} />
              <DeleteBillDialog id={bill.id} onDelete={onDeleteBill} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
