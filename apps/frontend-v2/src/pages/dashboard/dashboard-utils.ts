import type { DashboardExpense } from "@/api/dashboard/dashboard.types";

export function categoryPercentage(items: DashboardExpense[], categoriesToCount: string[]) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  if (!total) return 0;

  const categoryTotal = items
    .filter((item) => categoriesToCount.includes(item.category))
    .reduce((sum, item) => sum + item.amount, 0);

  return Math.round((categoryTotal / total) * 100);
}
