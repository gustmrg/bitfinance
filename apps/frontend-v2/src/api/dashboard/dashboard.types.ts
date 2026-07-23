export interface DashboardSummary {
  monthlyBudget: number | null;
  spentThisMonth: number;
  remainingBudget: number | null;
  spentPercentage: number | null;
  upcomingBillsAmount: number;
  upcomingBillsCount: number;
}
export interface DashboardBill {
  id: string;
  description: string;
  category: string;
  status: string;
  amountDue: number;
  createdAt: string;
  dueDate: string;
}
export interface DashboardExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}
