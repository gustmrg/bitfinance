export type BillCategory =
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
  | "subscriptions"
  | "taxes"
  | "pets";

export type BillStatus =
  | "created"
  | "due"
  | "paid"
  | "overdue"
  | "cancelled"
  | "upcoming";

export type Frequency = "daily" | "weekly" | "monthly" | "annually";

export type BillSeriesType = "recurring" | "installment";

export type BillType = "one-time" | "recurring" | "installment";

export type BillDocumentType = "Invoice" | "Receipt" | "Contract" | "Other";

export type BillFileCategory = "Boleto" | "Receipt" | "Other";

export type BillAttachmentType = "BillDocument" | "ExpenseDocument" | "UserAvatar";

export interface BillDocument {
  id: string;
  fileName: string;
  contentType: string;
  fileCategory: BillFileCategory;
  attachmentType: BillAttachmentType;
}

export interface Bill {
  id: string;
  description: string;
  category: BillCategory;
  status: BillStatus;
  amountDue: number;
  amountPaid?: number | null;
  createdDate?: string;
  createdAt?: string;
  dueDate: string;
  paymentDate?: string | null;
  paidDate?: string | null;
  deletedDate?: string | null;
  notes?: string;
  documents?: BillDocument[];
  billSeriesId?: string | null;
  occurrenceNumber?: number | null;
  totalOccurrences?: number | null;
  billSeriesType?: BillSeriesType | null;
  billSeriesIsActive?: boolean;
}

export interface BillsListQuery {
  organizationId: string;
  from?: Date;
  to?: Date;
  status?: BillStatus[];
  description?: string;
}

export interface BillsListResponse {
  data: Bill[];
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface CreateBillRequest {
  description: string;
  category: BillCategory;
  status: BillStatus;
  dueDate: string;
  paymentDate?: string | null;
  amountDue: number;
  amountPaid?: number | null;
  organizationId: string;
  frequency?: Frequency | null;
  installments?: number | null;
}

export interface CreateBillResponse {
  id: string;
  description: string;
  category: BillCategory;
  status: BillStatus;
  amountDue: number;
  amountPaid?: number | null;
  createdDate: string;
  dueDate: string;
  paymentDate?: string | null;
  billSeriesId?: string | null;
  occurrenceNumber?: number | null;
  totalOccurrences?: number | null;
  billSeriesType?: BillSeriesType | null;
}

export interface UpdateBillRequest {
  id: string;
  description: string;
  category: BillCategory;
  status: BillStatus;
  dueDate: string;
  paymentDate?: string | null;
  amountDue: number;
  amountPaid?: number | null;
  organizationId: string;
}

export interface UpdateBillResponse {
  id: string;
  description: string;
  category: BillCategory;
  status: BillStatus;
  dueDate: string;
  paymentDate?: string | null;
  amountDue: number;
  amountPaid?: number | null;
  billSeriesId?: string | null;
  occurrenceNumber?: number | null;
  totalOccurrences?: number | null;
  billSeriesType?: BillSeriesType | null;
  billSeriesIsActive?: boolean;
}

export interface StopBillSeriesRequest {
  organizationId: string;
  seriesId: string;
}

export interface UploadBillDocumentsRequest {
  organizationId: string;
  billId: string;
  files: File[];
  documentType: BillFileCategory;
}

export interface UploadBillDocumentResponse {
  id: string;
  fileName: string;
  contentType: string;
  fileCategory: BillFileCategory;
  attachmentType: BillAttachmentType;
}

export interface DownloadBillDocumentRequest {
  organizationId: string;
  billId: string;
  documentId: string;
  fileName: string;
}

export interface DeleteBillDocumentRequest {
  organizationId: string;
  billId: string;
  documentId: string;
}
