import { type ReactNode } from "react";

import { Square } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AdaptiveConfirm } from "@/components/ui/adaptive-modal";
import { Button } from "@/components/ui/button";

interface StopBillSeriesDialogProps {
  seriesId: string;
  onStop: (seriesId: string) => Promise<void> | void;
  trigger?: ReactNode;
  size?: "default" | "icon";
}

export function StopBillSeriesDialog({
  seriesId,
  onStop,
  trigger,
  size = "icon",
}: StopBillSeriesDialogProps) {
  const { t } = useTranslation();

  const defaultTrigger =
    size === "icon" ? (
      <Button size="icon" variant="outline" onSelect={(event) => event.preventDefault()}>
        <Square className="h-4 w-4" />
        <span className="sr-only">{t("bills.stopFuture.cta")}</span>
      </Button>
    ) : (
      <Button variant="outline">
        <Square className="h-4 w-4" />
        {t("bills.stopFuture.cta")}
      </Button>
    );

  return (
    <AdaptiveConfirm
      trigger={trigger ?? defaultTrigger}
      title={t("bills.stopFuture.title")}
      description={t("bills.stopFuture.description")}
      cancelLabel={t("labels.cancel")}
      confirmLabel={t("bills.stopFuture.confirm")}
      onConfirm={() => onStop(seriesId)}
      contentClassName="rounded-md p-0"
      headerClassName="flex flex-row items-start justify-start gap-4 px-4 py-3"
      footerClassName="rounded-md bg-gray-50 px-4 py-3"
    />
  );
}
