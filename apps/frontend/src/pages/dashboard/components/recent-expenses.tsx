import type React from "react";

import {
  Briefcase,
  Car,
  CreditCard,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Home,
  PieChart,
  PiggyBank,
  ShieldPlus,
  ShoppingBag,
  Smartphone,
  Ticket,
  Utensils,
} from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { ExpenseResponseModel } from "@/api/dashboard/get-recent-expenses";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/format";

const categoryIcons: Record<string, React.ReactNode> = {
  food: <Utensils className="h-4 w-4" />,
  clothing: <ShoppingBag className="h-4 w-4" />,
  housing: <Home className="h-4 w-4" />,
  transportation: <Car className="h-4 w-4" />,
  entertainment: <Ticket className="h-4 w-4" />,
  utilities: <Smartphone className="h-4 w-4" />,
  income: <Briefcase className="h-4 w-4" />,
  education: <GraduationCap className="h-4 w-4" />,
  personal: <CreditCard className="h-4 w-4" />,
  insurance: <ShieldPlus className="h-4 w-4" />,
  healthcare: <HeartPulse className="h-4 w-4" />,
  savings: <PiggyBank className="h-4 w-4" />,
  debt: <HandCoins className="h-4 w-4" />,
  miscellaneous: <CreditCard className="h-4 w-4" />,
};

const categoryBgColors: Record<string, string> = {
  food: "bg-orange-100 dark:bg-orange-900/30",
  education: "bg-orange-100 dark:bg-orange-900/30",
  personal: "bg-blue-100 dark:bg-blue-900/30",
  clothing: "bg-blue-100 dark:bg-blue-900/30",
  insurance: "bg-blue-100 dark:bg-blue-900/30",
  housing: "bg-green-100 dark:bg-green-900/30",
  healthcare: "bg-green-100 dark:bg-green-900/30",
  savings: "bg-green-100 dark:bg-green-900/30",
  transportation: "bg-purple-100 dark:bg-purple-900/30",
  entertainment: "bg-pink-100 dark:bg-pink-900/30",
  debt: "bg-pink-100 dark:bg-pink-900/30",
  utilities: "bg-yellow-100 dark:bg-yellow-900/30",
  income: "bg-emerald-100 dark:bg-emerald-900/30",
  miscellaneous: "bg-gray-100 dark:bg-gray-800",
};

const categoryTextColors: Record<string, string> = {
  food: "text-orange-600 dark:text-orange-400",
  education: "text-orange-600 dark:text-orange-400",
  personal: "text-blue-600 dark:text-blue-400",
  clothing: "text-blue-600 dark:text-blue-400",
  insurance: "text-blue-600 dark:text-blue-400",
  housing: "text-green-600 dark:text-green-400",
  healthcare: "text-green-600 dark:text-green-400",
  savings: "text-green-600 dark:text-green-400",
  transportation: "text-purple-600 dark:text-purple-400",
  entertainment: "text-pink-600 dark:text-pink-400",
  debt: "text-pink-600 dark:text-pink-400",
  utilities: "text-yellow-600 dark:text-yellow-400",
  income: "text-emerald-600 dark:text-emerald-400",
  miscellaneous: "text-gray-600 dark:text-gray-400",
};

const categoryBadgeVariant: Record<
  string,
  | "gray"
  | "red"
  | "yellow"
  | "green"
  | "blue"
  | "indigo"
  | "purple"
  | "pink"
  | "orange"
> = {
  food: "orange",
  clothing: "blue",
  housing: "green",
  transportation: "purple",
  entertainment: "pink",
  utilities: "yellow",
  income: "green",
  insurance: "indigo",
  healthcare: "green",
  savings: "green",
  education: "yellow",
};

interface RecentExpensesProps {
  expenses: ExpenseResponseModel[];
  isLoading?: boolean;
}

export function RecentExpenses({ expenses, isLoading }: RecentExpensesProps) {
  const { t } = useTranslation();

  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <Card className="w-full xl:col-span-3">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("dashboard.recentExpenses.title")}</CardTitle>
            <CardDescription>{t("dashboard.recentExpenses.description")}</CardDescription>
          </div>
          <NavLink to="/dashboard/expenses">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              {t("labels.viewAll")}
            </Button>
          </NavLink>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <div className="mb-6">
              <Skeleton className="mb-2 h-4 w-40" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center rounded-lg border p-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="mt-1 h-3 w-12" />
                    <Skeleton className="mt-1 h-4 w-10" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-4 w-14" />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-medium">{t("dashboard.recentExpenses.subtitle")}</h3>
              {topCategories.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {topCategories.map(([category, amount]) => (
                    <div
                      key={category}
                      className="flex flex-col items-center rounded-lg border p-2"
                    >
                      <div
                        className={`rounded-full p-2 ${categoryBgColors[category] || "bg-gray-100 dark:bg-gray-800"}`}
                      >
                        <span className={categoryTextColors[category] || "text-gray-600 dark:text-gray-400"}>
                          {categoryIcons[category] || <CreditCard className="h-4 w-4" />}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium capitalize">{category}</p>
                      <p className="text-sm font-bold">{formatCurrency(amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.recentExpenses.topCategoriesEmpty")}
                </p>
              )}
            </div>

            <div className="max-h-[350px] space-y-3 overflow-auto pr-1 scrollbar-thin">
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <NavLink
                    key={expense.id}
                    to={`/dashboard/expenses/${expense.id}`}
                    className="block"
                  >
                    <div className="flex flex-col gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`rounded-full p-2 ${categoryBgColors[expense.category] || "bg-gray-100 dark:bg-gray-800"}`}
                        >
                          <span className={categoryTextColors[expense.category] || "text-gray-600 dark:text-gray-400"}>
                            {categoryIcons[expense.category] || <CreditCard className="h-4 w-4" />}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{expense.description}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span>{format(new Date(expense.date), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 sm:block sm:text-right">
                        <p className="font-medium">-{formatCurrency(expense.amount)}</p>
                        <StatusBadge variant={categoryBadgeVariant[expense.category] || "gray"}>
                          {expense.category}
                        </StatusBadge>
                      </div>
                    </div>
                  </NavLink>
                ))
              ) : (
                <div className="py-6 text-center">
                  <PieChart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-2 text-lg font-semibold">
                    {t("dashboard.recentExpenses.emptyHeader")}
                  </h3>
                  <p className="text-sm text-muted-foreground">{t("dashboard.recentExpenses.empty")}</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
