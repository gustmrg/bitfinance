import type { BillCategory, BillDocument, Paged } from "../bills/bills.types";
export type ExpenseCategory = BillCategory;
export type ExpenseStatus = "pending" | "paid" | "cancelled";
export interface Expense { id: string; description: string; category: ExpenseCategory; status: ExpenseStatus; amount: number; occurredAt: string; createdBy: string; documents: BillDocument[] }
export interface ExpenseListFilters { organizationId: string; page: number; pageSize: number; from?: Date; to?: Date }
export type ExpensePage = Paged<Expense>;
export interface ExpenseInput { description: string; category: ExpenseCategory; amount: number; status: ExpenseStatus; occurredAt: string; createdBy?: string }
