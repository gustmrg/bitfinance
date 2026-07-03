import { Repeat } from "lucide-react";
import { useTranslation } from "react-i18next";

import { StatusBadge } from "@/components/ui/status-badge";

import type { Bill } from "../types";

interface BillSeriesLabelProps {
  bill: Bill;
}

export function BillSeriesLabel({ bill }: BillSeriesLabelProps) {
  const { t } = useTranslation();

  if (!bill.billSeriesId || bill.billSeriesType !== "installment") {
    return null;
  }

  const current = bill.occurrenceNumber ?? 0;
  const total = bill.totalOccurrences ?? 0;
  const accessibleLabel = t("bills.series.installment", { current, total });

  return (
    <StatusBadge
      aria-label={accessibleLabel}
      title={accessibleLabel}
      variant="purple"
    >
      <Repeat aria-hidden="true" className="mr-1 h-3 w-3" />
      {t("bills.series.installmentCompact", { current, total })}
    </StatusBadge>
  );
}
