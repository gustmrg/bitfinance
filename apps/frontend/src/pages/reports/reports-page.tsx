import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CategoryReportItem, MonthlyReportItem } from "@/api/reports/reports.types";
import { Amount } from "@/components/base/amount";
import { Card, CardHeader } from "@/components/base/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/base/feedback";
import { PageHeader } from "@/components/base/page-header";
import { SegmentedControl } from "@/components/base/segmented-control";
import { Stat } from "@/components/base/stat";
import { Page } from "@/components/layout/page";
import { useReportQuery } from "@/hooks/queries/use-report-queries";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { cn } from "@/lib/cn";
import { categoryLabel } from "@/lib/finance-categories";
import { formatCurrency } from "@/lib/format";

type Period = "3" | "6" | "12";

function monthLabel(item: MonthlyReportItem, locale: string, style: "short" | "long" = "short") {
  const label = new Intl.DateTimeFormat(locale, {
    month: style,
    year: style === "long" ? "numeric" : undefined,
  }).format(new Date(item.year, item.month - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

function Swatch({ className }: { className: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-block size-2.5 rounded-[3px]", className)} />
  );
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
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <Swatch className="bg-chart-1" /> {t("reports.expenses")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Swatch className="bg-chart-2" /> {t("reports.bills")}
        </span>
        {budget !== null && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="w-3 border-t-2 border-dashed border-ink-muted" />
            {t("reports.budget")}
          </span>
        )}
      </div>
      <div
        className="relative flex h-56 gap-1 border-b border-line pb-6 pt-6 sm:h-64"
        onMouseLeave={() => setActive(null)}
      >
        {budget !== null && (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-line-strong"
            style={{ bottom: `calc(24px + (100% - 48px) * ${budget / max})` }}
          >
            <span className="absolute -top-5 right-0 text-[11px] font-semibold tabular-nums text-ink-muted">
              {formatCurrency(budget, locale)}
            </span>
          </div>
        )}
        {months.map((item, index) => (
          <button
            type="button"
            key={`${item.year}-${item.month}`}
            aria-label={`${monthLabel(item, locale, "long")}: ${t("reports.expenses")} ${formatCurrency(item.expensesTotal, locale)}, ${t("reports.bills")} ${formatCurrency(item.billsTotal, locale)}`}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
            className={cn(
              "relative flex min-w-0 flex-1 cursor-default flex-col justify-end rounded-[10px] px-1 outline-none",
              active === index && "bg-surface-muted",
            )}
          >
            <span className="flex h-full items-end justify-center gap-0.5">
              <span
                className="block min-h-0.5 w-[min(40%,22px)] rounded-t-[4px] bg-chart-1"
                style={{ height: scale(item.expensesTotal) }}
              />
              <span
                className="block min-h-0.5 w-[min(40%,22px)] rounded-t-[4px] bg-chart-2"
                style={{ height: scale(item.billsTotal) }}
              />
            </span>
            <span className="absolute inset-x-0 -bottom-5 text-center text-[11px] font-semibold text-ink-muted">
              {monthLabel(item, locale)}
            </span>
          </button>
        ))}
        {hovered && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-20 grid w-48 gap-1.5 rounded-control border border-line bg-surface p-3 text-xs shadow-xl"
            style={{
              left: `clamp(0px, calc(${(active + 0.5) / months.length} * 100% - 96px), calc(100% - 192px))`,
            }}
          >
            <strong className="text-[13px] text-ink">{monthLabel(hovered, locale, "long")}</strong>
            <span className="flex items-center gap-1.5 text-ink-muted">
              <Swatch className="bg-chart-1" /> {t("reports.expenses")}
              <Amount value={hovered.expensesTotal} className="ml-auto font-bold text-ink" />
            </span>
            <span className="flex items-center gap-1.5 text-ink-muted">
              <Swatch className="bg-chart-2" /> {t("reports.bills")}
              <Amount value={hovered.billsTotal} className="ml-auto font-bold text-ink" />
            </span>
            <span className="flex items-center gap-1.5 text-ink-muted">
              {t("reports.billsPaid")}
              <Amount value={hovered.billsPaidTotal} className="ml-auto font-bold text-ink" />
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
}: {
  items: CategoryReportItem[];
  tone: "expenses" | "bills";
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
    <ul className="m-0 grid list-none gap-4 p-0">
      {items.map((item) => (
        <li key={item.category} className="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5 text-sm">
          <span className="truncate text-ink">{t(categoryLabel(item.category))}</span>
          <span className="inline-flex items-baseline gap-2">
            <Amount value={item.total} className="font-bold" />
            <span className="w-9 text-right text-xs tabular-nums text-ink-muted">
              {total ? Math.round((item.total / total) * 100) : 0}%
            </span>
          </span>
          <span className="col-span-2 h-2 overflow-hidden rounded-full bg-line">
            <span
              className={cn(
                "block h-full rounded-full",
                tone === "expenses" ? "bg-chart-1" : "bg-chart-2",
              )}
              style={{ width: `${(item.total / max) * 100}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
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
    <Page>
      <PageHeader
        title={t("reports.title")}
        description={t("reports.body")}
        actions={
          <SegmentedControl<Period>
            label={t("reports.period")}
            value={period}
            onChange={setPeriod}
            options={(["3", "6", "12"] as Period[]).map((value) => ({
              value,
              label: t("reports.lastMonthsShort", { count: Number(value) }),
            }))}
          />
        }
      />
      {query.isPending ? (
        <Card>
          <LoadingState />
        </Card>
      ) : query.error || !report ? (
        <Card>
          <ErrorState
            message={query.error?.message ?? t("api.reports.load")}
            onRetry={() => void query.refetch()}
          />
        </Card>
      ) : (
        <>
          <Card padding="none" className="grid grid-cols-2 lg:grid-cols-4">
            <Stat
              className="border-b border-r border-line p-5 lg:border-b-0"
              label={t("reports.totalExpenses")}
              value={<Amount value={expensesTotal} />}
              detail={t("reports.inPeriod", { count: monthsCount })}
            />
            <Stat
              className="border-b border-line p-5 lg:border-b-0 lg:border-r"
              label={t("reports.averageExpenses")}
              value={<Amount value={expensesTotal / monthsCount} />}
              detail={
                report.monthlyBudget === null
                  ? t("reports.perMonth")
                  : t("reports.againstBudget", {
                      amount: formatCurrency(report.monthlyBudget, locale),
                    })
              }
            />
            <Stat
              className="border-r border-line p-5"
              label={t("reports.totalBills")}
              value={<Amount value={billsTotal} />}
              detail={t("reports.byDueDate")}
            />
            <Stat
              className="p-5"
              tone="success"
              label={t("reports.billsPaid")}
              value={<Amount value={billsPaidTotal} />}
              detail={t("reports.paidShare", {
                percent: billsTotal ? Math.round((billsPaidTotal / billsTotal) * 100) : 0,
              })}
            />
          </Card>
          <Card aria-labelledby="reports-monthly">
            <CardHeader
              titleId="reports-monthly"
              title={t("reports.monthlyTitle")}
              description={t("reports.monthlyBody")}
            />
            <MonthlyChart months={report.months} budget={report.monthlyBudget} locale={locale} />
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-bold text-brand-ink">
                {t("reports.showTable")}
              </summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="text-xs text-ink-muted">
                      <th scope="col" className="py-2 pr-4 text-left font-semibold">
                        {t("reports.month")}
                      </th>
                      <th scope="col" className="py-2 pl-4 text-right font-semibold">
                        {t("reports.expenses")}
                      </th>
                      <th scope="col" className="py-2 pl-4 text-right font-semibold">
                        {t("reports.bills")}
                      </th>
                      <th scope="col" className="py-2 pl-4 text-right font-semibold">
                        {t("reports.billsPaid")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.months.map((item) => (
                      <tr key={`${item.year}-${item.month}`} className="border-t border-line">
                        <th scope="row" className="py-2.5 pr-4 text-left font-semibold">
                          {monthLabel(item, locale, "long")}
                        </th>
                        <td className="py-2.5 pl-4 text-right">
                          <Amount value={item.expensesTotal} />
                        </td>
                        <td className="py-2.5 pl-4 text-right">
                          <Amount value={item.billsTotal} />
                        </td>
                        <td className="py-2.5 pl-4 text-right">
                          <Amount value={item.billsPaidTotal} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </Card>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card aria-labelledby="reports-expense-categories">
              <CardHeader
                titleId="reports-expense-categories"
                title={t("reports.expensesByCategory")}
                description={t("reports.expensesByCategoryBody")}
              />
              <CategoryBreakdown items={report.expenseCategories} tone="expenses" />
            </Card>
            <Card aria-labelledby="reports-bill-categories">
              <CardHeader
                titleId="reports-bill-categories"
                title={t("reports.billsByCategory")}
                description={t("reports.billsByCategoryBody")}
              />
              <CategoryBreakdown items={report.billCategories} tone="bills" />
            </Card>
          </div>
        </>
      )}
    </Page>
  );
}
