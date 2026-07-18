export type BillCategory = "housing" | "utilities" | "food" | "transportation" | "healthcare" | "subscriptions" | "education" | "insurance" | "personal" | "taxes" | "miscellaneous" | "travel" | "gifts" | "pets";
export type BillStatus = "created" | "upcoming" | "due" | "overdue" | "paid" | "cancelled";
export type BillSeriesType = "recurring" | "installment";
export type BillFrequency = "daily" | "weekly" | "monthly" | "annually";
export type FileCategory = "Receipt" | "Boleto" | "Other";
export interface BillDocument { id: string; fileName: string; contentType: string; fileCategory: string; attachmentType: string }
export interface Bill { id: string; description: string; category: BillCategory; status: BillStatus; amountDue: number; amountPaid: number | null; dueDate: string; paymentDate: string | null; billSeriesId: string | null; occurrenceNumber: number | null; totalOccurrences: number | null; billSeriesType: BillSeriesType | null; billSeriesFrequency: BillFrequency | null; billSeriesIsActive: boolean; documents: BillDocument[] }
export interface Paged<T> { data: T[]; page: number; pageSize: number; totalRecords: number; totalPages: number }
export interface BillListFilters { organizationId: string; page: number; pageSize: number; from?: Date; to?: Date; status?: BillStatus; description?: string }
export interface BillInput { description: string; category: BillCategory; status: BillStatus; dueDate: string; paymentDate: string | null; amountDue: number; amountPaid: number | null; frequency?: BillFrequency | null; installments?: number | null }
