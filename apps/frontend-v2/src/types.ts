export type BillCategory =
  | "housing"
  | "utilities"
  | "food"
  | "transportation"
  | "healthcare"
  | "subscriptions"
  | "education"
  | "insurance"
  | "personal"
  | "taxes"
  | "miscellaneous";

export type BillStatus = "upcoming" | "due" | "overdue" | "paid" | "cancelled";
export type BillSeriesType = "recurring" | "installment";
export type BillFrequency = "weekly" | "monthly" | "annually";
export type ExpenseCategory = BillCategory | "travel" | "gifts" | "pets";
export type ExpenseStatus = "pending" | "paid" | "cancelled";
export type OrganizationRole = "Owner" | "Admin" | "Member";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  timezone: string;
  budget: number | null;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: OrganizationRole;
  joinedAt: string;
  initials: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileCategory: "Boleto" | "Receipt" | "Contract" | "Other";
}

export interface Bill {
  id: string;
  description: string;
  category: BillCategory;
  status: BillStatus;
  amountDue: number;
  amountPaid: number | null;
  dueDate: string;
  paymentDate: string | null;
  seriesType: BillSeriesType | null;
  frequency: BillFrequency | null;
  occurrence: number | null;
  totalOccurrences: number | null;
  seriesActive: boolean;
  documents: Attachment[];
}

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  status: ExpenseStatus;
  occurredAt: string;
  createdBy: string;
  documents: Attachment[];
}

export interface DemoState {
  user: User | null;
  isAuthenticated: boolean;
  organizations: Organization[];
  activeOrganizationId: string;
  members: Member[];
  bills: Bill[];
  expenses: Expense[];
}

export interface NewBillInput {
  description: string;
  category: BillCategory;
  amountDue: number;
  dueDate: string;
  seriesType: BillSeriesType | null;
  frequency: BillFrequency | null;
  totalOccurrences: number | null;
}

export interface NewExpenseInput {
  description: string;
  category: ExpenseCategory;
  amount: number;
  occurredAt: string;
}
