import { Repeat } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { BillFrequency, BillSeries } from "@/api/bills/bills.types";
import { Amount } from "@/components/base/amount";
import { Badge } from "@/components/base/badge";
import { Button } from "@/components/base/button";
import { buttonClasses } from "@/components/base/button-styles";
import { Card, CardHeader } from "@/components/base/card";
import { ConfirmDialog } from "@/components/base/dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/base/feedback";
import { PageHeader } from "@/components/base/page-header";
import { Stat } from "@/components/base/stat";
import { DueStatus } from "@/components/finance/due-status";
import { Page } from "@/components/layout/page";
import { useBillMutations } from "@/hooks/mutations/use-bill-mutations";
import { useBillSeriesQuery } from "@/hooks/queries/use-bill-queries";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { cn } from "@/lib/cn";
import { categoryLabel } from "@/lib/finance-categories";
import { formatLongDate } from "@/lib/format";

const monthlyFactor: Record<BillFrequency, number> = {
  daily: 365 / 12,
  weekly: 52 / 12,
  monthly: 1,
  annually: 1 / 12,
};

function SeriesRow({ series, onStop }: { series: BillSeries; onStop?: () => void }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const progress =
    series.type === "installment" && series.totalOccurrences
      ? t("recurrences.installmentProgress", {
          current: series.generatedOccurrences,
          total: series.totalOccurrences,
        })
      : t("recurrences.since", { date: formatLongDate(series.startDate, locale) });
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t border-line py-4 first:border-t-0 md:grid-cols-[minmax(0,1fr)_220px_130px_auto]",
        !series.isActive && "text-ink-muted",
      )}
    >
      <span className="grid min-w-0 gap-0.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn("truncate text-[15px] font-bold", series.isActive && "text-ink")}>
            {series.description}
          </span>
          <Badge tone={series.type === "installment" ? "warning" : "brand"}>
            {t(`types.${series.type}`)}
          </Badge>
        </span>
        <span className="truncate text-[13px] text-ink-muted">
          {t(categoryLabel(series.category))} · {t(`bills.${series.frequency}`)} · {progress}
        </span>
      </span>
      <span className="col-span-2 row-start-2 text-[13px] md:col-span-1 md:row-start-auto">
        {series.isActive ? (
          series.nextBillId && series.nextDueDate ? (
            <Link
              to={`/bills/${series.nextBillId}`}
              className="inline-flex flex-wrap items-center gap-x-1.5 font-semibold text-brand-ink hover:underline"
            >
              {t("recurrences.nextOn", { date: formatLongDate(series.nextDueDate, locale) })}
              <DueStatus dueDate={series.nextDueDate} status="upcoming" variant="text" />
            </Link>
          ) : (
            t("recurrences.noOpenBill")
          )
        ) : series.stoppedAt ? (
          t("recurrences.stoppedOn", { date: formatLongDate(series.stoppedAt, locale) })
        ) : (
          t("recurrences.completed")
        )}
      </span>
      <Amount
        value={series.amountDue}
        className={cn("text-right text-[15px] font-extrabold", series.isActive && "text-ink")}
      />
      {onStop ? (
        <Button
          variant="ghost"
          size="sm"
          className="col-span-2 justify-self-end md:col-span-1"
          onClick={onStop}
        >
          {t("bills.stopFuture")}
        </Button>
      ) : (
        <span className="hidden md:block" />
      )}
    </div>
  );
}

export function RecurrencesPage() {
  const { t } = useTranslation();
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
    <Page>
      <PageHeader title={t("recurrences.title")} description={t("recurrences.body")} />
      {query.isPending ? (
        <Card>
          <LoadingState />
        </Card>
      ) : query.error ? (
        <Card>
          <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
        </Card>
      ) : !series.length ? (
        <Card>
          <EmptyState
            icon={Repeat}
            title={t("recurrences.emptyTitle")}
            description={t("recurrences.emptyBody")}
            action={
              <Link to="/bills?new=1" className={buttonClasses()}>
                {t("bills.add")}
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <Card padding="none" className="grid grid-cols-2 lg:grid-cols-4">
            <Stat
              className="border-b border-r border-line p-5 lg:border-b-0"
              tone="brand"
              label={t("recurrences.monthlyCommitment")}
              value={<Amount value={monthlyCommitment} />}
              detail={t("recurrences.monthlyCommitmentDetail")}
            />
            <Stat
              className="border-b border-line p-5 lg:border-b-0 lg:border-r"
              label={t("recurrences.activeSeries")}
              value={active.length}
              detail={t("recurrences.activeSeriesDetail")}
            />
            <Stat
              className="border-r border-line p-5"
              label={t("recurrences.activeInstallments")}
              value={activeInstallments}
              detail={t("recurrences.activeInstallmentsDetail")}
            />
            <Stat
              className="p-5"
              label={t("recurrences.ended")}
              value={ended.length}
              detail={t("recurrences.endedDetail")}
            />
          </Card>
          <Card aria-labelledby="recurrences-active" padding="md" className="sm:p-6">
            <CardHeader
              titleId="recurrences-active"
              title={t("recurrences.activeTitle")}
              description={t("recurrences.activeBody")}
            />
            {active.length ? (
              active.map((item) => (
                <SeriesRow key={item.id} series={item} onStop={() => setPendingStop(item)} />
              ))
            ) : (
              <EmptyState
                icon={Repeat}
                title={t("recurrences.noActive")}
                description={t("recurrences.noActiveBody")}
              />
            )}
          </Card>
          {ended.length > 0 && (
            <Card aria-labelledby="recurrences-ended" padding="md" className="sm:p-6">
              <CardHeader
                titleId="recurrences-ended"
                title={t("recurrences.endedTitle")}
                description={t("recurrences.endedBody")}
              />
              {ended.map((item) => (
                <SeriesRow key={item.id} series={item} />
              ))}
            </Card>
          )}
        </>
      )}
      <ConfirmDialog
        open={Boolean(pendingStop)}
        onOpenChange={(next) => !next && setPendingStop(null)}
        title={t("common.stopFutureBillsConfirm")}
        description={pendingStop?.description}
        confirmLabel={t("bills.stopFuture")}
        pending={mutations.stopSeries.isPending}
        onConfirm={confirmStop}
      />
    </Page>
  );
}
