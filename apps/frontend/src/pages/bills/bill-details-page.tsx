import { ArrowLeft, Check, Pencil } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { billsService } from "@/api/bills/bills.service";
import type { FileCategory } from "@/api/bills/bills.types";
import { Amount } from "@/components/base/amount";
import { Button } from "@/components/base/button";
import { Card } from "@/components/base/card";
import { ConfirmDialog } from "@/components/base/dialog";
import { ErrorState, LoadingState } from "@/components/base/feedback";
import { PageHeader } from "@/components/base/page-header";
import { DocumentsCard } from "@/components/finance/documents-card";
import { DueStatus } from "@/components/finance/due-status";
import { Page } from "@/components/layout/page";
import { useBillMutations } from "@/hooks/mutations/use-bill-mutations";
import { useBillQuery } from "@/hooks/queries/use-bill-queries";
import { useAttachmentUploadAvailability } from "@/hooks/queries/use-organization-queries";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { isAcceptedDocument } from "@/lib/file-validation";
import { categoryLabel } from "@/lib/finance-categories";
import { formatLongDate } from "@/lib/format";
import { BillModal } from "@/pages/bills/components/bill-modal";
import { buildMarkPaidInput } from "@/pages/bills/mark-paid";

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-t border-line py-3.5 first:border-t-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[13px] font-semibold text-ink-muted">{label}</dt>
      <dd className="m-0 text-sm text-ink">{children}</dd>
    </div>
  );
}

export function BillDetailsPage() {
  const { t } = useTranslation();
  const { billId } = useParams();
  const navigate = useNavigate();
  const organizationId = useSelectedOrganization();
  const locale = useLocale();
  const query = useBillQuery(organizationId, billId);
  const attachmentUploads = useAttachmentUploadAvailability(organizationId);
  const mutations = useBillMutations(organizationId);
  const [stopSeriesConfirm, setStopSeriesConfirm] = useState(false);
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const bill = query.data;

  const upload = async (files: File[], category: FileCategory) => {
    if (!attachmentUploads.available || files.some((file) => !isAcceptedDocument(file))) {
      toast.error(t("bills.invalidFile"));
      return;
    }
    if (!billId) return;
    try {
      await Promise.all(
        files.map((file) => mutations.upload.mutateAsync({ id: billId, file, category })),
      );
      toast.success(t("bills.uploaded"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("bills.invalidFile"));
    }
  };
  const open = async (documentId: string) => {
    try {
      const blob = await billsService.getDocumentAsync(organizationId!, billId!, documentId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("api.bills.openDocument"));
    }
  };
  const download = async (documentId: string, fileName: string) => {
    try {
      const blob = await billsService.getDocumentAsync(organizationId!, billId!, documentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("api.bills.prepareDownload"));
    }
  };

  const backLink = (
    <Link
      to="/bills"
      className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-brand-ink"
    >
      <ArrowLeft size={16} aria-hidden="true" /> {t("nav.bills")}
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
  if (query.error || !bill)
    return (
      <Page>
        {backLink}
        <Card>
          <ErrorState
            message={query.error?.message ?? t("bills.notFound")}
            onRetry={() => void query.refetch()}
          />
        </Card>
      </Page>
    );

  const scheduleLabel = bill.billSeriesType
    ? [
        t(`types.${bill.billSeriesType}`),
        bill.billSeriesFrequency ? t(`bills.${bill.billSeriesFrequency}`) : null,
        bill.billSeriesType === "installment" && bill.totalOccurrences
          ? t("common.installmentCount", {
              current: bill.occurrenceNumber,
              total: bill.totalOccurrences,
            })
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : t("common.oneTime");

  return (
    <Page>
      {backLink}
      <PageHeader
        title={bill.description}
        description={`${t(categoryLabel(bill.category))} · ${formatLongDate(bill.dueDate, locale)}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil size={16} aria-hidden="true" /> {t("bills.edit")}
            </Button>
            {bill.status !== "paid" && (
              <Button
                disabled={mutations.update.isPending}
                onClick={() =>
                  mutations.update.mutate(
                    { id: bill.id, input: buildMarkPaidInput(bill) },
                    {
                      onSuccess: () => toast.success(t("bills.markedPaid")),
                      onError: (error) => toast.error(error.message),
                    },
                  )
                }
              >
                <Check size={16} aria-hidden="true" /> {t("bills.markPaid")}
              </Button>
            )}
          </>
        }
      />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card className="grid gap-5">
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-ink-muted">{t("bills.amountDue")}</span>
            <Amount
              value={bill.amountDue}
              className="text-[40px] font-extrabold leading-none tracking-[-0.04em]"
            />
            <div>
              <DueStatus dueDate={bill.dueDate} status={bill.status} />
            </div>
          </div>
          <dl className="m-0">
            <DetailItem label={t("bills.dueDate")}>
              {formatLongDate(bill.dueDate, locale)}
            </DetailItem>
            {bill.status === "paid" && (
              <DetailItem label={t("bills.amountPaid")}>
                <Amount value={bill.amountPaid ?? bill.amountDue} className="font-bold" />
                {bill.paymentDate && (
                  <span className="text-ink-muted">
                    {" · "}
                    {formatLongDate(bill.paymentDate, locale)}
                  </span>
                )}
              </DetailItem>
            )}
            <DetailItem label={t("common.category")}>{t(categoryLabel(bill.category))}</DetailItem>
            <DetailItem label={t("common.schedule")}>{scheduleLabel}</DetailItem>
            <DetailItem label={t("common.notesTitle")}>
              <span className="whitespace-pre-line">
                {bill.notes || <span className="text-ink-muted">{t("common.notSpecified")}</span>}
              </span>
            </DetailItem>
          </dl>
          {bill.billSeriesId && bill.billSeriesIsActive && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-control bg-surface-muted p-4">
              <span className="text-sm text-ink-muted">{t("bills.stopFutureHint")}</span>
              <Button
                variant="secondary"
                size="sm"
                disabled={mutations.stopSeries.isPending}
                onClick={() => setStopSeriesConfirm(true)}
              >
                {t("bills.stopFuture")}
              </Button>
            </div>
          )}
        </Card>
        <DocumentsCard
          documents={bill.documents}
          available={attachmentUploads.available}
          isFree={attachmentUploads.isFree}
          description={t("bills.attachmentDescription")}
          emptyTitle={t("bills.noAttachments")}
          emptyDescription={t("bills.receiptHint")}
          uploading={mutations.upload.isPending}
          multiple
          defaultCategory="Other"
          onUpload={(files, category) => void upload(files, category)}
          onOpen={(document) => void open(document.id)}
          onDownload={(document) => void download(document.id, document.fileName)}
          onRemove={(document) => setPendingDocumentId(document.id)}
        />
      </div>
      {editOpen && organizationId && (
        <BillModal bill={bill} organizationId={organizationId} onClose={() => setEditOpen(false)} />
      )}
      <ConfirmDialog
        open={stopSeriesConfirm && Boolean(bill.billSeriesId)}
        onOpenChange={setStopSeriesConfirm}
        title={t("common.stopFutureBillsConfirm")}
        confirmLabel={t("bills.stopFuture")}
        pending={mutations.stopSeries.isPending}
        onConfirm={() =>
          mutations.stopSeries.mutate(bill.billSeriesId!, {
            onSuccess: async () => {
              setStopSeriesConfirm(false);
              toast.success(t("bills.futureStopped"));
              const result = await query.refetch();
              if (result.isError) navigate("/dashboard/bills", { replace: true });
            },
            onError: (error) => toast.error(error.message),
          })
        }
      />
      <ConfirmDialog
        open={Boolean(pendingDocumentId)}
        onOpenChange={(next) => !next && setPendingDocumentId(null)}
        title={t("common.removeDocumentConfirm")}
        confirmLabel={t("common.remove")}
        pending={mutations.removeDocument.isPending}
        onConfirm={() =>
          mutations.removeDocument.mutate(
            { billId: bill.id, documentId: pendingDocumentId! },
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
