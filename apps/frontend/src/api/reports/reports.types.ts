export interface MonthlyReportItem {
  year: number;
  month: number;
  expensesTotal: number;
  billsTotal: number;
  billsPaidTotal: number;
}
export interface CategoryReportItem {
  category: string;
  total: number;
  count: number;
}
export interface SpendingReport {
  from: string;
  to: string;
  monthlyBudget: number | null;
  months: MonthlyReportItem[];
  expenseCategories: CategoryReportItem[];
  billCategories: CategoryReportItem[];
}
