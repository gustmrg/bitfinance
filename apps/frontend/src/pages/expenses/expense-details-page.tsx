import { ArrowLeft, Pencil } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { FileCategory } from "@/api/bills/bills.types";
import { expensesService } from "@/api/expenses/expenses.service";
import { useAuth } from "@/auth/auth-provider";
import { Amount } from "@/components/base/amount";
import { Badge } from "@/components/base/badge";
import { Button } from "@/components/base/button";
import { Card } from "@/components/base/card";
import { ConfirmDialog } from "@/components/base/dialog";
import { ErrorState, LoadingState } from "@/components/base/feedback";
import { PageHeader } from "@/components/base/page-header";
import { DocumentsCard } from "@/components/finance/documents-card";
import { Page } from "@/components/layout/page";
import { useExpenseMutations } from "@/hooks/mutations/use-expense-mutations";
import { useAttachmentUploadAvailability } from "@/hooks/queries/use-organization-queries";
import { useExpenseQuery } from "@/hooks/queries/use-expense-queries";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { isAcceptedDocument } from "@/lib/file-validation";
import { categoryLabel, paymentMethodLabels } from "@/lib/finance-categories";
import { formatLongDate } from "@/lib/format";
import { ExpenseModal } from "@/pages/expenses/components/expense-modal";

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-t border-line py-3.5 first:border-t-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[13px] font-semibold text-ink-muted">{label}</dt>
      <dd className="m-0 text-sm text-ink">{children}</dd>
    </div>
  );
}

export function ExpenseDetailsPage() {
  const { t } = useTranslation();
  const { expenseId } = useParams();
  const organizationId = useSelectedOrganization();
  const locale = useLocale();
  const { user } = useAuth();
  const query = useExpenseQuery(organizationId, expenseId);
  const attachmentUploads = useAttachmentUploadAvailability(organizationId);
  const mutations = useExpenseMutations(organizationId);
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const expense = query.data;

  const upload = (files: File[], category: FileCategory) => {
    const file = files[0];
    if (!attachmentUploads.available || !file || !isAcceptedDocument(file)) {
      toast.error(t("bills.invalidFile"));
      return;
    }
    if (expenseId)
      mutations.upload.mutate(
        { id: expenseId, file, category },
        {
          onSuccess: () => toast.success(t("bills.uploaded")),
          onError: (error) => toast.error(error.message),
        },
      );
  };
  const download = async (documentId: string) => {
    try {
      const response = await expensesService.getDocumentDownloadUrlAsync(
        organizationId!,
        expenseId!,
        documentId,
      );
      window.open(response.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("api.expenses.openDocument"));
    }
  };

  const backLink = (
    <Link
      to="/expenses"
      className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-brand-ink"
    >
      <ArrowLeft size={16} aria-hidden="true" /> {t("nav.expenses")}
    </Link>
  );

  if (query.isPending)
    return (
      <Page>
        {backLink}
        <Card>
          <LoadingState />
        </Card>
      </Page>
    );
  if (query.error || !expense)
    return (
      <Page>
        {backLink}
        <Card>
          <ErrorState
            message={query.error?.message ?? t("expenses.notFound")}
            onRetry={() => void query.refetch()}
          />
        </Card>
      </Page>
    );

  return (
    <Page>
      {backLink}
      <PageHeader
        title={expense.description}
        description={`${t(categoryLabel(expense.category))} · ${formatLongDate(expense.occurredAt, locale)}`}
        actions={
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil size={16} aria-hidden="true" /> {t("expenses.edit")}
          </Button>
        }
      />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card className="grid gap-5">
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-ink-muted">{t("expenses.amount")}</span>
            <Amount
              value={expense.amount}
              className="text-[40px] font-extrabold leading-none tracking-[-0.04em]"
            />
            <div>
              <Badge
                tone={
                  expense.status === "paid"
                    ? "success"
                    : expense.status === "pending"
                      ? "warning"
                      : "neutral"
                }
              >
                {t(`statuses.${expense.status}`)}
              </Badge>
            </div>
          </div>
          <dl className="m-0">
            <DetailItem label={t("expenses.occurred")}>
              {formatLongDate(expense.occurredAt, locale)}
            </DetailItem>
            <DetailItem label={t("common.category")}>
              {t(categoryLabel(expense.category))}
            </DetailItem>
            <DetailItem label={t("expenses.paymentMethod")}>
              {expense.paymentMethod
                ? t(paymentMethodLabels[expense.paymentMethod])
                : t("common.notSpecified")}
            </DetailItem>
            <DetailItem label={t("expenses.createdBy")}>{expense.createdBy}</DetailItem>
            <DetailItem label={t("common.notesTitle")}>
              <span className="whitespace-pre-line">
                {expense.notes || (
                  <span className="text-ink-muted">{t("common.notSpecified")}</span>
                )}
              </span>
            </DetailItem>
          </dl>
        </Card>
        <DocumentsCard
          documents={expense.documents}
          available={attachmentUploads.available}
          isFree={attachmentUploads.isFree}
          description={t("expenses.attachmentDescription")}
          emptyTitle={t("expenses.noAttachments")}
          emptyDescription={t("expenses.receiptHint")}
          uploading={mutations.upload.isPending}
          defaultCategory="Receipt"
          onUpload={upload}
          onDownload={(document) => void download(document.id)}
          onRemove={(document) => setPendingDocumentId(document.id)}
        />
      </div>
      {editOpen && organizationId && user && (
        <ExpenseModal
          expense={expense}
          organizationId={organizationId}
          userId={user.id}
          onClose={() => setEditOpen(false)}
        />
      )}
      <ConfirmDialog
        open={Boolean(pendingDocumentId)}
        onOpenChange={(next) => !next && setPendingDocumentId(null)}
        title={t("common.removeDocumentConfirm")}
        confirmLabel={t("common.remove")}
        pending={mutations.removeDocument.isPending}
        onConfirm={() =>
          mutations.removeDocument.mutate(
            { expenseId: expense.id, attachmentId: pendingDocumentId! },
            {
              onSuccess: () => {
                setPendingDocumentId(null);
                toast.success(t("bills.documentRemoved"));
              },
              onError: (error) => toast.error(error.message),
            },
          )
        }
      />
    </Page>
  );
}
