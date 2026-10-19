import { ArrowUpRight, Building2, CreditCard, Plus, ReceiptText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { DashboardBill, DashboardExpense } from "@/api/dashboard/dashboard.types";
import { useAuth } from "@/auth/auth-provider";
import { Amount } from "@/components/base/amount";
import { Badge } from "@/components/base/badge";
import { buttonClasses } from "@/components/base/button-styles";
import { Card, CardHeader } from "@/components/base/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/base/feedback";
import { Meter, type MeterSegment } from "@/components/base/meter";
import { PageHeader } from "@/components/base/page-header";
import { DateChip, DueStatus } from "@/components/finance/due-status";
import { Page } from "@/components/layout/page";
import { PeriodFilter } from "@/components/navigation/period-filter";
import { useDashboardQueries } from "@/hooks/queries/use-dashboard-queries";
import { useCurrentMonth } from "@/hooks/use-current-month";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { daysUntil, dueState } from "@/lib/due";
import { categoryLabel } from "@/lib/finance-categories";
import { formatCurrency, formatDate } from "@/lib/format";

const billGrid =
  "grid-cols-[48px_minmax(0,1fr)_auto] sm:grid-cols-[52px_minmax(0,1fr)_110px_110px_140px]";

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function shortDate(value: string, locale: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit" }).format(
    new Date(year, month - 1, day),
  );
}

const summaryGrid = "lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]";

const legendSwatches = ["bg-white", "bg-white/55", "bg-white/30"] as const;
const meterColors: MeterSegment["color"][] = ["inverse", "inverse-muted", "inverse-soft"];

function greetingKey(hour: number) {
  if (hour < 12) return "dashboard.greetingMorning";
  if (hour < 18) return "dashboard.greetingAfternoon";
  return "dashboard.greetingEvening";
}

function topCategories(expenses: DashboardExpense[]) {
  const totals = new Map<string, number>();
  for (const expense of expenses)
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 2).map(([category, total]) => ({ category, total }));
  const rest = sorted.slice(2).reduce((sum, [, total]) => sum + total, 0);
  return rest > 0 ? [...top, { category: null, total: rest }] : top;
}

function BillRow({ bill }: { bill: DashboardBill }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const overdue = dueState(bill.dueDate, bill.status).kind === "overdue";
  return (
    <Link
      to={`/bills/${bill.id}`}
      className={`grid ${billGrid} items-center gap-3 border-t border-line py-3 first:border-t-0 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand sm:gap-4 sm:rounded-control sm:px-2`}
    >
      <span className="sm:hidden">
        <DateChip date={bill.dueDate} tone={overdue ? "danger" : "default"} />
      </span>
      <span
        className={`hidden text-sm font-bold tabular-nums sm:block ${overdue ? "text-danger" : ""}`}
      >
        {shortDate(bill.dueDate, locale)}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className="truncate text-[15px] font-bold sm:text-sm">{bill.description}</span>
        <span className="sm:hidden">
          <DueStatus dueDate={bill.dueDate} status={bill.status} variant="text" />
        </span>
      </span>
      <span className="hidden truncate text-sm text-ink-muted sm:block">
        {t(categoryLabel(bill.category))}
      </span>
      <Amount value={bill.amountDue} className="text-right text-[15px] font-extrabold sm:text-sm" />
      <span className="hidden justify-self-end sm:block">
        <DueStatus dueDate={bill.dueDate} status={bill.status} />
      </span>
    </Link>
  );
}

function ExpenseRow({ expense }: { expense: DashboardExpense }) {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <Link
      to={`/expenses/${expense.id}`}
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-line py-3 first:border-t-0 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand sm:rounded-control sm:px-2"
    >
      <span className="inline-grid size-10 place-items-center rounded-full bg-brand-soft text-brand-ink">
        <CreditCard size={18} aria-hidden="true" />
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className="truncate text-sm font-bold">{expense.description}</span>
        <span className="truncate text-[13px] text-ink-muted">
          {formatDate(expense.date, locale)} · {t(categoryLabel(expense.category))}
        </span>
      </span>
      <Amount value={expense.amount} negative className="text-sm font-bold" />
    </Link>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const organizationId = useSelectedOrganization();
  const period = useCurrentMonth();
  const { user } = useAuth();
  const queries = useDashboardQueries(organizationId, period.from, period.to);

  if (!organizationId)
    return (
      <Page>
        <Card>
          <EmptyState
            icon={Building2}
            title={t("dashboard.createOrganization")}
            description={t("dashboard.needsOrganization")}
            action={
              <Link to="/organizations/new" className={buttonClasses()}>
                {t("dashboard.createWorkspace")}
              </Link>
            }
          />
        </Card>
      </Page>
    );

  const summary = queries.summary.data;
  const bills = [...(queries.upcoming.data ?? [])].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate),
  );
  const expenses = queries.recent.data ?? [];
  const firstName = user?.fullName.split(" ")[0];
  const now = new Date();
  const isCurrentMonth =
    period.from.getMonth() === now.getMonth() &&
    period.from.getFullYear() === now.getFullYear() &&
    period.to.getMonth() === now.getMonth() &&
    period.from.getDate() === 1;
  const daysLeft = isCurrentMonth ? Math.max(daysUntil(period.to, now), 0) : null;
  const periodLabel = isCurrentMonth
    ? new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(period.from)
    : `${formatDate(period.from.toISOString(), locale)} – ${formatDate(period.to.toISOString(), locale)}`;

  const spent = summary?.spentThisMonth ?? 0;
  const budget = summary?.monthlyBudget ?? null;
  const overBudget = budget !== null && spent > budget ? spent - budget : 0;
  const categories = topCategories(expenses);
  const overdueCount = bills.filter(
    (bill) => dueState(bill.dueDate, bill.status).kind === "overdue",
  ).length;
  const nextBill = bills.find((bill) => dueState(bill.dueDate, bill.status).kind !== "overdue");

  return (
    <Page>
      <PageHeader
        title={
          firstName
            ? t(greetingKey(now.getHours()), { name: firstName })
            : t("dashboard.greetingFallback")
        }
        description={
          daysLeft !== null
            ? t("dashboard.periodLeft", { period: capitalize(periodLabel), count: daysLeft })
            : capitalize(periodLabel)
        }
        actions={
          <>
            <PeriodFilter />
            <Link
              to="/bills?new=1"
              className={buttonClasses({ variant: "secondary", className: "max-sm:hidden" })}
            >
              {t("bills.add")}
            </Link>
            <Link to="/expenses?new=1" className={buttonClasses({ className: "max-sm:hidden" })}>
              <Plus size={16} aria-hidden="true" /> {t("expenses.add")}
            </Link>
          </>
        }
      />

      {queries.summary.isPending ? (
        <Card>
          <LoadingState />
        </Card>
      ) : queries.summary.error ? (
        <Card>
          <ErrorState
            message={t("dashboard.dataUnavailable")}
            onRetry={() => void queries.summary.refetch()}
          />
        </Card>
      ) : (
        <div className={`grid gap-5 ${summaryGrid}`}>
          <Card tone="brand" className="grid gap-4">
            <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold text-on-brand/85">
              <span>{t("dashboard.spentInPeriod")}</span>
              {budget !== null && (
                <span>
                  {t("dashboard.budgetLabel", { amount: formatCurrency(budget, locale) })}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <Amount
                value={spent}
                className="text-[40px] font-extrabold leading-none tracking-[-0.04em] sm:text-[52px]"
              />
              {summary?.spentPercentage != null && (
                <span className="text-[15px] font-bold text-on-brand/85">
                  {t("dashboard.budgetUsed", { percent: summary.spentPercentage })}
                </span>
              )}
            </div>
            <Meter
              variant="inverse"
              label={
                summary?.spentPercentage != null
                  ? t("dashboard.budgetUsed", { percent: summary.spentPercentage })
                  : t("dashboard.spentInPeriod")
              }
              max={budget !== null && budget > spent ? budget : spent}
              segments={categories.map((item, index) => ({
                value: item.total,
                color: meterColors[index],
              }))}
            />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-on-brand/85">
              {categories.map((item, index) => (
                <span key={item.category ?? "other"} className="inline-flex items-center gap-1.5">
                  <span className={`size-2.5 rounded-[3px] ${legendSwatches[index]}`} />
                  {item.category ? t(categoryLabel(item.category)) : t("dashboard.otherCategories")}
                  <Amount value={item.total} className="font-semibold text-on-brand" />
                </span>
              ))}
              <span className="sm:ml-auto">
                {budget === null ? (
                  <Link
                    to="/settings/organization"
                    className="font-bold text-on-brand underline underline-offset-4"
                  >
                    {t("dashboard.setBudget")}
                  </Link>
                ) : overBudget > 0 ? (
                  <strong className="text-on-brand">
                    {t("dashboard.overBudget", { amount: formatCurrency(overBudget, locale) })}
                  </strong>
                ) : (
                  t("dashboard.remaining", {
                    amount: formatCurrency(summary?.remainingBudget ?? 0, locale),
                  })
                )}
              </span>
            </div>
          </Card>
          <Card className="grid content-start gap-2.5">
            <span className="text-sm font-semibold text-ink-muted">{t("dashboard.toPay")}</span>
            <Amount
              value={summary?.upcomingBillsAmount ?? 0}
              className="text-[34px] font-extrabold tracking-[-0.03em]"
            />
            <div>
              {overdueCount > 0 ? (
                <Badge tone="danger">{t("dashboard.overdueCount", { count: overdueCount })}</Badge>
              ) : (
                <Badge tone="success">{t("dashboard.allClear")}</Badge>
              )}
            </div>
            <span className="text-sm text-ink-muted">
              {t("dashboard.billsCount", { count: summary?.upcomingBillsCount ?? bills.length })}
              {nextBill && (
                <>
                  {" · "}
                  <DueStatus dueDate={nextBill.dueDate} status={nextBill.status} variant="text" />
                </>
              )}
            </span>
          </Card>
        </div>
      )}

      <div className={`grid gap-5 ${summaryGrid}`}>
        <Card aria-labelledby="dashboard-bills" padding="md">
          <CardHeader
            titleId="dashboard-bills"
            title={t("dashboard.billsTitle")}
            action={
              <Link
                to="/bills"
                className="inline-flex items-center gap-1 text-sm font-bold text-brand-ink"
              >
                {t("common.viewAll")} <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            }
          />
          {queries.upcoming.isPending ? (
            <LoadingState />
          ) : queries.upcoming.error ? (
            <ErrorState
              message={t("dashboard.upcomingUnavailable")}
              onRetry={() => void queries.upcoming.refetch()}
            />
          ) : bills.length ? (
            <>
              <div
                className={`hidden ${billGrid} gap-4 px-2 pb-2 text-xs font-semibold text-ink-muted sm:grid`}
              >
                <span>{t("dashboard.dueColumn")}</span>
                <span>{t("dashboard.billColumn")}</span>
                <span>{t("common.category")}</span>
                <span className="text-right">{t("common.amount")}</span>
                <span className="text-right">{t("dashboard.statusColumn")}</span>
              </div>
              <div>
                {bills.slice(0, 6).map((bill) => (
                  <BillRow key={bill.id} bill={bill} />
                ))}
              </div>
              <div className="mt-1 flex justify-between border-t border-line-strong px-0 pt-3 text-sm font-bold sm:px-2">
                <span>{t("dashboard.total")}</span>
                <Amount value={summary?.upcomingBillsAmount ?? 0} className="font-extrabold" />
              </div>
            </>
          ) : (
            <EmptyState
              icon={ReceiptText}
              title={t("dashboard.noBills")}
              description={t("dashboard.noBillsBody")}
            />
          )}
        </Card>
        <Card aria-labelledby="dashboard-expenses" padding="md">
          <CardHeader
            titleId="dashboard-expenses"
            title={t("dashboard.expensesTitle")}
            action={
              <Link
                to="/expenses"
                className="inline-flex items-center gap-1 text-sm font-bold text-brand-ink"
              >
                {t("common.viewAll")} <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            }
          />
          {queries.recent.isPending ? (
            <LoadingState />
          ) : queries.recent.error ? (
            <ErrorState
              message={t("dashboard.recentUnavailable")}
              onRetry={() => void queries.recent.refetch()}
            />
          ) : expenses.length ? (
            <div>
              {expenses.slice(0, 5).map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CreditCard}
              title={t("dashboard.noExpenses")}
              description={t("dashboard.noExpensesBody")}
            />
          )}
        </Card>
      </div>
    </Page>
  );
}
