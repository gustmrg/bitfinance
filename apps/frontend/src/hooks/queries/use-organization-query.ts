import { useQuery } from "@tanstack/react-query";

import { organizationsService, type OrganizationDetails } from "@/api/organizations";
import { queryKeys } from "@/lib/query-keys";

export function useOrganizationQuery(organizationId: string | null) {
  return useQuery({
    queryKey: queryKeys.organizations.detail(organizationId ?? ""),
    enabled: Boolean(organizationId),
    queryFn: async (): Promise<OrganizationDetails> => {
      if (!organizationId) {
        throw new Error("Missing organizationId.");
      }

      return organizationsService.getAsync(organizationId);
    },
  });
}
