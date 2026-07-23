import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Bill } from "@/api/bills/bills.types";
import { ActionMenu } from "@/components/navigation/action-menu";
import { DataIcon } from "@/components/ui/data-icon";
import { StatusPill } from "@/components/ui/status-pill";
import { formatCurrency, formatDate, relativeDate } from "@/lib/format";
import { acceptedDocumentTypes } from "@/lib/file-validation";
import { categoryLabels } from "@/lib/finance-categories";

export function BillRow({
  bill,
  locale,
  onDetails,
  onDelete,
  onPaid,
  onUpload,
}: {
  bill: Bill;
  locale: string;
  onDetails: () => void;
  onDelete: () => void;
  onPaid: () => void;
  onUpload: (files: File[]) => Promise<void>;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="table-row">
      <div className="table-row__primary">
        <DataIcon type="bill" />
        <span>
          <strong>{bill.description}</strong>
          <small>
            {t(categoryLabels[bill.category])}
            {bill.billSeriesType === "installment" &&
              ` · ${t("common.installmentCount", { current: bill.occurrenceNumber, total: bill.totalOccurrences })}`}
          </small>
        </span>
      </div>
      <span>
        {formatDate(bill.dueDate, locale)}
        <small>{relativeDate(bill.dueDate, locale)}</small>
      </span>
      <span>
        {bill.billSeriesType ? (
          <span className="type-label">
            <i
              className={`tiny-dot tiny-dot--${bill.billSeriesType === "recurring" ? "blue" : "amber"}`}
            />
            {t(`types.${bill.billSeriesType}`)}
          </span>
        ) : (
          <span className="muted">{t("common.oneTime")}</span>
        )}
      </span>
      <strong>{formatCurrency(bill.amountDue, locale)}</strong>
      <StatusPill status={bill.status} />
      <div className="row-actions">
        <input
          ref={inputRef}
          hidden
          multiple
          type="file"
          accept={acceptedDocumentTypes}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length > 0) {
              void onUpload(files);
            }
            event.currentTarget.value = "";
          }}
        />
        <ActionMenu
          onEdit={onDetails}
          onPaid={onPaid}
          canPay={bill.status !== "paid"}
          detailHref={`/dashboard/bills/${bill.id}`}
          onUpload={() => inputRef.current?.click()}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
