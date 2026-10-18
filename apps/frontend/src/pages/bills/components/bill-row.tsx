import { ArrowUpRight, FilePlus2, Pencil, Trash2 } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { Bill } from "@/api/bills/bills.types";
import { ActionsMenu } from "@/components/base/actions-menu";
import { Amount } from "@/components/base/amount";
import { Button } from "@/components/base/button";
import { DateChip, DueStatus } from "@/components/finance/due-status";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/cn";
import { dueState } from "@/lib/due";
import { acceptedDocumentTypes } from "@/lib/file-validation";
import { categoryLabel } from "@/lib/finance-categories";
import { billRowGrid } from "./bill-row-grid";

function shortDate(value: string, locale: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit" }).format(
    new Date(year, month - 1, day),
  );
}

export function BillRow({
  bill,
  onEdit,
  onDelete,
  onPaid,
  onUpload,
  paying,
}: {
  bill: Bill;
  onEdit: () => void;
  onDelete: () => void;
  onPaid: () => void;
  onUpload: (files: File[]) => void;
  paying: boolean;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const state = dueState(bill.dueDate, bill.status);
  const settled = state.kind === "paid" || state.kind === "cancelled";
  const detail =
    bill.billSeriesType === "installment" && bill.totalOccurrences
      ? t("common.installmentCount", {
          current: bill.occurrenceNumber,
          total: bill.totalOccurrences,
        })
      : bill.billSeriesType
        ? [
            t(`types.${bill.billSeriesType}`),
            bill.billSeriesFrequency ? t(`bills.${bill.billSeriesFrequency}`) : null,
          ]
            .filter(Boolean)
            .join(" · ")
        : null;
  return (
    <div
      className={cn(
        "grid items-center gap-3 border-t border-line py-3 first:border-t-0 md:gap-4",
        billRowGrid,
        settled && "text-ink-muted",
      )}
    >
      <span className="md:hidden">
        <DateChip date={bill.dueDate} tone={state.kind === "overdue" ? "danger" : "default"} />
      </span>
      <span
        className={cn(
          "hidden text-sm font-bold tabular-nums md:block",
          state.kind === "overdue" && "text-danger",
        )}
      >
        {shortDate(bill.dueDate, locale)}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <Link
          to={`/bills/${bill.id}`}
          className={cn(
            "truncate text-[15px] font-bold hover:underline md:text-sm",
            settled ? "text-ink-muted" : "text-ink",
          )}
        >
          {bill.description}
        </Link>
        <span className="flex min-w-0 flex-wrap gap-x-2 text-[13px] text-ink-muted">
          {!settled && <DueStatus dueDate={bill.dueDate} status={bill.status} variant="text" />}
          {detail && <span className="truncate">{detail}</span>}
        </span>
      </span>
      <span className="hidden truncate text-sm text-ink-muted md:block">
        {t(categoryLabel(bill.category))}
      </span>
      <Amount
        value={bill.status === "paid" ? (bill.amountPaid ?? bill.amountDue) : bill.amountDue}
        className={cn("text-right text-[15px] font-extrabold md:text-sm", !settled && "text-ink")}
      />
      <span className="hidden justify-self-end md:block">
        {settled ? (
          <DueStatus dueDate={bill.dueDate} status={bill.status} />
        ) : (
          <Button variant="secondary" size="sm" disabled={paying} onClick={onPaid}>
            {t("bills.markPaid")}
          </Button>
        )}
      </span>
      <span className="justify-self-end">
        <input
          ref={inputRef}
          hidden
          multiple
          type="file"
          accept={acceptedDocumentTypes}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length > 0) onUpload(files);
            event.currentTarget.value = "";
          }}
        />
        <ActionsMenu
          label={t("bills.actionsFor", { name: bill.description })}
          actions={[
            ...(!settled
              ? [
                  {
                    label: t("bills.markPaid"),
                    icon: <ArrowUpRight size={16} aria-hidden="true" />,
                    onSelect: onPaid,
                  },
                ]
              : []),
            {
              label: t("bills.edit"),
              icon: <Pencil size={16} aria-hidden="true" />,
              onSelect: onEdit,
            },
            {
              label: t("common.addFile"),
              icon: <FilePlus2 size={16} aria-hidden="true" />,
              onSelect: () => inputRef.current?.click(),
            },
            {
              label: t("common.delete"),
              icon: <Trash2 size={16} aria-hidden="true" />,
              onSelect: onDelete,
              tone: "danger" as const,
            },
          ]}
        />
      </span>
    </div>
  );
}
