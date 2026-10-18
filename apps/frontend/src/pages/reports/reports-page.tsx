import { BarChart3, CircleDollarSign, ReceiptText, WalletCards } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CategoryReportItem, MonthlyReportItem } from "@/api/reports/reports.types";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageContainer } from "@/components/layout/page-container";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { useReportQuery } from "@/hooks/queries/use-report-queries";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { categoryLabel } from "@/lib/finance-categories";
import { formatCurrency } from "@/lib/format";

const periodOptions = ["3", "6", "12"] as const;
type Period = (typeof periodOptions)[number];

function monthLabel(item: MonthlyReportItem, locale: string, style: "short" | "long" = "short") {
  const label = new Intl.DateTimeFormat(locale, {
    month: style,
    year: style === "long" ? "numeric" : undefined,
  }).format(new Date(item.year, item.month - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function MonthlyChart({
  months,
  budget,
  locale,
}: {
  months: MonthlyReportItem[];
  budget: number | null;
  locale: string;
}) {
  const { t } = useTranslation();
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(
    ...months.flatMap((item) => [item.expensesTotal, item.billsTotal]),
    budget ?? 0,
    1,
  );
  const scale = (value: number) => `${(value / max) * 100}%`;
  const hovered = active === null ? null : months[active];
  return (
    <div className="report-chart">
      <div className="report-chart__legend">
        <span>
          <i className="report-swatch report-swatch--expenses" /> {t("reports.expenses")}
        </span>
        <span>
          <i className="report-swatch report-swatch--bills" /> {t("reports.bills")}
        </span>
        {budget !== null && (
          <span>
            <i className="report-swatch report-swatch--budget" /> {t("reports.budget")}
          </span>
        )}
      </div>
      <div className="report-chart__plot" onMouseLeave={() => setActive(null)}>
        {budget !== null && (
          <div
            className="report-chart__budget"
            style={{ "--ratio": budget / max } as CSSProperties}
          >
            <span>{formatCurrency(budget, locale)}</span>
          </div>
        )}
        {months.map((item, index) => (
          <button
            type="button"
            key={`${item.year}-${item.month}`}
            className={`report-chart__group ${active === index ? "report-chart__group--active" : ""}`}
            aria-label={`${monthLabel(item, locale, "long")}: ${t("reports.expenses")} ${formatCurrency(item.expensesTotal, locale)}, ${t("reports.bills")} ${formatCurrency(item.billsTotal, locale)}`}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
          >
            <span className="report-chart__bars">
              <i
                className="report-chart__bar report-chart__bar--expenses"
                style={{ height: scale(item.expensesTotal) }}
              />
              <i
                className="report-chart__bar report-chart__bar--bills"
                style={{ height: scale(item.billsTotal) }}
              />
            </span>
            <span className="report-chart__label">{monthLabel(item, locale)}</span>
          </button>
        ))}
        {hovered && (
          <div
            className="report-chart__tooltip"
            role="status"
            style={{ "--tooltip-index": active, "--tooltip-count": months.length } as CSSProperties}
          >
            <strong>{monthLabel(hovered, locale, "long")}</strong>
            <span>
              <i className="report-swatch report-swatch--expenses" /> {t("reports.expenses")}
              <b>{formatCurrency(hovered.expensesTotal, locale)}</b>
            </span>
            <span>
              <i className="report-swatch report-swatch--bills" /> {t("reports.bills")}
              <b>{formatCurrency(hovered.billsTotal, locale)}</b>
            </span>
            <span>
              {t("reports.billsPaid")}
              <b>{formatCurrency(hovered.billsPaidTotal, locale)}</b>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryBreakdown({
  items,
  tone,
  locale,
}: {
  items: CategoryReportItem[];
  tone: "expenses" | "bills";
  locale: string;
}) {
  const { t } = useTranslation();
  const total = items.reduce((sum, item) => sum + item.total, 0);
  const max = Math.max(...items.map((item) => item.total), 1);
  if (!items.length)
    return (
      <EmptyState
        icon={BarChart3}
        title={t("reports.noCategoryData")}
        description={t("reports.noCategoryDataBody")}
      />
    );
  return (
    <div className="report-categories">
      {items.map((item) => (
        <div className="report-category" key={item.category}>
          <span>{t(categoryLabel(item.category))}</span>
          <span className="report-category__value">
            {formatCurrency(item.total, locale)}
            <small>{total ? Math.round((item.total / total) * 100) : 0}%</small>
          </span>
          <div className="report-category__track">
            <i
              className={`report-category__fill report-category__fill--${tone}`}
              style={{ width: `${(item.total / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportsPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const organizationId = useSelectedOrganization();
  const [period, setPeriod] = useState<Period>("6");
  const query = useReportQuery(organizationId, Number(period));
  const report = query.data;
  const expensesTotal = report?.months.reduce((sum, item) => sum + item.expensesTotal, 0) ?? 0;
  const billsTotal = report?.months.reduce((sum, item) => sum + item.billsTotal, 0) ?? 0;
  const billsPaidTotal = report?.months.reduce((sum, item) => sum + item.billsPaidTotal, 0) ?? 0;
  const monthsCount = report?.months.length || 1;
  return (
    <PageContainer>
      <PageHeader
        eyebrow={t("reports.eyebrow")}
        title={t("reports.title")}
        description={t("reports.body")}
        actions={
          <Select<Period>
            ariaLabel={t("reports.period")}
            value={period}
            onValueChange={setPeriod}
            options={periodOptions.map((value) => ({
              value,
              label: t("reports.lastMonths", { count: Number(value) }),
            }))}
          />
        }
      />
      {query.isPending ? (
        <LoadingState />
      ) : query.error || !report ? (
        <ErrorState
          message={query.error?.message ?? t("api.reports.load")}
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : (
        <>
          <div className="metrics-grid">
            <MetricCard
              label={t("reports.totalExpenses")}
              value={formatCurrency(expensesTotal, locale)}
              detail={t("reports.inPeriod", { count: monthsCount })}
              icon={BarChart3}
              tone="blue"
            />
            <MetricCard
              label={t("reports.averageExpenses")}
              value={formatCurrency(expensesTotal / monthsCount, locale)}
              detail={
                report.monthlyBudget === null
                  ? t("reports.perMonth")
                  : t("reports.againstBudget", {
                      amount: formatCurrency(report.monthlyBudget, locale),
                    })
              }
              icon={WalletCards}
              tone="ink"
            />
            <MetricCard
              label={t("reports.totalBills")}
              value={formatCurrency(billsTotal, locale)}
              detail={t("reports.byDueDate")}
              icon={ReceiptText}
              tone="amber"
            />
            <MetricCard
              label={t("reports.billsPaid")}
              value={formatCurrency(billsPaidTotal, locale)}
              detail={t("reports.paidShare", {
                percent: billsTotal ? Math.round((billsPaidTotal / billsTotal) * 100) : 0,
              })}
              icon={CircleDollarSign}
              tone="mint"
            />
          </div>
          <section className="surface-card report-card">
            <SectionHeading
              title={t("reports.monthlyTitle")}
              description={t("reports.monthlyBody")}
            />
            <MonthlyChart months={report.months} budget={report.monthlyBudget} locale={locale} />
            <details className="report-table">
              <summary>{t("reports.showTable")}</summary>
              <table>
                <thead>
                  <tr>
                    <th scope="col">{t("reports.month")}</th>
                    <th scope="col">{t("reports.expenses")}</th>
                    <th scope="col">{t("reports.bills")}</th>
                    <th scope="col">{t("reports.billsPaid")}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.months.map((item) => (
                    <tr key={`${item.year}-${item.month}`}>
                      <th scope="row">{monthLabel(item, locale, "long")}</th>
                      <td>{formatCurrency(item.expensesTotal, locale)}</td>
                      <td>{formatCurrency(item.billsTotal, locale)}</td>
                      <td>{formatCurrency(item.billsPaidTotal, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </section>
          <div className="dashboard-grid">
            <section className="surface-card report-card">
              <SectionHeading
                title={t("reports.expensesByCategory")}
                description={t("reports.expensesByCategoryBody")}
              />
              <CategoryBreakdown items={report.expenseCategories} tone="expenses" locale={locale} />
            </section>
            <section className="surface-card report-card">
              <SectionHeading
                title={t("reports.billsByCategory")}
                description={t("reports.billsByCategoryBody")}
              />
              <CategoryBreakdown items={report.billCategories} tone="bills" locale={locale} />
            </section>
          </div>
        </>
      )}
    </PageContainer>
  );
}
