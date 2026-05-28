import { privateAPI } from "@/lib/axios";

const api = privateAPI();

export interface GetRecentExpensesResponse {
  data: ExpenseResponseModel[];
}

export type ExpenseResponseModel = {
  id: string;
  description: string;
  category:
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
  amount: number;
  date: string;
};

export async function getRecentExpenses(
  organizationId: string,
  filters?: { from?: Date; to?: Date },
): Promise<GetRecentExpensesResponse> {
  const params: Record<string, string> = {};
  if (filters?.from) params.from = filters.from.toISOString();
  if (filters?.to) params.to = filters.to.toISOString();

  const response = await api.get<GetRecentExpensesResponse>(
    `/organizations/${organizationId}/dashboard/recent-expenses`,
    { params },
  );

  return response.data;
}
