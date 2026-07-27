import { authApi } from "../shared/client";
import { normalizeApiError } from "../shared/errors";
import type { Expense, ExpenseInput, ExpenseListFilters, ExpensePage } from "./expenses.types";
import type { BillDocument } from "../bills/bills.types";

type ExpenseWire = Omit<Expense, "category" | "status" | "paymentMethod" | "documents"> & {
  category: string;
  status: string;
  paymentMethod?: string | null;
  attachments?: BillDocument[];
};
const map = (wire: ExpenseWire): Expense => ({
  ...wire,
  category: wire.category.toLowerCase() as Expense["category"],
  status: wire.status.toLowerCase() as Expense["status"],
  paymentMethod: wire.paymentMethod
    ? (`${wire.paymentMethod.charAt(0).toLowerCase()}${wire.paymentMethod.slice(1)}` as Expense["paymentMethod"])
    : null,
  notes: wire.notes ?? null,
  documents: wire.attachments ?? [],
});

export const expensesService = {
  async listAsync(filters: ExpenseListFilters): Promise<ExpensePage> {
    try {
      const response = await authApi.get<{
        data: ExpenseWire[];
        page: number;
        pageSize: number;
        totalRecords: number;
        totalPages: number;
        summary: {
          totalAmount: number;
          averageAmount: number;
        };
      }>(`/organizations/${filters.organizationId}/expenses`, {
        params: {
          page: filters.page,
          pageSize: filters.pageSize,
          from: filters.from?.toISOString(),
          to: filters.to?.toISOString(),
          description: filters.description || undefined,
          status: filters.status,
          paymentMethod: filters.paymentMethod,
        },
      });
      return { ...response.data, data: response.data.data.map(map) };
    } catch (error) {
      throw normalizeApiError(error, "api.expenses.load");
    }
  },
  async getAsync(organizationId: string, expenseId: string) {
    try {
      return map(
        (await authApi.get<ExpenseWire>(`/organizations/${organizationId}/expenses/${expenseId}`))
          .data,
      );
    } catch (error) {
      throw normalizeApiError(error, "api.expenses.loadOne");
    }
  },
  async createAsync(organizationId: string, input: ExpenseInput & { createdBy: string }) {
    try {
      return map(
        (await authApi.post<ExpenseWire>(`/organizations/${organizationId}/expenses`, input)).data,
      );
    } catch (error) {
      throw normalizeApiError(error, "api.expenses.create");
    }
  },
  async updateAsync(organizationId: string, expenseId: string, input: ExpenseInput) {
    try {
      return map(
        (
          await authApi.patch<ExpenseWire>(
            `/organizations/${organizationId}/expenses/${expenseId}`,
            input,
          )
        ).data,
      );
    } catch (error) {
      throw normalizeApiError(error, "api.expenses.update");
    }
  },
  async deleteAsync(organizationId: string, expenseId: string) {
    try {
      await authApi.delete(`/organizations/${organizationId}/expenses/${expenseId}`);
    } catch (error) {
      throw normalizeApiError(error, "api.expenses.delete");
    }
  },
  async uploadDocumentAsync(
    organizationId: string,
    expenseId: string,
    file: File,
    fileCategory: string,
  ) {
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("fileCategory", fileCategory);
      return (
        await authApi.post<BillDocument>(
          `/organizations/${organizationId}/expenses/${expenseId}/documents`,
          form,
        )
      ).data;
    } catch (error) {
      throw normalizeApiError(error, "api.expenses.uploadDocument");
    }
  },
  async getDocumentAsync(organizationId: string, expenseId: string, attachmentId: string) {
    try {
      return (
        await authApi.get<Blob>(
          `/organizations/${organizationId}/expenses/${expenseId}/documents/${attachmentId}`,
          { responseType: "blob" },
        )
      ).data;
    } catch (error) {
      throw normalizeApiError(error, "api.expenses.openDocument");
    }
  },
  async deleteDocumentAsync(organizationId: string, expenseId: string, attachmentId: string) {
    try {
      await authApi.delete(
        `/organizations/${organizationId}/expenses/${expenseId}/documents/${attachmentId}`,
      );
    } catch (error) {
      throw normalizeApiError(error, "api.expenses.removeDocument");
    }
  },
};
