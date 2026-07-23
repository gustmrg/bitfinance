import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type EditableOrganizationMemberRole,
  organizationsService,
} from "@/api/organizations/organizations.service";
import { queryKeys } from "@/lib/query-keys";

export function useOrganizationMutations(organizationId: string | null) {
  const client = useQueryClient();
  const invalidate = () => {
    void client.invalidateQueries({ queryKey: queryKeys.organizations.all });
    void client.invalidateQueries({ queryKey: queryKeys.auth.me() });
    void client.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };
  const update = useMutation({
    mutationFn: (name: string) => organizationsService.updateAsync(organizationId!, name),
    onSuccess: invalidate,
  });
  const budget = useMutation({
    mutationFn: (amount: number) => organizationsService.upsertBudgetAsync(organizationId!, amount),
    onSuccess: () => {
      invalidate();
      void client.invalidateQueries({ queryKey: queryKeys.organizations.budget(organizationId!) });
    },
  });
  return { update, budget };
}

export function useOrganizationMemberMutations(organizationId: string | null) {
  const client = useQueryClient();
  const invalidate = () => {
    void client.invalidateQueries({ queryKey: queryKeys.organizations.all });
    void client.invalidateQueries({ queryKey: queryKeys.auth.me() });
  };
  return {
    updateRole: useMutation({
      mutationFn: ({ userId, role }: { userId: string; role: EditableOrganizationMemberRole }) =>
        organizationsService.updateMemberRoleAsync(organizationId!, userId, role),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (userId: string) =>
        organizationsService.removeMemberAsync(organizationId!, userId),
      onSuccess: invalidate,
    }),
  };
}
