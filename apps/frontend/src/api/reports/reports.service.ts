import { authApi } from "../shared/client";
import { normalizeApiError } from "../shared/errors";
import type { CategoryReportItem, SpendingReport } from "./reports.types";

const lowerCategories = (items: CategoryReportItem[]) =>
  items.map((item) => ({ ...item, category: item.category.toLowerCase() }));

export const reportsService = {
  async getAsync(organizationId: string, months: number): Promise<SpendingReport> {
    try {
      const report = (
        await authApi.get<SpendingReport>(`/organizations/${organizationId}/reports`, {
          params: { months },
        })
      ).data;
      return {
        ...report,
        expenseCategories: lowerCategories(report.expenseCategories),
        billCategories: lowerCategories(report.billCategories),
      };
    } catch (error) {
      throw normalizeApiError(error, "api.reports.load");
    }
  },
};
