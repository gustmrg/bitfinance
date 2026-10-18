import { CalendarClock, Layers, ReceiptText, Repeat, WalletCards } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { BillFrequency, BillSeries } from "@/api/bills/bills.types";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { DataIcon } from "@/components/ui/data-icon";
import { MetricCard } from "@/components/ui/metric-card";
import { ConfirmDialog } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { useBillMutations } from "@/hooks/mutations/use-bill-mutations";
import { useBillSeriesQuery } from "@/hooks/queries/use-bill-queries";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { categoryLabel } from "@/lib/finance-categories";
import { formatCurrency, formatLongDate } from "@/lib/format";

const monthlyFactor: Record<BillFrequency, number> = {
  daily: 365 / 12,
  weekly: 52 / 12,
  monthly: 1,
  annually: 1 / 12,
};

function SeriesRow({
  series,
  locale,
  onStop,
}: {
  series: BillSeries;
  locale: string;
  onStop?: () => void;
}) {
  const { t } = useTranslation();
  const progress =
    series.type === "installment" && series.totalOccurrences
      ? t("recurrences.installmentProgress", {
          current: series.generatedOccurrences,
          total: series.totalOccurrences,
        })
      : t("recurrences.since", { date: formatLongDate(series.startDate, locale) });
  return (
    <div className="series-row">
      <DataIcon type="bill" />
      <span className="series-row__primary">
        <strong>{series.description}</strong>
        <small>
          {t(categoryLabel(series.category))} · {t(`types.${series.type}`)} ·{" "}
          {t(`bills.${series.frequency}`)}
        </small>
      </span>
      <span className="series-row__meta">
        <small>{progress}</small>
        {series.isActive ? (
          series.nextBillId && series.nextDueDate ? (
            <Link to={`/bills/${series.nextBillId}`} className="inline-link">
              {t("recurrences.nextDue", { date: formatLongDate(series.nextDueDate, locale) })}
            </Link>
          ) : (
            <small>{t("recurrences.noOpenBill")}</small>
          )
        ) : (
          <small>
            {series.stoppedAt
              ? t("recurrences.stoppedOn", { date: formatLongDate(series.stoppedAt, locale) })
              : t("recurrences.completed")}
          </small>
        )}
      </span>
      <strong className="series-row__amount">{formatCurrency(series.amountDue, locale)}</strong>
      {onStop && (
        <Button variant="ghost" onClick={onStop}>
          {t("bills.stopFuture")}
        </Button>
      )}
    </div>
  );
}

export function RecurrencesPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const organizationId = useSelectedOrganization();
  const query = useBillSeriesQuery(organizationId);
  const mutations = useBillMutations(organizationId);
  const [pendingStop, setPendingStop] = useState<BillSeries | null>(null);
  const series = query.data ?? [];
  const active = series.filter((item) => item.isActive);
  const ended = series.filter((item) => !item.isActive);
  const monthlyCommitment = active
    .filter((item) => item.type === "recurring")
    .reduce((sum, item) => sum + item.amountDue * monthlyFactor[item.frequency], 0);
  const activeInstallments = active.filter((item) => item.type === "installment").length;
  const confirmStop = () => {
    if (!pendingStop) return;
    mutations.stopSeries.mutate(pendingStop.id, {
      onSuccess: () => {
        setPendingStop(null);
        toast.success(t("recurrences.stopped"));
      },
      onError: (error) => toast.error(error.message),
    });
  };
  return (
    <PageContainer>
      <PageHeader
        eyebrow={t("recurrences.eyebrow")}
        title={t("recurrences.title")}
        description={t("recurrences.body")}
      />
      {query.isPending ? (
        <LoadingState />
      ) : query.error ? (
        <ErrorState
          message={query.error.message}
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : !series.length ? (
        <EmptyState
          icon={Repeat}
          title={t("recurrences.emptyTitle")}
          description={t("recurrences.emptyBody")}
          action={
            <Link to="/bills" className="button button--primary">
              {t("nav.bills")}
            </Link>
          }
        />
      ) : (
        <>
          <div className="metrics-grid">
            <MetricCard
              label={t("recurrences.activeSeries")}
              value={String(active.length)}
              detail={t("recurrences.activeSeriesDetail")}
              icon={Repeat}
              tone="blue"
            />
            <MetricCard
              label={t("recurrences.monthlyCommitment")}
              value={formatCurrency(monthlyCommitment, locale)}
              detail={t("recurrences.monthlyCommitmentDetail")}
              icon={WalletCards}
              tone="mint"
            />
            <MetricCard
              label={t("recurrences.activeInstallments")}
              value={String(activeInstallments)}
              detail={t("recurrences.activeInstallmentsDetail")}
              icon={Layers}
              tone="amber"
            />
            <MetricCard
              label={t("recurrences.ended")}
              value={String(ended.length)}
              detail={t("recurrences.endedDetail")}
              icon={CalendarClock}
              tone="ink"
            />
          </div>
          <section className="surface-card series-card">
            <SectionHeading
              title={t("recurrences.activeTitle")}
              description={t("recurrences.activeBody")}
            />
            {active.length ? (
              <div className="series-list">
                {active.map((item) => (
                  <SeriesRow
                    key={item.id}
                    series={item}
                    locale={locale}
                    onStop={() => setPendingStop(item)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ReceiptText}
                title={t("recurrences.noActive")}
                description={t("recurrences.noActiveBody")}
              />
            )}
          </section>
          {ended.length > 0 && (
            <section className="surface-card series-card series-card--ended">
              <SectionHeading
                title={t("recurrences.endedTitle")}
                description={t("recurrences.endedBody")}
              />
              <div className="series-list">
                {ended.map((item) => (
                  <SeriesRow key={item.id} series={item} locale={locale} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
      {pendingStop && (
        <ConfirmDialog
          title={t("common.stopFutureBillsConfirm")}
          description={pendingStop.description}
          confirmLabel={t("bills.stopFuture")}
          pending={mutations.stopSeries.isPending}
          onConfirm={confirmStop}
          onClose={() => setPendingStop(null)}
        />
      )}
    </PageContainer>
  );
}
