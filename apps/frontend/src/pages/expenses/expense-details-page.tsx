import { FilePlus2, MoreHorizontal } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FileCategory } from "@/api/bills/bills.types";
import { expensesService } from "@/api/expenses/expenses.service";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { DataIcon } from "@/components/ui/data-icon";
import { IconButton } from "@/components/ui/icon-button";
import { ConfirmDialog } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { StatusPill } from "@/components/ui/status-pill";
import { formatCurrency, formatLongDate } from "@/lib/format";
import { useExpenseMutations } from "@/hooks/mutations/use-expense-mutations";
import { useExpenseQuery } from "@/hooks/queries/use-expense-queries";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { acceptedDocumentTypes, documentCategories } from "@/lib/file-validation";
import { categoryLabels, paymentMethodLabels } from "@/lib/finance-categories";

export function ExpenseDetailsPage() {
  const { t } = useTranslation();
  const { expenseId } = useParams();
  const organizationId = useSelectedOrganization();
  const locale = useLocale();
  const query = useExpenseQuery(organizationId, expenseId);
  const mutations = useExpenseMutations(organizationId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileCategory, setFileCategory] = useState<FileCategory>("Receipt");
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const expense = query.data;
  const upload = (file: File) => {
    const valid =
      acceptedDocumentTypes
        .split(",")
        .some((type) => file.name.toLowerCase().endsWith(type.replace(".", ""))) &&
      file.size <= 10 * 1024 * 1024;
    if (!valid) {
      toast.error(t("bills.invalidFile"));
      return;
    }
    if (expenseId)
      mutations.upload.mutate(
        { id: expenseId, file, category: fileCategory },
        {
          onSuccess: () => toast.success(t("bills.uploaded")),
          onError: (error) => toast.error(error.message),
        },
      );
  };
  const open = async (documentId: string) => {
    const blob = await expensesService.getDocumentAsync(organizationId!, expenseId!, documentId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "expense-document";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };
  if (query.isPending)
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  if (query.error || !expense)
    return (
      <PageContainer>
        <ErrorState
          message={query.error?.message ?? t("expenses.notFound")}
          onRetry={() => {
            void query.refetch();
          }}
        />
      </PageContainer>
    );
  return (
    <PageContainer>
      <Link to="/dashboard/expenses" className="back-link">
        ← {t("nav.expenses")}
      </Link>
      <PageHeader
        eyebrow={t("expenses.detail")}
        title={expense.description}
        description={`${t(categoryLabels[expense.category])} · ${formatLongDate(expense.occurredAt, locale)}`}
      />
      <div className="detail-grid">
        <section className="surface-card detail-card">
          <div className="detail-card__amount">
            <span>{t("expenses.amount")}</span>
            <strong>{formatCurrency(expense.amount, locale)}</strong>
            <StatusPill status={expense.status} />
          </div>
          <dl className="detail-list">
            <div>
              <dt>{t("expenses.occurred")}</dt>
              <dd>{formatLongDate(expense.occurredAt, locale)}</dd>
            </div>
            <div>
              <dt>{t("common.category")}</dt>
              <dd>{t(categoryLabels[expense.category])}</dd>
            </div>
            <div>
              <dt>{t("expenses.createdBy")}</dt>
              <dd>{expense.createdBy}</dd>
            </div>
            <div>
              <dt>{t("expenses.paymentMethod")}</dt>
              <dd>
                {expense.paymentMethod
                  ? t(paymentMethodLabels[expense.paymentMethod])
                  : t("common.notSpecified")}
              </dd>
            </div>
            <div className="detail-list__notes">
              <dt>{t("common.notes")}</dt>
              <dd>{expense.notes || t("common.notSpecified")}</dd>
            </div>
          </dl>
        </section>
        <section className="surface-card detail-card">
          <SectionHeading
            title={t("common.attachments")}
            description={t("expenses.attachmentDescription")}
            action={
              <div className="section-heading__actions">
                <div className="select-field">
                  <Select
                    ariaLabel={t("common.documentCategory")}
                    value={fileCategory}
                    onValueChange={setFileCategory}
                    options={documentCategories.map((value) => ({
                      value,
                      label: t(`documents.${value}`),
                    }))}
                  />
                </div>
                <Button variant="secondary" onClick={() => inputRef.current?.click()}>
                  <FilePlus2 size={16} /> {t("common.addFile")}
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept={acceptedDocumentTypes}
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) upload(file);
                    event.currentTarget.value = "";
                  }}
                />
              </div>
            }
          />
          {expense.documents.length ? (
            expense.documents.map((document) => (
              <div className="attachment-row" key={document.id}>
                <DataIcon type="expense" />
                <span>
                  <strong>{document.fileName}</strong>
                  <small>{t(`documents.${document.fileCategory}`)}</small>
                </span>
                <Button
                  variant="ghost"
                  onClick={() => {
                    void open(document.id);
                  }}
                >
                  {t("common.download")}
                </Button>
                <IconButton
                  label={t("common.removeFile", { name: document.fileName })}
                  onClick={() => setPendingDocumentId(document.id)}
                >
                  <MoreHorizontal size={16} />
                </IconButton>
              </div>
            ))
          ) : (
            <EmptyState
              icon={FilePlus2}
              title={t("expenses.noAttachments")}
              description={t("expenses.receiptHint")}
            />
          )}
        </section>
      </div>
      {pendingDocumentId && (
        <ConfirmDialog
          title={t("common.removeDocumentConfirm")}
          confirmLabel={t("common.remove")}
          pending={mutations.removeDocument.isPending}
          onConfirm={() =>
            mutations.removeDocument.mutate(
              { expenseId: expense.id, attachmentId: pendingDocumentId },
              {
                onSuccess: () => {
                  setPendingDocumentId(null);
                  toast.success(t("bills.documentRemoved"));
                },
                onError: (error) => toast.error(error.message),
              },
            )
          }
          onClose={() => setPendingDocumentId(null)}
        />
      )}
    </PageContainer>
  );
}
