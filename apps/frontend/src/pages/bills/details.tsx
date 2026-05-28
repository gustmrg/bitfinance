import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type {
  BillCategory,
  BillFileCategory,
  BillStatus,
  UpdateBillRequest,
} from "@/api/bills";
import { billsService } from "@/api/bills";

import { useSelectedOrganization } from "@/auth/auth-provider";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBillMutations } from "@/hooks/mutations/use-bill-mutations";
import { useBillQuery } from "@/hooks/queries/use-bill-query";

import { BillDetailsContent } from "./components/bill-details-content";
import { DeleteBillDialog } from "./components/delete-bill-dialog";
import { EditBillDialog } from "./components/edit-bill-dialog";
import { UploadDocumentsDialog } from "./components/upload-documents-dialog";

interface EditBillFormValues {
  id: string;
  description: string;
  category: string;
  status: string;
  amountDue: number;
  amountPaid?: number;
  dueDate: Date;
  paymentDate?: Date;
}

export function BillDetails() {
  const { billId } = useParams<{ billId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const selectedOrganization = useSelectedOrganization();

  const billQuery = useBillQuery(selectedOrganization?.id ?? null, billId);

  const {
    deleteBillAsync,
    deleteBillDocumentAsync,
    updateBillAsync,
    uploadBillDocumentsAsync,
  } = useBillMutations({
    organizationId: selectedOrganization?.id ?? null,
  });

  const bill = billQuery.data;

  const handleEditBill = async (data: EditBillFormValues) => {
    const payload: Omit<UpdateBillRequest, "organizationId"> = {
      id: data.id,
      description: data.description,
      category: data.category as BillCategory,
      status: data.status as BillStatus,
      dueDate: data.dueDate.toISOString(),
      paymentDate: data.paymentDate ? data.paymentDate.toISOString() : null,
      amountDue: data.amountDue,
      amountPaid: data.amountPaid ?? null,
    };

    await updateBillAsync(payload);
  };

  const handleUploadDocuments = async (
    currentBillId: string,
    files: File[],
    documentType: BillFileCategory
  ) => {
    await uploadBillDocumentsAsync({
      billId: currentBillId,
      files,
      documentType,
    });
  };

  const handleDeleteBill = async (id: string) => {
    await deleteBillAsync(id);
    navigate("/dashboard/bills");
  };

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    if (!selectedOrganization || !bill) {
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

  const handleDeleteDocument = async (documentId: string) => {
    if (!selectedOrganization || !bill) {
      return;
    }

    try {
      await deleteBillDocumentAsync({
        billId: bill.id,
        documentId,
      });
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title={bill?.description ?? "Bill Details"}
        description={bill ? t("bills.dialog.details.description") : undefined}
        actions={
          <Button asChild variant="outline">
            <Link to="/dashboard/bills">
              <ArrowLeft className="h-4 w-4" />
              Back to Bills
            </Link>
          </Button>
        }
      />

      {billQuery.isPending ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Loading bill details...
          </CardContent>
        </Card>
      ) : !bill ? (
        <Card>
          <CardContent className="space-y-3 p-8 text-center">
            <h3 className="text-lg font-semibold">Bill not found</h3>
            <p className="text-sm text-muted-foreground">
              We could not find this bill in your current organization.
            </p>
            <Button asChild variant="outline">
              <Link to="/dashboard/bills">Back to Bills</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <BillDetailsContent
                bill={bill}
                onDeleteDocument={handleDeleteDocument}
                onDownloadDocument={handleDownloadDocument}
              />
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            <EditBillDialog
              bill={bill}
              onEdit={handleEditBill}
              trigger={<Button variant="outline">{t("labels.edit")}</Button>}
            />
            <UploadDocumentsDialog
              billId={bill.id}
              onUpload={handleUploadDocuments}
              trigger={<Button variant="outline">Upload Documents</Button>}
            />
            <DeleteBillDialog
              id={bill.id}
              onDelete={handleDeleteBill}
              trigger={<Button variant="destructive">{t("labels.delete")}</Button>}
            />
          </div>
        </>
      )}
    </PageContainer>
  );
}
