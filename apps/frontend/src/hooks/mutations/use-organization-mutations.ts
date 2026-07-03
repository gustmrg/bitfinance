import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  organizationsService,
  type CreateInvitationRequest,
  type CreateOrganizationRequest,
  type OrganizationSummary,
  type RemoveOrganizationMemberRequest,
  type UpdateMemberRoleRequest,
  type UpdateOrganizationRequest,
  type UpsertOrganizationBudgetRequest,
} from "@/api/organizations";
import { useSetSelectedOrganizationId } from "@/auth/auth-provider";
import type { User } from "@/auth/types";
import { fetchMeAsync } from "@/hooks/queries/use-me-query";
import { queryKeys } from "@/lib/query-keys";

async function refetchCurrentUser(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.fetchQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: fetchMeAsync,
  });
}

export function useOrganizationMutations() {
  const queryClient = useQueryClient();
  const setSelectedOrganizationId = useSetSelectedOrganizationId();

  const invalidateOrganizationQueries = async (
    organizationId?: string,
    options: { includeDetail?: boolean } = {}
  ) => {
    const includeDetail = options.includeDetail ?? true;
    const promises: Promise<void>[] = [
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.me(),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.all,
      }),
    ];

    if (organizationId && includeDetail) {
      promises.push(
        queryClient.invalidateQueries({
          queryKey: queryKeys.organizations.detail(organizationId),
        })
      );
    }

    await Promise.all(promises);
  };

  const createOrganizationMutation = useMutation({
    mutationFn: async (request: CreateOrganizationRequest) =>
      organizationsService.createAsync(request),
    onSuccess: async (organization) => {
      await invalidateOrganizationQueries(organization.id);
    },
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: async (request: UpdateOrganizationRequest) =>
      organizationsService.updateAsync(request),
    onSuccess: async (organization) => {
      await invalidateOrganizationQueries(organization.id);
    },
  });

  const upsertBudgetMutation = useMutation({
    mutationFn: async (request: UpsertOrganizationBudgetRequest) =>
      organizationsService.upsertBudgetAsync(request),
    onSuccess: async (_budget, request) => {
      await Promise.all([
        invalidateOrganizationQueries(request.organizationId),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.summary(request.organizationId),
        }),
      ]);
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: async (request: CreateInvitationRequest) =>
      organizationsService.createInviteAsync(request),
    onSuccess: async (_response, request) => {
      await invalidateOrganizationQueries(request.organizationId);
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async (request: UpdateMemberRoleRequest) =>
      organizationsService.updateMemberRoleAsync(request),
    onSuccess: async (_member, request) => {
      await invalidateOrganizationQueries(request.organizationId);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (request: RemoveOrganizationMemberRequest) =>
      organizationsService.removeMemberAsync(request),
    onSuccess: async (_response, request) => {
      const currentUser = queryClient.getQueryData<User>(queryKeys.auth.me());
      const removedCurrentUser = currentUser?.id === request.userId;

      if (removedCurrentUser) {
        queryClient.removeQueries({
          queryKey: queryKeys.organizations.detail(request.organizationId),
        });
      }

      await invalidateOrganizationQueries(request.organizationId, {
        includeDetail: !removedCurrentUser,
      });
      await refetchCurrentUser(queryClient);
    },
  });

  const joinOrganizationMutation = useMutation({
    mutationFn: async (token: string): Promise<OrganizationSummary | null> => {
      const userBeforeJoin = queryClient.getQueryData<User>(queryKeys.auth.me());

      await organizationsService.joinAsync(token);

      const userAfterJoin = await refetchCurrentUser(queryClient);
      const organizationsBeforeJoin = userBeforeJoin?.organizations ?? [];

      return (
        userAfterJoin.organizations.find(
          (organization) =>
            !organizationsBeforeJoin.some(
              (previousOrganization) => previousOrganization.id === organization.id
            )
        ) ?? null
      );
    },
    onSuccess: async (joinedOrganization) => {
      if (joinedOrganization) {
        setSelectedOrganizationId(joinedOrganization.id);
      }

      await invalidateOrganizationQueries(joinedOrganization?.id);
    },
  });

  return {
    createInviteAsync: createInviteMutation.mutateAsync,
    createOrganizationAsync: createOrganizationMutation.mutateAsync,
    isCreatingInvite: createInviteMutation.isPending,
    isCreatingOrganization: createOrganizationMutation.isPending,
    isJoiningOrganization: joinOrganizationMutation.isPending,
    isRemovingMember: removeMemberMutation.isPending,
    isUpdatingMemberRole: updateMemberRoleMutation.isPending,
    isUpsertingBudget: upsertBudgetMutation.isPending,
    isUpdatingOrganization: updateOrganizationMutation.isPending,
    joinOrganizationAsync: joinOrganizationMutation.mutateAsync,
    removeMemberAsync: removeMemberMutation.mutateAsync,
    updateMemberRoleAsync: updateMemberRoleMutation.mutateAsync,
    updateOrganizationAsync: updateOrganizationMutation.mutateAsync,
    upsertBudgetAsync: upsertBudgetMutation.mutateAsync,
  };
}
