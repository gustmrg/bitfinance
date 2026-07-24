import { useQuery } from "@tanstack/react-query";
import { organizationsService } from "@/api/organizations/organizations.service";
import { queryKeys } from "@/lib/query-keys";

export function useOrganizationsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.organizations.list(),
    queryFn: organizationsService.listAsync,
    enabled,
  });
}

export function useOrganizationQuery(organizationId: string | null) {
  return useQuery({
    queryKey: queryKeys.organizations.detail(organizationId ?? ""),
    queryFn: () => organizationsService.getAsync(organizationId!),
    enabled: Boolean(organizationId),
  });
}

export function useBudgetQuery(organizationId: string | null) {
  return useQuery({
    queryKey: queryKeys.organizations.budget(organizationId ?? ""),
    queryFn: () => organizationsService.getBudgetAsync(organizationId!),
    enabled: Boolean(organizationId),
  });
}
