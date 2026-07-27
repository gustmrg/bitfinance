import { Check, FilePlus2, MoreHorizontal } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { billsService } from "@/api/bills/bills.service";
import { FileCategory } from "@/api/bills/bills.types";
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
import { useBillMutations } from "@/hooks/mutations/use-bill-mutations";
import { useBillQuery } from "@/hooks/queries/use-bill-queries";
import { useAttachmentUploadAvailability } from "@/hooks/queries/use-organization-queries";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import {
  acceptedDocumentTypes,
  documentCategories,
  isAcceptedDocument,
} from "@/lib/file-validation";
import { categoryLabels } from "@/lib/finance-categories";

export function BillDetailsPage() {
  const { t } = useTranslation();
  const { billId } = useParams();
  const organizationId = useSelectedOrganization();
  const locale = useLocale();
  const query = useBillQuery(organizationId, billId);
  const attachmentUploads = useAttachmentUploadAvailability(organizationId);
  const mutations = useBillMutations(organizationId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileCategory, setFileCategory] = useState<FileCategory>("Other");
  const [stopSeriesConfirm, setStopSeriesConfirm] = useState(false);
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const bill = query.data;
  const upload = async (files: File[]) => {
    if (!attachmentUploads.available || files.some((file) => !isAcceptedDocument(file))) {
      toast.error(t("bills.invalidFile"));
      return;
    }

    if (!billId) {
      return;
    }

    try {
      await Promise.all(
        files.map((file) =>
          mutations.upload.mutateAsync({ id: billId, file, category: fileCategory }),
        ),
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
  const download = async (documentId: string) => {
    try {
      const response = await billsService.getDocumentDownloadUrlAsync(
        organizationId!,
        billId!,
        documentId,
      );
      window.open(response.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("api.bills.prepareDownload"));
    }
  };
  if (query.isPending)
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  if (query.error || !bill)
    return (
      <PageContainer>
        <ErrorState
          message={query.error?.message ?? t("bills.notFound")}
          onRetry={() => {
            void query.refetch();
          }}
        />
      </PageContainer>
    );
  const scheduleLabel = bill.billSeriesType
    ? [
        t(`types.${bill.billSeriesType}`),
        bill.billSeriesFrequency ? t(`bills.${bill.billSeriesFrequency}`) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : t("common.oneTime");
  return (
    <PageContainer>
      <Link to="/dashboard/bills" className="back-link">
        ← {t("nav.bills")}
      </Link>
      <PageHeader
        eyebrow={t("bills.detail")}
        title={bill.description}
        description={`${t(categoryLabels[bill.category])} · ${formatLongDate(bill.dueDate, locale)}`}
        actions={
          bill.status !== "paid" ? (
            <Button
              disabled={mutations.update.isPending}
              onClick={() =>
                mutations.update.mutate(
                  {
                    id: bill.id,
                    input: {
                      description: bill.description,
                      notes: bill.notes ?? "",
                      category: bill.category,
                      status: "paid",
                      dueDate: bill.dueDate,
                      paymentDate: new Date().toISOString(),
                      amountDue: bill.amountDue,
                      amountPaid: bill.amountDue,
                    },
                  },
                  {
                    onSuccess: () => toast.success(t("bills.markedPaid")),
                    onError: (error) => toast.error(error.message),
                  },
                )
              }
            >
              {t("bills.markPaid")} <Check size={16} />
            </Button>
          ) : null
        }
      />
      <div className="detail-grid">
        <section className="surface-card detail-card">
          <div className="detail-card__amount">
            <span>{t("bills.amountDue")}</span>
            <strong>{formatCurrency(bill.amountDue, locale)}</strong>
            <StatusPill status={bill.status} />
          </div>
          <dl className="detail-list">
            <div>
              <dt>{t("bills.dueDate")}</dt>
              <dd>{formatLongDate(bill.dueDate, locale)}</dd>
            </div>
            <div>
              <dt>{t("common.category")}</dt>
              <dd>{t(categoryLabels[bill.category])}</dd>
            </div>
            <div>
              <dt>{t("common.schedule")}</dt>
              <dd>{scheduleLabel}</dd>
            </div>
            <div className="detail-list__notes">
              <dt>{t("common.notes")}</dt>
              <dd>{bill.notes || t("common.notSpecified")}</dd>
            </div>
          </dl>
          {bill.billSeriesId && bill.billSeriesIsActive && (
            <Button
              variant="secondary"
              disabled={mutations.stopSeries.isPending}
              onClick={() => setStopSeriesConfirm(true)}
            >
              {t("bills.stopFuture")}
            </Button>
          )}
        </section>
        <section className="surface-card detail-card">
          <SectionHeading
            title={t("common.attachments")}
            description={
              attachmentUploads.isFree
                ? t("common.attachmentsPaidPlan")
                : t("bills.attachmentDescription")
            }
            action={
              <div className="section-heading__actions">
                <div className="select-field">
                  <Select
                    ariaLabel={t("common.documentCategory")}
                    value={fileCategory}
                    onValueChange={setFileCategory}
                    disabled={!attachmentUploads.available}
                    options={documentCategories.map((value) => ({
                      value,
                      label: t(`documents.${value}`),
                    }))}
                  />
                </div>
                <Button
                  variant="secondary"
                  disabled={!attachmentUploads.available || mutations.upload.isPending}
                  onClick={() => inputRef.current?.click()}
                >
                  <FilePlus2 size={16} /> {t("common.addFile")}
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept={acceptedDocumentTypes}
                  disabled={!attachmentUploads.available}
                  hidden
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    if (files.length > 0) void upload(files);
                    event.currentTarget.value = "";
                  }}
                />
              </div>
            }
          />
          {bill.documents.length ? (
            bill.documents.map((document) => (
              <div className="attachment-row" key={document.id}>
                <DataIcon type="bill" />
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
                  {t("common.open")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    void download(document.id);
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
              title={t("bills.noAttachments")}
              description={t("bills.receiptHint")}
            />
          )}
        </section>
      </div>
      {stopSeriesConfirm && bill.billSeriesId && (
        <ConfirmDialog
          title={t("common.stopFutureBillsConfirm")}
          confirmLabel={t("bills.stopFuture")}
          pending={mutations.stopSeries.isPending}
          onConfirm={() =>
            mutations.stopSeries.mutate(bill.billSeriesId!, {
              onSuccess: () => {
                setStopSeriesConfirm(false);
                toast.success(t("bills.futureStopped"));
              },
              onError: (error) => toast.error(error.message),
            })
          }
          onClose={() => setStopSeriesConfirm(false)}
        />
      )}
      {pendingDocumentId && (
        <ConfirmDialog
          title={t("common.removeDocumentConfirm")}
          confirmLabel={t("common.remove")}
          pending={mutations.removeDocument.isPending}
          onConfirm={() =>
            mutations.removeDocument.mutate(
              { billId: bill.id, documentId: pendingDocumentId },
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
