import { authApi } from "../shared/client";
import { normalizeApiError } from "../shared/errors";
import type { Bill, BillDocument, BillInput, BillListFilters, Paged } from "./bills.types";

type BillWire = Omit<
  Bill,
  "category" | "status" | "billSeriesType" | "billSeriesFrequency" | "documents" | "paymentDate"
> & {
  category: string;
  status: string;
  billSeriesType?: string | null;
  billSeriesFrequency?: string | null;
  paymentDate?: string | null;
  paidDate?: string | null;
  attachments?: BillDocument[];
};
const normalize = (value: string) => value.toLowerCase();
const map = (wire: BillWire): Bill => ({
  ...wire,
  category: normalize(wire.category) as Bill["category"],
  status: normalize(wire.status) as Bill["status"],
  billSeriesType: wire.billSeriesType
    ? (normalize(wire.billSeriesType) as Bill["billSeriesType"])
    : null,
  billSeriesFrequency: wire.billSeriesFrequency
    ? (normalize(wire.billSeriesFrequency) as Bill["billSeriesFrequency"])
    : null,
  paymentDate: wire.paymentDate ?? wire.paidDate ?? null,
  documents: wire.attachments ?? [],
  billSeriesId: wire.billSeriesId ?? null,
  occurrenceNumber: wire.occurrenceNumber ?? null,
  totalOccurrences: wire.totalOccurrences ?? null,
  billSeriesIsActive: wire.billSeriesIsActive ?? false,
  amountPaid: wire.amountPaid ?? null,
  notes: wire.notes ?? null,
});

export const billsService = {
  async listAsync(filters: BillListFilters): Promise<Paged<Bill>> {
    try {
      const response = await authApi.get<Paged<BillWire>>(
        `/organizations/${filters.organizationId}/bills`,
        {
          params: {
            page: filters.page,
            pageSize: filters.pageSize,
            from: filters.from?.toISOString(),
            to: filters.to?.toISOString(),
            status: filters.status,
            description: filters.description || undefined,
          },
        },
      );
      return { ...response.data, data: response.data.data.map(map) };
    } catch (error) {
      throw normalizeApiError(error, "api.bills.load");
    }
  },
  async getAsync(organizationId: string, billId: string) {
    try {
      return map(
        (await authApi.get<BillWire>(`/organizations/${organizationId}/bills/${billId}`)).data,
      );
    } catch (error) {
      throw normalizeApiError(error, "api.bills.loadOne");
    }
  },
  async createAsync(organizationId: string, input: BillInput) {
    try {
      return map(
        (await authApi.post<BillWire>(`/organizations/${organizationId}/bills`, input)).data,
      );
    } catch (error) {
      throw normalizeApiError(error, "api.bills.create");
    }
  },
  async updateAsync(
    organizationId: string,
    billId: string,
    input: Omit<BillInput, "frequency" | "installments">,
  ) {
    try {
      return map(
        (await authApi.patch<BillWire>(`/organizations/${organizationId}/bills/${billId}`, input))
          .data,
      );
    } catch (error) {
      throw normalizeApiError(error, "api.bills.update");
    }
  },
  async deleteAsync(organizationId: string, billId: string) {
    try {
      await authApi.delete(`/organizations/${organizationId}/bills/${billId}`);
    } catch (error) {
      throw normalizeApiError(error, "api.bills.delete");
    }
  },
  async uploadDocumentAsync(
    organizationId: string,
    billId: string,
    file: File,
    fileCategory: string,
  ) {
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("fileCategory", fileCategory);
      return (
        await authApi.post<BillDocument>(
          `/organizations/${organizationId}/bills/${billId}/documents`,
          form,
        )
      ).data;
    } catch (error) {
      throw normalizeApiError(error, "api.bills.uploadDocument");
    }
  },
  async getDocumentAsync(organizationId: string, billId: string, documentId: string) {
    try {
      return (
        await authApi.get<Blob>(
          `/organizations/${organizationId}/bills/${billId}/documents/${documentId}`,
          { responseType: "blob" },
        )
      ).data;
    } catch (error) {
      throw normalizeApiError(error, "api.bills.openDocument");
    }
  },
  async getDocumentDownloadUrlAsync(organizationId: string, billId: string, documentId: string) {
    try {
      return (
        await authApi.get<{
          url: string;
          fileName: string;
          contentType: string;
          expiresAt: string;
        }>(`/organizations/${organizationId}/bills/${billId}/documents/${documentId}/download-url`)
      ).data;
    } catch (error) {
      throw normalizeApiError(error, "api.bills.prepareDownload");
    }
  },
  async deleteDocumentAsync(organizationId: string, billId: string, documentId: string) {
    try {
      await authApi.delete(
        `/organizations/${organizationId}/bills/${billId}/documents/${documentId}`,
      );
    } catch (error) {
      throw normalizeApiError(error, "api.bills.removeDocument");
    }
  },
  async stopSeriesAsync(organizationId: string, seriesId: string) {
    try {
      await authApi.post(`/organizations/${organizationId}/bills/series/${seriesId}/stop`);
    } catch (error) {
      throw normalizeApiError(error, "api.bills.stopFuture");
    }
  },
};
