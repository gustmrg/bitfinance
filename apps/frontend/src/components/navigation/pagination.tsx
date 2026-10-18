import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/base/button";

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t("common.pagination")} className="flex items-center justify-center gap-3">
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={16} aria-hidden="true" /> {t("common.previous")}
      </Button>
      <span className="text-sm font-semibold tabular-nums text-ink-muted">
        {page} / {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {t("common.next")} <ChevronRight size={16} aria-hidden="true" />
      </Button>
    </nav>
  );
}
