import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  ChevronRight,
  CircleDollarSign,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/auth-provider";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageContainer } from "@/components/layout/page-container";
import { DataIcon } from "@/components/ui/data-icon";
import { KpiSparkline } from "@/components/ui/kpi-sparkline";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { QuickAction } from "@/components/ui/quick-action";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusPill } from "@/components/ui/status-pill";
import { formatCurrency, formatDate } from "@/lib/format";
import { useDashboardQueries } from "@/hooks/queries/use-dashboard-queries";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { categoryLabels } from "@/lib/finance-categories";
import { CashflowTimeline, CategoryBar } from "@/pages/dashboard/components/dashboard-charts";
import { categoryPercentage } from "@/pages/dashboard/dashboard-utils";

export function DashboardPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const organizationId = useSelectedOrganization();
  const month = useCurrentMonth();
  const { user } = useAuth();
  const queries = useDashboardQueries(organizationId, month.from, month.to);
  const summary = queries.summary.data;
  const upcoming = queries.upcoming.data ?? [];
  const recent = queries.recent.data ?? [];
  if (!organizationId)
    return (
      <PageContainer>
        <EmptyState
          icon={Building2}
          title={t("dashboard.createOrganization")}
          description={t("dashboard.needsOrganization")}
          action={
            <Link to="/account/create-organization" className="button button--primary">
              {t("dashboard.createWorkspace")}
            </Link>
          }
        />
      </PageContainer>
    );
  const loading =
    queries.summary.isPending || queries.upcoming.isPending || queries.recent.isPending;
  const failed = queries.summary.error || queries.upcoming.error || queries.recent.error;
  const name = user?.fullName.split(" ")[0] ?? t("dashboard.greetingFallback");
  const budgetLabel =
    summary?.monthlyBudget == null
      ? t("dashboard.notSet")
      : formatCurrency(summary.monthlyBudget, locale);
  const spent = summary?.spentThisMonth ?? 0;
  const spentPercentage = summary?.spentPercentage ?? 0;
  return (
    <PageContainer>
      <PageHeader
        eyebrow={t("dashboard.eyebrow")}
        title={t("common.titleWithName", { title: t("dashboard.title"), name })}
        description={t("dashboard.body")}
        actions={
          <div className="period-control">
            <span className="period-control__dot" />
            {formatDate(month.from.toISOString(), locale)} —{" "}
            {formatDate(month.to.toISOString(), locale)} <ChevronRight size={14} />
          </div>
        }
      />
      {loading && !summary ? (
        <LoadingState />
      ) : failed && !summary ? (
        <ErrorState
          message={t("dashboard.dataUnavailable")}
          onRetry={() => {
            void queries.summary.refetch();
            void queries.upcoming.refetch();
            void queries.recent.refetch();
          }}
        />
      ) : (
        <>
          <div className="dashboard-intro">
            <div>
              <span className="dashboard-intro__label">{t("dashboard.onTrack")}</span>
              <p>
                {t("dashboard.committedMoney", {
                  amount: formatCurrency(summary?.upcomingBillsAmount ?? 0, locale),
                })}
              </p>
            </div>
          </div>
          <div className="metrics-grid">
            <MetricCard
              label={t("dashboard.budget")}
              value={budgetLabel}
              detail={
                summary?.monthlyBudget == null
                  ? t("dashboard.configureLimit")
                  : t("dashboard.currentLimit")
              }
              icon={WalletCards}
              tone="blue"
              progress={summary?.monthlyBudget == null ? undefined : spentPercentage}
            />
            <MetricCard
              label={t("dashboard.spent")}
              value={formatCurrency(spent, locale)}
              detail={
                summary?.monthlyBudget == null
                  ? t("dashboard.noBudget")
                  : `${spentPercentage}% ${t("dashboard.budgetUsed")}`
              }
              icon={BarChart3}
              tone="mint"
            />
            <MetricCard
              label={t("dashboard.remaining")}
              value={
                summary?.remainingBudget == null
                  ? t("dashboard.notSet")
                  : formatCurrency(summary.remainingBudget, locale)
              }
              detail={t("dashboard.availableToSpend")}
              icon={CircleDollarSign}
              tone="ink"
            />
            <MetricCard
              label={t("dashboard.upcoming")}
              value={formatCurrency(summary?.upcomingBillsAmount ?? 0, locale)}
              detail={t("common.commitmentCount", {
                count: summary?.upcomingBillsCount ?? upcoming.length,
              })}
              icon={ReceiptText}
              tone="amber"
            />
          </div>
          {queries.upcoming.error ? (
            <ErrorState
              message={t("dashboard.upcomingUnavailable")}
              onRetry={() => {
                void queries.upcoming.refetch();
              }}
            />
          ) : (
            <CashflowTimeline bills={upcoming} expenses={recent} locale={locale} />
          )}
          {queries.recent.error ? (
            <ErrorState
              message={t("dashboard.recentUnavailable")}
              onRetry={() => {
                void queries.recent.refetch();
              }}
            />
          ) : (
            <div className="dashboard-grid">
              <section className="surface-card">
                <SectionHeading
                  title={t("dashboard.upcomingTitle")}
                  description={t("dashboard.nextDecisions")}
                  action={
                    <Link to="/dashboard/bills" className="inline-link">
                      {t("common.viewAll")} <ArrowUpRight size={14} />
                    </Link>
                  }
                />
                <div className="compact-list">
                  {upcoming.slice(0, 3).map((bill) => (
                    <Link to={`/dashboard/bills/${bill.id}`} className="compact-row" key={bill.id}>
                      <DataIcon type="bill" />
                      <span>
                        <strong>{bill.description}</strong>
                        <small>
                          {formatDate(bill.dueDate, locale)} · {t(categoryLabels[bill.category])}
                        </small>
                      </span>
                      <span className="compact-row__amount">
                        <strong>{formatCurrency(bill.amountDue, locale)}</strong>
                        <StatusPill status={bill.status} />
                      </span>
                    </Link>
                  ))}
                  {!upcoming.length && (
                    <EmptyState
                      icon={ReceiptText}
                      title={t("dashboard.noUpcoming")}
                      description={t("dashboard.nextCommitments")}
                    />
                  )}
                </div>
              </section>
              <section className="surface-card">
                <SectionHeading
                  title={t("dashboard.recentTitle")}
                  description={t("dashboard.selectedPeriodRead")}
                  action={
                    <Link to="/dashboard/expenses" className="inline-link">
                      {t("common.viewAll")} <ArrowUpRight size={14} />
                    </Link>
                  }
                />
                <div className="recent-summary">
                  <div className="recent-summary__chart">
                    <KpiSparkline
                      values={recent.length ? recent.slice(0, 8).map((item) => item.amount) : [0]}
                      color="#23b89a"
                    />
                    <span>
                      <strong>{formatCurrency(spent, locale)}</strong>
                      <small>{t("common.transactionCount", { count: recent.length })}</small>
                    </span>
                  </div>
                  <div className="category-bars">
                    <CategoryBar
                      label={t("dashboard.foodHome")}
                      value={categoryPercentage(recent, ["food", "housing"])}
                      color="mint"
                    />
                    <CategoryBar
                      label={t("dashboard.transport")}
                      value={categoryPercentage(recent, ["transportation"])}
                      color="blue"
                    />
                    <CategoryBar
                      label={t("dashboard.personal")}
                      value={categoryPercentage(recent, ["personal", "gifts"])}
                      color="amber"
                    />
                  </div>
                </div>
              </section>
            </div>
          )}
          <section className="quick-actions">
            <QuickAction
              to="/dashboard/bills"
              icon={ReceiptText}
              label={t("bills.add")}
              detail={t("dashboard.keepCommitment")}
            />
            <QuickAction
              to="/dashboard/expenses"
              icon={ArrowDownRight}
              label={t("expenses.add")}
              detail={t("dashboard.recordExpense")}
            />
            <QuickAction
              to="/account/organization"
              icon={WalletCards}
              label={t("dashboard.setBudget")}
              detail={t("dashboard.monthBoundary")}
            />
          </section>
        </>
      )}
    </PageContainer>
  );
}
