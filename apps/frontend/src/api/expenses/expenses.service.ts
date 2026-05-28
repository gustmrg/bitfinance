import { privateAPI } from "@/lib/axios";

import { normalizeError } from "@/api/shared/normalize-error";

import type {
  CreateExpenseRequest,
  CreateExpenseResponse,
  DeleteExpenseDocumentRequest,
  DownloadExpenseDocumentRequest,
  Expense,
  ExpenseDocument,
  ExpensesListQuery,
  ExpensesListResponse,
  UpdateExpenseRequest,
  UpdateExpenseResponse,
  UploadExpenseDocumentResponse,
  UploadExpenseDocumentsRequest,
} from "./expenses.types";

const authApi = privateAPI();

interface ExpenseAttachmentApiResponse {
  id: string;
  fileName: string;
  contentType: string;
  fileCategory: UploadExpenseDocumentResponse["fileCategory"];
  attachmentType: UploadExpenseDocumentResponse["attachmentType"];
}

interface ExpenseApiResponse extends Omit<Expense, "category" | "status" | "documents"> {
  category: string;
  status: string;
  attachments?: ExpenseAttachmentApiResponse[];
}

interface ExpensesListApiResponse extends Omit<ExpensesListResponse, "data"> {
  data: ExpenseApiResponse[];
}

interface CreateExpenseApiResponse {
  id: string;
  description: string;
  category: string;
  amount: number;
  status: string;
  occurredAt: string;
  createdBy: string;
}

interface UpdateExpenseApiResponse {
  id: string;
  description: string;
  category: string;
  amount: number;
  status: string;
  occurredAt: string;
  createdBy: string;
}

function mapStatus(status: string): Expense["status"] {
  return status.toLowerCase() as Expense["status"];
}

function mapCategory(category: string): Expense["category"] {
  return category.toLowerCase() as Expense["category"];
}

function mapAttachment(attachment: ExpenseAttachmentApiResponse): ExpenseDocument {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    contentType: attachment.contentType,
    fileCategory: attachment.fileCategory,
    attachmentType: attachment.attachmentType,
  };
}

function mapExpense(expense: ExpenseApiResponse): Expense {
  return {
    ...expense,
    category: mapCategory(expense.category),
    documents: expense.attachments?.map(mapAttachment) ?? [],
    status: mapStatus(expense.status),
  };
}

function mapCreateExpenseResponse(
  expense: CreateExpenseApiResponse
): CreateExpenseResponse {
  return {
    id: expense.id,
    description: expense.description,
    category: mapCategory(expense.category),
    amount: expense.amount,
    status: mapStatus(expense.status),
    occurredAt: expense.occurredAt,
    createdBy: expense.createdBy,
  };
}

function mapUpdateExpenseResponse(
  expense: UpdateExpenseApiResponse
): UpdateExpenseResponse {
  return {
    id: expense.id,
    description: expense.description,
    category: mapCategory(expense.category),
    amount: expense.amount,
    status: mapStatus(expense.status),
    occurredAt: expense.occurredAt,
    createdBy: expense.createdBy,
  };
}

async function uploadDocumentAsync(
  organizationId: string,
  expenseId: string,
  file: File,
  fileCategory: UploadExpenseDocumentsRequest["fileCategory"]
): Promise<UploadExpenseDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileCategory", fileCategory);

  const response = await authApi.post<UploadExpenseDocumentResponse>(
    `/organizations/${organizationId}/expenses/${expenseId}/documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

export const expensesService = {
  async listAsync(query: ExpensesListQuery): Promise<ExpensesListResponse> {
    try {
      const response = await authApi.get<ExpensesListApiResponse>(
        `/organizations/${query.organizationId}/expenses`,
        {
          params: {
            from: query.from,
            to: query.to,
          },
        }
      );

      return {
        ...response.data,
        data: response.data.data.map(mapExpense),
      };
    } catch (error) {
      throw normalizeError(error, "Failed to fetch expenses.");
    }
  },

  async getAsync(organizationId: string, expenseId: string): Promise<Expense> {
    try {
      const response = await authApi.get<ExpenseApiResponse>(
        `/organizations/${organizationId}/expenses/${expenseId}`
      );

      return mapExpense(response.data);
    } catch (error) {
      throw normalizeError(error, "Failed to fetch expense.");
    }
  },

  async createAsync(
    request: CreateExpenseRequest
  ): Promise<CreateExpenseResponse> {
    try {
      const response = await authApi.post<CreateExpenseApiResponse>(
        `/organizations/${request.organizationId}/expenses`,
        {
          description: request.description,
          category: request.category,
          status: request.status,
          amount: request.amount,
          occurredAt: request.occurredAt,
          createdBy: request.createdBy,
        }
      );

      return mapCreateExpenseResponse(response.data);
    } catch (error) {
      throw normalizeError(error, "Failed to create expense.");
    }
  },

  async updateAsync(
    request: UpdateExpenseRequest
  ): Promise<UpdateExpenseResponse> {
    try {
      const response = await authApi.patch<UpdateExpenseApiResponse>(
        `/organizations/${request.organizationId}/expenses/${request.id}`,
        {
          description: request.description,
          category: request.category,
          status: request.status,
          amount: request.amount,
          occurredAt: request.occurredAt,
          createdBy: request.createdBy,
        }
      );

      return mapUpdateExpenseResponse(response.data);
    } catch (error) {
      throw normalizeError(error, "Failed to update expense.");
    }
  },

  async deleteAsync(id: string, organizationId: string): Promise<void> {
    try {
      await authApi.delete(`/organizations/${organizationId}/expenses/${id}`);
    } catch (error) {
      throw normalizeError(error, "Failed to delete expense.");
    }
  },

  async uploadDocumentsAsync(
    payload: UploadExpenseDocumentsRequest
  ): Promise<UploadExpenseDocumentResponse[]> {
    try {
      return await Promise.all(
        payload.files.map((file) =>
          uploadDocumentAsync(
            payload.organizationId,
            payload.expenseId,
            file,
            payload.fileCategory
          )
        )
      );
    } catch (error) {
      throw normalizeError(error, "Failed to upload expense documents.");
    }
  },

  async downloadDocumentAsync(
    payload: DownloadExpenseDocumentRequest
  ): Promise<void> {
    try {
      const response = await authApi.get(
        `/organizations/${payload.organizationId}/expenses/${payload.expenseId}/documents/${payload.documentId}`,
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
      throw normalizeError(error, "Failed to download expense document.");
    }
  },

  async deleteDocumentAsync(payload: DeleteExpenseDocumentRequest): Promise<void> {
    try {
      await authApi.delete(
        `/organizations/${payload.organizationId}/expenses/${payload.expenseId}/documents/${payload.documentId}`
      );
    } catch (error) {
      throw normalizeError(error, "Failed to delete expense document.");
    }
  },
};
