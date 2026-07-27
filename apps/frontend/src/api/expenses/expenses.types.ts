import type { BillCategory, BillDocument, Paged } from "../bills/bills.types";
export type ExpenseCategory = BillCategory;
export type ExpenseStatus = "pending" | "paid" | "cancelled";
export type PaymentMethod =
  "cash" | "creditCard" | "debitCard" | "pix" | "bankTransfer" | "boleto" | "other";
export interface Expense {
  id: string;
  description: string;
  notes: string | null;
  category: ExpenseCategory;
  status: ExpenseStatus;
  paymentMethod: PaymentMethod | null;
  amount: number;
  occurredAt: string;
  createdBy: string;
  documents: BillDocument[];
}
export interface ExpenseListFilters {
  organizationId: string;
  page: number;
  pageSize: number;
  from?: Date;
  to?: Date;
  description?: string;
  status?: ExpenseStatus;
  paymentMethod?: PaymentMethod;
}
export type ExpensePage = Paged<Expense> & {
  summary: {
    totalAmount: number;
    averageAmount: number;
  };
};
export interface ExpenseInput {
  description: string;
  notes: string;
  category: ExpenseCategory;
  amount: number;
  status: ExpenseStatus;
  paymentMethod: PaymentMethod | "";
  occurredAt: string;
  createdBy?: string;
}
