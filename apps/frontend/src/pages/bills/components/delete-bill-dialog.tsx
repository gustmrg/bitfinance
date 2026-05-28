import { type ReactNode } from "react";

import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { AdaptiveConfirm } from "@/components/ui/adaptive-modal";

interface DeleteBillDialogProps {
  id: string;
  onDelete: (id: string) => Promise<void> | void;
  trigger?: ReactNode;
}

export function DeleteBillDialog({ id, onDelete, trigger }: DeleteBillDialogProps) {
  const { t } = useTranslation();

  const defaultTrigger = (
    <Button size="icon" variant="outline" onSelect={(event) => event.preventDefault()}>
      <Trash2 className="h-4 w-4" />
      <span className="sr-only">{t("labels.delete")}</span>
    </Button>
  );

  return (
    <AdaptiveConfirm
      trigger={trigger ?? defaultTrigger}
      title={t("bills.dialog.delete.title")}
      description={t("bills.dialog.delete.description")}
      cancelLabel={t("labels.cancel")}
      confirmLabel={t("labels.delete")}
      onConfirm={() => onDelete(id)}
      confirmClassName="bg-red-600 hover:bg-red-700"
      contentClassName="rounded-md p-0"
      headerClassName="flex flex-row items-start justify-start gap-4 px-4 py-3"
      footerClassName="rounded-md bg-gray-50 px-4 py-3"
    />
  );
}
