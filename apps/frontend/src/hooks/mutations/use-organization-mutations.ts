import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  organizationsService,
  type CreateInvitationRequest,
  type CreateOrganizationRequest,
  type OrganizationSummary,
  type UpdateOrganizationRequest,
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

  const invalidateOrganizationQueries = async (organizationId?: string) => {
    const promises: Promise<void>[] = [
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.me(),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.all,
      }),
    ];

    if (organizationId) {
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

  const createInviteMutation = useMutation({
    mutationFn: async (request: CreateInvitationRequest) =>
      organizationsService.createInviteAsync(request),
    onSuccess: async (_response, request) => {
      await invalidateOrganizationQueries(request.organizationId);
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
    isUpdatingOrganization: updateOrganizationMutation.isPending,
    joinOrganizationAsync: joinOrganizationMutation.mutateAsync,
    updateOrganizationAsync: updateOrganizationMutation.mutateAsync,
  };
}
