import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

import { billsService } from "@/api/bills";
import { useSelectedOrganization } from "@/auth/auth-provider";
import { AdaptiveModal } from "@/components/ui/adaptive-modal";
import { Button } from "@/components/ui/button";

import type { Bill } from "../types";
import { BillDetailsContent } from "./bill-details-content";

interface DetailsBillDialogProps {
  bill: Bill;
}

export function DetailsBillDialog({ bill }: DetailsBillDialogProps) {
  const { t } = useTranslation();
  const selectedOrganization = useSelectedOrganization();

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    if (!selectedOrganization) {
      console.error("No organization selected");
      return;
    }

    try {
      await billsService.downloadDocumentAsync({
        organizationId: selectedOrganization.id,
        billId: bill.id,
        documentId,
        fileName,
      });
    } catch (error) {
      console.error("Failed to download document:", error);
    }
  };

  const handleDeleteDocument = async () => {
    // Document deletion is available from the dedicated bill details page.
  };

  return (
    <AdaptiveModal
      trigger={
        <Button size="icon" variant="outline" onSelect={(event) => event.preventDefault()}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">{t("labels.details")}</span>
        </Button>
      }
      title={t("bills.dialog.details.title")}
      description={t("bills.dialog.details.description")}
      headerClassName="px-4 sm:px-0"
      bodyClassName="px-0 pb-0"
    >
      <BillDetailsContent
        bill={bill}
        onDeleteDocument={handleDeleteDocument}
        onDownloadDocument={handleDownloadDocument}
      />
    </AdaptiveModal>
  );
}
