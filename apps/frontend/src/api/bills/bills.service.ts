import { privateAPI } from "@/lib/axios";

import { normalizeError } from "@/api/shared/normalize-error";

import type {
  Bill,
  BillSeriesType,
  BillsListQuery,
  BillsListResponse,
  BillDocument,
  CreateBillRequest,
  CreateBillResponse,
  DeleteBillDocumentRequest,
  DownloadBillDocumentRequest,
  StopBillSeriesRequest,
  UpdateBillRequest,
  UpdateBillResponse,
  UploadBillDocumentResponse,
  UploadBillDocumentsRequest,
} from "./bills.types";

const authApi = privateAPI();

interface BillAttachmentApiResponse {
  id: string;
  fileName: string;
  contentType: string;
  fileCategory: UploadBillDocumentResponse["fileCategory"];
  attachmentType: UploadBillDocumentResponse["attachmentType"];
}

interface BillApiResponse extends Omit<Bill, "category" | "status" | "documents" | "billSeriesType"> {
  category: string;
  status: string;
  attachments?: BillAttachmentApiResponse[];
  billSeriesType?: string | null;
}

interface BillsListApiResponse extends Omit<BillsListResponse, "data"> {
  data: BillApiResponse[];
}

interface CreateBillApiResponse {
  id: string;
  description: string;
  category: string;
  status: string;
  amountDue: number;
  amountPaid?: number | null;
  createdDate: string;
  dueDate: string;
  paidDate?: string | null;
  billSeriesId?: string | null;
  occurrenceNumber?: number | null;
  totalOccurrences?: number | null;
  billSeriesType?: string | null;
}

interface UpdateBillApiResponse {
  id: string;
  description: string;
  category: string;
  status: string;
  amountDue: number;
  amountPaid?: number | null;
  dueDate: string;
  paidDate?: string | null;
  billSeriesId?: string | null;
  occurrenceNumber?: number | null;
  totalOccurrences?: number | null;
  billSeriesType?: string | null;
  billSeriesIsActive?: boolean;
}

function mapStatus(status: string): Bill["status"] {
  return status.toLowerCase() as Bill["status"];
}

function mapCategory(category: string): Bill["category"] {
  return category.toLowerCase() as Bill["category"];
}

function mapSeriesType(type?: string | null): BillSeriesType | null | undefined {
  if (type === null) return null;
  if (type === undefined) return undefined;
  return type.toLowerCase() as BillSeriesType;
}

function mapAttachment(attachment: BillAttachmentApiResponse): BillDocument {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    contentType: attachment.contentType,
    fileCategory: attachment.fileCategory,
    attachmentType: attachment.attachmentType,
  };
}

function mapBill(bill: BillApiResponse): Bill {
  return {
    ...bill,
    category: mapCategory(bill.category),
    status: mapStatus(bill.status),
    billSeriesType: mapSeriesType(bill.billSeriesType),
    paymentDate: bill.paymentDate ?? bill.paidDate ?? null,
    documents: bill.attachments?.map(mapAttachment) ?? [],
  };
}

function mapCreateBillResponse(bill: CreateBillApiResponse): CreateBillResponse {
  return {
    id: bill.id,
    description: bill.description,
    category: mapCategory(bill.category),
    status: mapStatus(bill.status),
    amountDue: bill.amountDue,
    amountPaid: bill.amountPaid ?? null,
    createdDate: bill.createdDate,
    dueDate: bill.dueDate,
    paymentDate: bill.paidDate ?? null,
    billSeriesId: bill.billSeriesId ?? null,
    occurrenceNumber: bill.occurrenceNumber ?? null,
    totalOccurrences: bill.totalOccurrences ?? null,
    billSeriesType: mapSeriesType(bill.billSeriesType),
  };
}

function mapUpdateBillResponse(bill: UpdateBillApiResponse): UpdateBillResponse {
  return {
    id: bill.id,
    description: bill.description,
    category: mapCategory(bill.category),
    status: mapStatus(bill.status),
    dueDate: bill.dueDate,
    paymentDate: bill.paidDate ?? null,
    amountDue: bill.amountDue,
    amountPaid: bill.amountPaid ?? null,
    billSeriesId: bill.billSeriesId ?? null,
    occurrenceNumber: bill.occurrenceNumber ?? null,
    totalOccurrences: bill.totalOccurrences ?? null,
    billSeriesType: mapSeriesType(bill.billSeriesType),
    billSeriesIsActive: bill.billSeriesIsActive ?? false,
  };
}

async function uploadDocumentAsync(
  organizationId: string,
  billId: string,
  file: File,
  documentType: UploadBillDocumentsRequest["documentType"]
): Promise<UploadBillDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileCategory", documentType);

  const response = await authApi.post<UploadBillDocumentResponse>(
    `/organizations/${organizationId}/bills/${billId}/documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

export const billsService = {
  async getAsync(organizationId: string, billId: string): Promise<Bill> {
    try {
      const response = await authApi.get<BillApiResponse>(
        `/organizations/${organizationId}/bills/${billId}`
      );

      return mapBill(response.data);
    } catch (error) {
      throw normalizeError(error, "Failed to fetch bill.");
    }
  },

  async listAsync(query: BillsListQuery): Promise<BillsListResponse> {
    try {
      const response = await authApi.get<BillsListApiResponse>(
        `/organizations/${query.organizationId}/bills`,
        {
          params: {
            from: query.from,
            to: query.to,
            status: query.status?.join(",") || undefined,
            description: query.description || undefined,
          },
        }
      );

      return {
        ...response.data,
        data: response.data.data.map(mapBill),
      };
    } catch (error) {
      throw normalizeError(error, "Failed to fetch bills.");
    }
  },

  async createAsync(request: CreateBillRequest): Promise<CreateBillResponse> {
    try {
      const response = await authApi.post<CreateBillApiResponse>(
        `/organizations/${request.organizationId}/bills`,
        {
          description: request.description,
          category: request.category,
          status: request.status,
          dueDate: request.dueDate,
          amountDue: request.amountDue,
          paymentDate: request.paymentDate,
          amountPaid: request.amountPaid,
          frequency: request.frequency ?? undefined,
          installments: request.installments ?? undefined,
        }
      );

      return mapCreateBillResponse(response.data);
    } catch (error) {
      throw normalizeError(error, "Failed to create bill.");
    }
  },

  async updateAsync(request: UpdateBillRequest): Promise<UpdateBillResponse> {
    try {
      const response = await authApi.patch<UpdateBillApiResponse>(
        `/organizations/${request.organizationId}/bills/${request.id}`,
        {
          description: request.description,
          category: request.category,
          status: request.status,
          dueDate: request.dueDate,
          amountDue: request.amountDue,
          paymentDate: request.paymentDate,
          amountPaid: request.amountPaid,
        }
      );

      return mapUpdateBillResponse(response.data);
    } catch (error) {
      throw normalizeError(error, "Failed to update bill.");
    }
  },

  async deleteAsync(id: string, organizationId: string): Promise<void> {
    try {
      await authApi.delete(`/organizations/${organizationId}/bills/${id}`);
    } catch (error) {
      throw normalizeError(error, "Failed to delete bill.");
    }
  },

  async stopSeriesAsync(request: StopBillSeriesRequest): Promise<void> {
    try {
      await authApi.post(
        `/organizations/${request.organizationId}/bills/series/${request.seriesId}/stop`
      );
    } catch (error) {
      throw normalizeError(error, "Failed to stop future bills.");
    }
  },

  async uploadDocumentsAsync(
    payload: UploadBillDocumentsRequest
  ): Promise<UploadBillDocumentResponse[]> {
    try {
      const uploadResults = await Promise.all(
        payload.files.map((file) =>
          uploadDocumentAsync(
            payload.organizationId,
            payload.billId,
            file,
            payload.documentType
          )
        )
      );
      return uploadResults;
    } catch (error) {
      throw normalizeError(error, "Failed to upload bill documents.");
    }
  },

  async downloadDocumentAsync(
    payload: DownloadBillDocumentRequest
  ): Promise<void> {
    try {
      const response = await authApi.get(
        `/organizations/${payload.organizationId}/bills/${payload.billId}/documents/${payload.documentId}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = payload.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw normalizeError(error, "Failed to download bill document.");
    }
  },

  async deleteDocumentAsync(payload: DeleteBillDocumentRequest): Promise<void> {
    try {
      await authApi.delete(
        `/organizations/${payload.organizationId}/bills/${payload.billId}/documents/${payload.documentId}`
      );
    } catch (error) {
      throw normalizeError(error, "Failed to delete bill document.");
    }
  },
};
