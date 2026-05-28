import { privateAPI } from "@/lib/axios";

const api = privateAPI();

export interface GetUpcomingBillsResponse {
  data: UpcomingBillResponseModel[];
}

export type UpcomingBillResponseModel = {
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
    | "subscriptions"
    | "taxes"
    | "pets";
  status: "created" | "due" | "paid" | "overdue" | "cancelled" | "upcoming";
  amountDue: number;
  createdDate?: string;
  createdAt?: string;
  dueDate: string;
};

export async function getUpcomingBills(
  organizationId: string,
  filters?: { from?: Date; to?: Date },
): Promise<GetUpcomingBillsResponse> {
  const params: Record<string, string> = {};
  if (filters?.from) params.from = filters.from.toISOString();
  if (filters?.to) params.to = filters.to.toISOString();

  const response = await api.get<GetUpcomingBillsResponse>(
    `/organizations/${organizationId}/dashboard/upcoming-bills`,
    { params },
  );

  return response.data;
}
