import type { Currency, OrganizationSummary } from "@/api/auth/auth.types";
import { useAuth } from "@/auth/auth-provider";
import { useOrganizationsQuery } from "@/hooks/queries/use-organization-queries";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";

export function useCurrency(): Currency {
  const { user } = useAuth();
  const organizationId = useSelectedOrganization();
  const organizations = useOrganizationsQuery(Boolean(organizationId));
  const find = (items?: OrganizationSummary[]) =>
    items?.find((organization) => organization.id === organizationId)?.currency;
  return find(organizations.data) ?? find(user?.organizations) ?? "BRL";
}
