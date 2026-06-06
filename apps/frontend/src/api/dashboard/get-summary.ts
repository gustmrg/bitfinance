import { privateAPI } from "@/lib/axios";

const api = privateAPI();

export interface DashboardSummaryResponse {
  monthlyBudget: number | null;
  spentThisMonth: number;
  remainingBudget: number | null;
  spentPercentage: number | null;
  upcomingBillsAmount: number;
  upcomingBillsCount: number;
}

export async function getDashboardSummary(
  organizationId: string,
  filters?: { from?: Date; to?: Date },
): Promise<DashboardSummaryResponse> {
  const params: Record<string, string> = {};
  if (filters?.from) params.from = filters.from.toISOString();
  if (filters?.to) params.to = filters.to.toISOString();

  const response = await api.get<DashboardSummaryResponse>(
    `/organizations/${organizationId}/dashboard/summary`,
    { params },
  );

  return response.data;
}
