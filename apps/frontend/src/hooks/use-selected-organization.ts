import { useAuth } from "@/auth/auth-provider";
import { useOrganizationStore } from "@/auth/auth-store";

export function useSelectedOrganization() {
  const { user } = useAuth();
  const selectedId = useOrganizationStore((state) => state.selectedOrganizationId);
  return user?.organizations.some((organization) => organization.id === selectedId)
    ? selectedId
    : (user?.organizations[0]?.id ?? null);
}
