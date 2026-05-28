export type ExpenseCategory =
  | "housing"
  | "transportation"
  | "food"
  | "utilities"
  | "clothing"
  | "healthcare"
  | "insurance"
  | "personal"
  | "debt"
  | "savings"
  | "education"
  | "entertainment"
  | "miscellaneous"
  | "travel"
  | "pets"
  | "gifts"
  | "subscriptions"
  | "taxes";

export type ExpenseStatus = "pending" | "paid" | "cancelled";

export type ExpenseFileCategory = "Boleto" | "Receipt" | "Other";

export type ExpenseAttachmentType =
  | "BillDocument"
  | "ExpenseDocument"
  | "UserAvatar";

export interface ExpenseDocument {
  id: string;
  fileName: string;
  contentType: string;
  fileCategory: ExpenseFileCategory;
  attachmentType: ExpenseAttachmentType;
}

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  status: ExpenseStatus;
  occurredAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  documents?: ExpenseDocument[];
}

export interface ExpensesListQuery {
  organizationId: string;
  from?: Date;
  to?: Date;
}

export interface ExpensesListResponse {
  data: Expense[];
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface CreateExpenseRequest {
  description: string;
  category: ExpenseCategory;
  amount: number;
  status: ExpenseStatus;
  occurredAt: string;
  createdBy: string;
  organizationId: string;
}

export interface CreateExpenseResponse {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  status: ExpenseStatus;
  occurredAt: string;
  createdBy: string;
}

export interface UpdateExpenseRequest {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  status: ExpenseStatus;
  occurredAt: string;
  createdBy: string;
  organizationId: string;
}

export interface UpdateExpenseResponse {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  status: ExpenseStatus;
  occurredAt: string;
  createdBy: string;
}

export interface UploadExpenseDocumentsRequest {
  organizationId: string;
  expenseId: string;
  files: File[];
  fileCategory: ExpenseFileCategory;
}

export interface UploadExpenseDocumentResponse {
  id: string;
  fileName: string;
  contentType: string;
  fileCategory: ExpenseFileCategory;
  attachmentType: ExpenseAttachmentType;
}

export interface DownloadExpenseDocumentRequest {
  organizationId: string;
  expenseId: string;
  documentId: string;
  fileName: string;
}

export interface DeleteExpenseDocumentRequest {
  organizationId: string;
  expenseId: string;
  documentId: string;
}
