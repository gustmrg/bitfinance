import { useState } from "react";

import {
  CalendarClock,
  PiggyBank,
  TrendingDown,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";

import { useSelectedOrganization } from "@/auth/auth-provider";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { CalendarDateRangePicker } from "@/components/ui/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import {
  useDashboardSummaryQuery,
  useRecentExpensesQuery,
  useUpcomingBillsQuery,
} from "@/hooks/queries/use-dashboard-query";

import { RecentExpenses } from "./components/recent-expenses";
import { UpcomingBills } from "./components/upcoming-bills";

interface DashboardMetric {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  tone: "default" | "success" | "warning";
  progress?: number;
}

export function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  });

  const selectedOrganization = useSelectedOrganization();
  const { t } = useTranslation();
  const dateFilters = { from: dateRange?.from, to: dateRange?.to };
  const upcomingBillsQuery = useUpcomingBillsQuery(
    selectedOrganization?.id ?? null,
    dateFilters,
  );
  const recentExpensesQuery = useRecentExpensesQuery(
    selectedOrganization?.id ?? null,
    dateFilters,
  );
  const dashboardSummaryQuery = useDashboardSummaryQuery(
    selectedOrganization?.id ?? null,
    dateFilters,
  );

  const handleDateFilterChange = (newDate: DateRange) => {
    setDateRange(newDate);
  };

  const summary = dashboardSummaryQuery.data ?? {
    monthlyBudget: null,
    spentThisMonth: 0,
    remainingBudget: null,
    spentPercentage: null,
    upcomingBillsAmount: 0,
    upcomingBillsCount: 0,
  };
  const monthlyBudget = summary.monthlyBudget;
  const hasBudget = monthlyBudget !== null;
  const spentPercentage = summary.spentPercentage ?? 0;
  const remainingBudget = summary.remainingBudget;

  const metrics: DashboardMetric[] = [
    {
      title: t("dashboard.metrics.monthlyBudget.title"),
      value: hasBudget
        ? formatCurrency(monthlyBudget)
        : t("dashboard.metrics.monthlyBudget.unsetValue"),
      subtitle: hasBudget
        ? t("dashboard.metrics.monthlyBudget.subtitle")
        : t("dashboard.metrics.monthlyBudget.unsetSubtitle"),
      icon: Wallet,
      tone: "default",
    },
    {
      title: t("dashboard.metrics.spentThisMonth.title"),
      value: formatCurrency(summary.spentThisMonth),
      subtitle: hasBudget
        ? t("dashboard.metrics.spentThisMonth.subtitle", {
            percentage: spentPercentage,
          })
        : t("dashboard.metrics.spentThisMonth.subtitleNoBudget"),
      icon: TrendingDown,
      tone: hasBudget && spentPercentage >= 85 ? "warning" : "default",
      progress: hasBudget ? Math.min(spentPercentage, 100) : undefined,
    },
    {
      title: t("dashboard.metrics.remainingBudget.title"),
      value:
        remainingBudget !== null
          ? formatCurrency(remainingBudget)
          : t("dashboard.metrics.remainingBudget.unsetValue"),
      subtitle:
        remainingBudget === null
          ? t("dashboard.metrics.remainingBudget.subtitleUnset")
          : remainingBudget > 0
          ? t("dashboard.metrics.remainingBudget.subtitleAvailable")
          : t("dashboard.metrics.remainingBudget.subtitleDepleted"),
      icon: PiggyBank,
      tone:
        remainingBudget === null
          ? "default"
          : remainingBudget > 0
          ? "success"
          : "warning",
    },
    {
      title: t("dashboard.metrics.upcomingBills.title"),
      value: formatCurrency(summary.upcomingBillsAmount),
      subtitle: t("dashboard.metrics.upcomingBills.subtitle", {
        count: summary.upcomingBillsCount,
      }),
      icon: CalendarClock,
      tone: summary.upcomingBillsCount > 0 ? "warning" : "default",
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={t("sidebar.dashboard")}
        actions={
          <CalendarDateRangePicker
            startDate={dateRange?.from}
            endDate={dateRange?.to}
            onDateChange={handleDateFilterChange}
          />
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const iconToneClass =
            metric.tone === "success"
              ? "text-emerald-600"
              : metric.tone === "warning"
                ? "text-amber-600"
                : "text-muted-foreground";
          const cardToneClass =
            metric.tone === "success"
              ? "bg-emerald-50/50 dark:bg-emerald-950/20"
              : metric.tone === "warning"
                ? "bg-amber-50/50 dark:bg-amber-950/20"
                : "";

          return (
            <Card key={metric.title} className={cardToneClass}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className={`h-4 w-4 ${iconToneClass}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
                {metric.progress !== undefined && (
                  <Progress value={metric.progress} className="mt-2 h-1.5" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-7">
        <UpcomingBills
          bills={upcomingBillsQuery.data ?? []}
          isLoading={upcomingBillsQuery.isPending}
        />
        <RecentExpenses
          expenses={recentExpensesQuery.data ?? []}
          isLoading={recentExpensesQuery.isPending}
        />
      </div>
    </PageContainer>
  );
}
