import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type {
  ExpenseCategory,
  ExpenseFileCategory,
  ExpenseStatus,
  UpdateExpenseRequest,
} from "@/api/expenses";
import { expensesService } from "@/api/expenses";
import { useSelectedOrganization } from "@/auth/auth-provider";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useExpenseMutations } from "@/hooks/mutations/use-expense-mutations";
import { useExpenseQuery } from "@/hooks/queries/use-expense-query";

import EditExpenseDialog from "./components/edit-expense-dialog";
import { DeleteExpenseDialog } from "./components/delete-expense-dialog";
import { ExpenseDetailsContent } from "./components/expense-details-content";
import { UploadExpenseDocumentsDialog } from "./components/upload-expense-documents-dialog";

interface EditExpenseFormValues {
  id: string;
  description: string;
  category: string;
  amount: number;
  occurredAt: Date;
  status: string;
}

export function ExpenseDetails() {
  const { expenseId } = useParams<{ expenseId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const selectedOrganization = useSelectedOrganization();
  const expenseQuery = useExpenseQuery(selectedOrganization?.id ?? null, expenseId);
  const {
    deleteExpenseAsync,
    deleteExpenseDocumentAsync,
    updateExpenseAsync,
    uploadExpenseDocumentsAsync,
  } = useExpenseMutations({
    organizationId: selectedOrganization?.id ?? null,
  });

  const expense = expenseQuery.data;

  const handleEditExpense = async (data: EditExpenseFormValues) => {
    if (!selectedOrganization) {
      return;
    }

    const payload: Omit<UpdateExpenseRequest, "organizationId"> = {
      id: data.id,
      description: data.description,
      category: data.category as ExpenseCategory,
      amount: data.amount,
      status: data.status as ExpenseStatus,
      occurredAt: data.occurredAt.toISOString(),
      createdBy: expense?.createdBy ?? "",
    };

    await updateExpenseAsync(payload);
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpenseAsync(id);
    navigate("/dashboard/expenses");
  };

  const handleUploadDocuments = async (
    currentExpenseId: string,
    files: File[],
    fileCategory: ExpenseFileCategory
  ) => {
    await uploadExpenseDocumentsAsync({
      expenseId: currentExpenseId,
      files,
      fileCategory,
    });
  };

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    if (!selectedOrganization || !expense) {
      return;
    }

    await expensesService.downloadDocumentAsync({
      organizationId: selectedOrganization.id,
      expenseId: expense.id,
      documentId,
      fileName,
    });
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!expense) {
      return;
    }

    await deleteExpenseDocumentAsync({
      expenseId: expense.id,
      documentId,
    });
  };

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title={expense?.description ?? t("expenses.details.title")}
        description={expense ? t("expenses.details.subtitle") : undefined}
        actions={
          <Button asChild variant="outline">
            <Link to="/dashboard/expenses">
              <ArrowLeft className="h-4 w-4" />
              {t("expenses.details.back")}
            </Link>
          </Button>
        }
      />

      {expenseQuery.isPending ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {t("expenses.loading")}
          </CardContent>
        </Card>
      ) : !expense ? (
        <Card>
          <CardContent className="space-y-3 p-8 text-center">
            <h3 className="text-lg font-semibold">{t("expenses.details.notFound")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("expenses.details.notFoundDescription")}
            </p>
            <Button asChild variant="outline">
              <Link to="/dashboard/expenses">{t("expenses.details.back")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <ExpenseDetailsContent
                expense={expense}
                onDeleteDocument={handleDeleteDocument}
                onDownloadDocument={handleDownloadDocument}
              />
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            <EditExpenseDialog
              expense={expense}
              onEdit={handleEditExpense}
              trigger={<Button variant="outline">{t("labels.edit")}</Button>}
            />
            <UploadExpenseDocumentsDialog
              expenseId={expense.id}
              onUpload={handleUploadDocuments}
              trigger={<Button variant="outline">{t("expenses.details.upload")}</Button>}
            />
            <DeleteExpenseDialog
              id={expense.id}
              onDelete={handleDeleteExpense}
              trigger={<Button variant="destructive">{t("labels.delete")}</Button>}
            />
          </div>
        </>
      )}
    </PageContainer>
  );
}
