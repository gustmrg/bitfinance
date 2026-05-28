import { useQuery } from "@tanstack/react-query";

import { organizationsService, type OrganizationSummary } from "@/api/organizations";
import { queryKeys } from "@/lib/query-keys";

export function useOrganizationsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.organizations.list(),
    queryFn: async (): Promise<OrganizationSummary[]> =>
      organizationsService.listAsync(),
    enabled,
  });
}
