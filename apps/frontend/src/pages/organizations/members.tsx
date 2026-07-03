import { Suspense, lazy, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import {
  inviteOrganizationRoles,
  type InviteOrganizationRole,
  type OrganizationMember,
  type OrganizationRole,
} from "@/api/organizations";
import { useCurrentUser, useSelectedOrganization } from "@/auth/auth-provider";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrganizationMutations } from "@/hooks/mutations/use-organization-mutations";
import { useOrganizationQuery } from "@/hooks/queries/use-organization-query";
import { cn } from "@/lib/utils";

const adminInviteRoleOptions: InviteOrganizationRole[] = ["Member"];
const noInviteRoleOptions: InviteOrganizationRole[] = [];

const InviteMemberDialog = lazy(async () => ({
  default: (await import("./components/invite-member-dialog")).InviteMemberDialog,
}));

function getInviteRoleOptions(
  currentUserRole?: OrganizationRole | null
): readonly InviteOrganizationRole[] {
  if (currentUserRole === "Owner") {
    return inviteOrganizationRoles;
  }

  if (currentUserRole === "Admin") {
    return adminInviteRoleOptions;
  }

  return noInviteRoleOptions;
}

function getEditableRoleOptions({
  currentUserId,
  currentUserRole,
  member,
  ownerCount,
}: {
  currentUserId?: string | null;
  currentUserRole?: OrganizationRole | null;
  member: OrganizationMember;
  ownerCount: number;
}): InviteOrganizationRole[] {
  if (currentUserRole !== "Owner") {
    return [];
  }

  if (member.role === "Owner" && (member.id !== currentUserId || ownerCount <= 1)) {
    return [];
  }

  return inviteOrganizationRoles.filter((role) => role !== member.role);
}

function canRemoveMember({
  currentUserId,
  currentUserRole,
  member,
  ownerCount,
}: {
  currentUserId?: string | null;
  currentUserRole?: OrganizationRole | null;
  member: OrganizationMember;
  ownerCount: number;
}) {
  if (!currentUserId || !currentUserRole) {
    return false;
  }

  const isSelf = member.id === currentUserId;

  if (isSelf) {
    return member.role !== "Owner" || ownerCount > 1;
  }

  if (currentUserRole === "Owner") {
    return member.role !== "Owner";
  }

  if (currentUserRole === "Admin") {
    return member.role === "Member";
  }

  return false;
}

function InviteMemberAction({
  allowedRoles,
  organizationId,
}: {
  allowedRoles: readonly InviteOrganizationRole[];
  organizationId: string;
}) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);

  if (allowedRoles.length === 0) {
    return null;
  }

  if (!enabled) {
    return (
      <Button onClick={() => setEnabled(true)}>
        <Plus className="h-4 w-4" />
        {t("organization.invite.trigger")}
      </Button>
    );
  }

  return (
    <Suspense
      fallback={
        <Button disabled>
          <Plus className="h-4 w-4" />
          {t("organization.invite.trigger")}
        </Button>
      }
    >
      <InviteMemberDialog
        defaultOpen
        allowedRoles={allowedRoles}
        organizationId={organizationId}
        trigger={
          <Button>
            <Plus className="h-4 w-4" />
            {t("organization.invite.trigger")}
          </Button>
        }
      />
    </Suspense>
  );
}

function RoleBadge({ role }: { role: OrganizationRole }) {
  const { t } = useTranslation();

  return (
    <Badge variant={role === "Owner" ? "default" : "secondary"}>
      {t(`organization.roles.${role.toLowerCase()}`)}
    </Badge>
  );
}

function MemberIdentity({
  isCurrentUser,
  member,
}: {
  isCurrentUser: boolean;
  member: OrganizationMember;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <UserRound className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="truncate font-medium">
            {member.username ? `@${member.username}` : member.email}
          </p>
          {isCurrentUser ? (
            <Badge variant="outline">{t("organization.members.you")}</Badge>
          ) : null}
        </div>
        <p className="truncate text-sm text-muted-foreground">{member.email}</p>
      </div>
    </div>
  );
}

function RoleControl({
  disabled,
  member,
  onChangeRole,
  roleOptions,
}: {
  disabled: boolean;
  member: OrganizationMember;
  onChangeRole: (member: OrganizationMember, role: InviteOrganizationRole) => void;
  roleOptions: InviteOrganizationRole[];
}) {
  const { t } = useTranslation();

  if (roleOptions.length === 0) {
    return <RoleBadge role={member.role} />;
  }

  return (
    <Select
      disabled={disabled}
      value={member.role}
      onValueChange={(role) =>
        onChangeRole(member, role as InviteOrganizationRole)
      }
    >
      <SelectTrigger className="h-9 w-[9.25rem]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {member.role === "Owner" ? (
          <SelectItem disabled value="Owner">
            {t("organization.roles.owner")}
          </SelectItem>
        ) : null}
        {inviteOrganizationRoles.map((role) => (
          <SelectItem
            key={role}
            disabled={!roleOptions.includes(role)}
            value={role}
          >
            {t(`organization.roles.${role.toLowerCase()}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MembersLoadingState() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="grid gap-3 border-b pb-4 last:border-0 last:pb-0 md:grid-cols-[minmax(0,1.5fr)_8rem_8rem_8rem]"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MemberRowActions({
  canRemove,
  isCurrentUser,
  isRemoving,
  onRemove,
}: {
  canRemove: boolean;
  isCurrentUser: boolean;
  isRemoving: boolean;
  onRemove: () => void;
}) {
  const { t } = useTranslation();

  if (!canRemove) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  return (
    <Button
      disabled={isRemoving}
      onClick={onRemove}
      size="sm"
      type="button"
      variant="outline"
    >
      <Trash2 className="h-4 w-4" />
      {isCurrentUser
        ? t("organization.members.leaveAction")
        : t("organization.members.removeAction")}
    </Button>
  );
}

function MembersTable({
  currentUserId,
  dateFormatter,
  members,
  onChangeRole,
  onRemove,
  ownerCount,
  pendingRemovalMemberId,
  pendingRoleMemberId,
  role,
}: {
  currentUserId?: string | null;
  dateFormatter: Intl.DateTimeFormat;
  members: OrganizationMember[];
  onChangeRole: (member: OrganizationMember, role: InviteOrganizationRole) => void;
  onRemove: (member: OrganizationMember) => void;
  ownerCount: number;
  pendingRemovalMemberId: string | null;
  pendingRoleMemberId: string | null;
  role?: OrganizationRole | null;
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-0">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("organization.members.memberColumn")}</TableHead>
                <TableHead>{t("organization.members.roleColumn")}</TableHead>
                <TableHead>{t("organization.members.joinedColumn")}</TableHead>
                <TableHead className="text-right">
                  {t("organization.members.actionsColumn")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isCurrentUser = member.id === currentUserId;
                const roleOptions = getEditableRoleOptions({
                  currentUserId,
                  currentUserRole: role,
                  member,
                  ownerCount,
                });
                const removable = canRemoveMember({
                  currentUserId,
                  currentUserRole: role,
                  member,
                  ownerCount,
                });

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <MemberIdentity
                        isCurrentUser={isCurrentUser}
                        member={member}
                      />
                    </TableCell>
                    <TableCell>
                      <RoleControl
                        disabled={pendingRoleMemberId === member.id}
                        member={member}
                        onChangeRole={onChangeRole}
                        roleOptions={roleOptions}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dateFormatter.format(new Date(member.joinedAt))}
                    </TableCell>
                    <TableCell className="text-right">
                      <MemberRowActions
                        canRemove={removable}
                        isCurrentUser={isCurrentUser}
                        isRemoving={pendingRemovalMemberId === member.id}
                        onRemove={() => onRemove(member)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="divide-y md:hidden">
          {members.map((member) => {
            const isCurrentUser = member.id === currentUserId;
            const roleOptions = getEditableRoleOptions({
              currentUserId,
              currentUserRole: role,
              member,
              ownerCount,
            });
            const removable = canRemoveMember({
              currentUserId,
              currentUserRole: role,
              member,
              ownerCount,
            });

            return (
              <div key={member.id} className="space-y-4 p-4">
                <MemberIdentity isCurrentUser={isCurrentUser} member={member} />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">
                      {t("organization.members.roleColumn")}
                    </p>
                    <RoleControl
                      disabled={pendingRoleMemberId === member.id}
                      member={member}
                      onChangeRole={onChangeRole}
                      roleOptions={roleOptions}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">
                      {t("organization.members.joinedColumn")}
                    </p>
                    <p className="font-medium">
                      {dateFormatter.format(new Date(member.joinedAt))}
                    </p>
                  </div>
                </div>
                <MemberRowActions
                  canRemove={removable}
                  isCurrentUser={isCurrentUser}
                  isRemoving={pendingRemovalMemberId === member.id}
                  onRemove={() => onRemove(member)}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function StateAlert({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <Alert>
      <Users className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>{description}</p>
        {action}
      </AlertDescription>
    </Alert>
  );
}

export function OrganizationMembers() {
  const { t, i18n } = useTranslation();
  const currentUserQuery = useCurrentUser();
  const selectedOrganization = useSelectedOrganization();
  const organizationQuery = useOrganizationQuery(selectedOrganization?.id ?? null);
  const {
    isRemovingMember,
    isUpdatingMemberRole,
    removeMemberAsync,
    updateMemberRoleAsync,
  } = useOrganizationMutations();
  const [memberToRemove, setMemberToRemove] =
    useState<OrganizationMember | null>(null);
  const [pendingRoleMemberId, setPendingRoleMemberId] = useState<string | null>(
    null
  );
  const [pendingRemovalMemberId, setPendingRemovalMemberId] = useState<
    string | null
  >(null);

  const organization = organizationQuery.data;
  const members = organization?.members ?? [];
  const currentUserId = currentUserQuery.data?.id ?? null;
  const currentUserRole =
    members.find((member) => member.id === currentUserId)?.role ?? null;
  const ownerCount = members.filter((member) => member.role === "Owner").length;
  const inviteRoleOptions = getInviteRoleOptions(currentUserRole);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }),
    [i18n.language]
  );

  async function onChangeRole(
    member: OrganizationMember,
    role: InviteOrganizationRole
  ) {
    if (!organization || member.role === role) {
      return;
    }

    setPendingRoleMemberId(member.id);

    try {
      await updateMemberRoleAsync({
        organizationId: organization.id,
        userId: member.id,
        role,
      });

      toast.success(t("organization.members.roleUpdated"), {
        description: t("organization.members.roleUpdatedDescription"),
      });
    } catch {
      // Error toast is handled globally by Axios interceptors.
    } finally {
      setPendingRoleMemberId(null);
    }
  }

  async function onConfirmRemoveMember() {
    if (!organization || !memberToRemove) {
      return;
    }

    const removingCurrentUser = memberToRemove.id === currentUserId;
    setPendingRemovalMemberId(memberToRemove.id);

    try {
      await removeMemberAsync({
        organizationId: organization.id,
        userId: memberToRemove.id,
      });

      toast.success(
        removingCurrentUser
          ? t("organization.members.leaveSuccess")
          : t("organization.members.removeSuccess")
      );
      setMemberToRemove(null);
    } catch {
      // Error toast is handled globally by Axios interceptors.
    } finally {
      setPendingRemovalMemberId(null);
    }
  }

  if (!selectedOrganization) {
    return (
      <PageContainer className="max-w-5xl">
        <PageHeader
          title={t("organization.members.title")}
          description={t("organization.members.description")}
        />
        <StateAlert
          action={
            <Button asChild>
              <Link to="/account/create-organization">
                {t("organization.empty.createAction")}
              </Link>
            </Button>
          }
          description={t("organization.empty.description")}
          title={t("organization.empty.title")}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader
        title={t("organization.members.title")}
        description={t("organization.members.description")}
        actions={
          organization ? (
            <InviteMemberAction
              allowedRoles={inviteRoleOptions}
              organizationId={organization.id}
            />
          ) : null
        }
      />

      {organizationQuery.isPending ? (
        <MembersLoadingState />
      ) : !organization ? (
        <StateAlert
          description={t("organization.unavailable.description")}
          title={t("organization.unavailable.title")}
        />
      ) : members.length === 0 ? (
        <StateAlert
          description={t("organization.members.empty")}
          title={t("organization.members.emptyTitle")}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {t("organization.members.totalMembers")}
              </div>
              <p className="mt-2 text-2xl font-semibold">{members.length}</p>
            </div>
            <div className="rounded-md border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                {t("organization.members.ownerCount")}
              </div>
              <p className="mt-2 text-2xl font-semibold">{ownerCount}</p>
            </div>
            <div className="rounded-md border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserRound className="h-4 w-4" />
                {t("organization.members.yourRole")}
              </div>
              <p className="mt-2 text-base font-semibold">
                {currentUserRole
                  ? t(`organization.roles.${currentUserRole.toLowerCase()}`)
                  : "-"}
              </p>
            </div>
          </div>

          <MembersTable
            currentUserId={currentUserId}
            dateFormatter={dateFormatter}
            members={members}
            onChangeRole={onChangeRole}
            onRemove={setMemberToRemove}
            ownerCount={ownerCount}
            pendingRemovalMemberId={pendingRemovalMemberId}
            pendingRoleMemberId={
              isUpdatingMemberRole ? pendingRoleMemberId : null
            }
            role={currentUserRole}
          />
        </div>
      )}

      <AlertDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => {
          if (!open) {
            setMemberToRemove(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {memberToRemove?.id === currentUserId
                ? t("organization.members.leaveConfirmTitle")
                : t("organization.members.removeConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove?.id === currentUserId
                ? t("organization.members.leaveConfirmDescription")
                : t("organization.members.removeConfirmDescription", {
                    member:
                      memberToRemove?.username || memberToRemove?.email || "",
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingMember}>
              {t("labels.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "destructive" }))}
              disabled={isRemovingMember}
              onClick={onConfirmRemoveMember}
            >
              {memberToRemove?.id === currentUserId
                ? t("organization.members.leaveAction")
                : t("organization.members.removeAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
