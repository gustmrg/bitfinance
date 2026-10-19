import { Copy, LogOut, Mail, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type {
  InvitationResult,
  OrganizationDetails,
  PendingInvitation,
} from "@/api/organizations/organizations.types";
import { useAuth } from "@/auth/auth-provider";
import { useOrganizationStore } from "@/auth/auth-store";
import { Avatar } from "@/components/base/avatar";
import { Badge, type BadgeTone } from "@/components/base/badge";
import { Button } from "@/components/base/button";
import { Card, CardHeader } from "@/components/base/card";
import { ConfirmDialog, Dialog, DialogActions } from "@/components/base/dialog";
import { ErrorState, LoadingState } from "@/components/base/feedback";
import { Field, Input } from "@/components/base/field";
import { IconButton } from "@/components/base/icon-button";
import { PageHeader } from "@/components/base/page-header";
import { Select } from "@/components/base/select";
import { Page } from "@/components/layout/page";
import { SettingsTabs } from "@/components/navigation/settings-tabs";
import {
  useInvitationMutations,
  useOrganizationMemberMutations,
} from "@/hooks/mutations/use-organization-mutations";
import {
  useInvitationsQuery,
  useOrganizationQuery,
} from "@/hooks/queries/use-organization-queries";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { formatLongDate, formatMediumDate, relativeDate } from "@/lib/format";
import {
  canManageOrganization,
  findMemberRole,
  isEditableMemberRole,
  isKnownMemberRole,
} from "@/pages/organizations/member-permissions";

type Member = OrganizationDetails["members"][number];

const roleTones: Record<string, BadgeTone> = {
  Owner: "brand",
  Admin: "warning",
  Member: "neutral",
};

export function MembersPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const auth = useAuth();
  const navigate = useNavigate();
  const organizationId = useSelectedOrganization();
  const detail = useOrganizationQuery(organizationId);
  const memberMutations = useOrganizationMemberMutations(organizationId);
  const invitationMutations = useInvitationMutations(organizationId);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<"Admin" | "Member">("Member");
  const [invite, setInvite] = useState<{ email: string; url: string; expiresAt: string } | null>(
    null,
  );
  const [pendingRemoval, setPendingRemoval] = useState<Member | null>(null);
  const [pendingRevocation, setPendingRevocation] = useState<PendingInvitation | null>(null);
  const currentRole = findMemberRole(detail.data?.members, auth.user?.id);
  const inviteRoles: Array<"Admin" | "Member"> =
    currentRole === "Owner" ? ["Admin", "Member"] : ["Member"];
  const canInvite = canManageOrganization(currentRole);
  const invitations = useInvitationsQuery(organizationId, canInvite);
  const showInvite = (email: string, result: InvitationResult) =>
    setInvite({
      email,
      url: `${window.location.origin}/join-organization?token=${encodeURIComponent(result.token)}`,
      expiresAt: result.expiresAt,
    });
  const createInvite = (email: string, role: "Admin" | "Member") =>
    invitationMutations.create.mutate(
      { email, role },
      {
        onSuccess: (result) => {
          showInvite(email, result);
          setInviteOpen(false);
          toast.success(t("organization.invitationCreated"));
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : t("organization.invitationError")),
      },
    );
  const canManageInvitation = (invitation: PendingInvitation) =>
    currentRole === "Owner" || (currentRole === "Admin" && invitation.role === "Member");
  const renewInvitation = (invitation: PendingInvitation) =>
    invitationMutations.renew.mutate(invitation.id, {
      onSuccess: (result) => {
        showInvite(invitation.email, result);
        toast.success(t("organization.invitationRenewed"));
      },
      onError: (error) => toast.error(error.message),
    });
  const confirmRevocation = () => {
    if (!pendingRevocation) return;
    invitationMutations.revoke.mutate(pendingRevocation.id, {
      onSuccess: () => {
        if (invite?.email === pendingRevocation.email) setInvite(null);
        setPendingRevocation(null);
        toast.success(t("organization.invitationRevoked"));
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const header = (
    <>
      <PageHeader
        title={t("nav.settings")}
        description={t("nav.settingsBody")}
        actions={
          canInvite ? (
            <Button
              onClick={() => {
                setInviteRole(inviteRoles[inviteRoles.length - 1]);
                setInviteOpen(true);
              }}
            >
              <UserPlus size={17} aria-hidden="true" /> {t("common.invite")}
            </Button>
          ) : undefined
        }
      />
      <SettingsTabs />
    </>
  );

  if (!organizationId || detail.isPending)
    return (
      <Page>
        {header}
        <Card>
          <LoadingState />
        </Card>
      </Page>
    );
  if (detail.error || !detail.data)
    return (
      <Page>
        {header}
        <Card>
          <ErrorState
            message={detail.error?.message ?? t("organization.membersUnavailable")}
            onRetry={() => void detail.refetch()}
          />
        </Card>
      </Page>
    );

  const members = detail.data.members;
  const copy = async () => {
    if (invite) {
      await navigator.clipboard.writeText(invite.url);
      toast.success(t("organization.invitationCopied"));
    }
  };
  const canChangeRole = (member: Member) =>
    currentRole === "Owner" && isEditableMemberRole(member.role);
  const ownerCount = members.filter((member) => member.role === "Owner").length;
  const canRemove = (member: Member) =>
    (member.id === auth.user?.id && !(member.role === "Owner" && ownerCount <= 1)) ||
    (currentRole === "Owner" && isEditableMemberRole(member.role)) ||
    (currentRole === "Admin" && member.role === "Member");
  const confirmRemoval = () => {
    if (!pendingRemoval) return;
    const isSelf = pendingRemoval.id === auth.user?.id;
    memberMutations.remove.mutate(pendingRemoval.id, {
      onSuccess: async () => {
        setPendingRemoval(null);
        if (!isSelf) {
          toast.success(t("organization.memberRemoved"));
          return;
        }
        const nextUser = await auth.refreshUser();
        const nextOrganization = nextUser.organizations.find(
          (organization) => organization.id !== organizationId,
        );
        useOrganizationStore.getState().setSelectedOrganizationId(nextOrganization?.id ?? null);
        toast.success(t("organization.left"));
        navigate(nextOrganization ? "/dashboard" : "/organizations/new", { replace: true });
      },
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : t("organization.removeError")),
    });
  };
  const removingSelf = pendingRemoval?.id === auth.user?.id;

  return (
    <Page>
      {header}
      {invite && (
        <Card className="grid gap-3 border-brand/40 bg-brand-soft/40">
          <CardHeader
            className="mb-0"
            title={t("organization.invitationReady")}
            description={t("organization.invitationReadyFor", {
              email: invite.email,
              date: formatLongDate(invite.expiresAt, locale),
            })}
          />
          <div className="flex flex-wrap gap-2">
            <Input
              readOnly
              value={invite.url}
              aria-label={t("organization.invitationLink")}
              className="min-w-0 flex-1 basis-64 font-mono text-[13px]"
              onFocus={(event) => event.currentTarget.select()}
            />
            <Button onClick={() => void copy()}>
              <Copy size={16} aria-hidden="true" /> {t("common.copy")}
            </Button>
          </div>
          <p className="m-0 text-[13px] text-ink-muted">
            {t("organization.invitationEmailHint", { email: invite.email })}
          </p>
        </Card>
      )}
      <Card aria-labelledby="members-title" padding="md" className="sm:p-6">
        <CardHeader
          titleId="members-title"
          title={t("organization.membersTitle")}
          description={t("common.peopleCount", { count: members.length })}
        />
        <ul className="m-0 grid list-none p-0">
          {members.map((member) => {
            const role = isKnownMemberRole(member.role) ? member.role : null;
            const isSelf = member.id === auth.user?.id;
            return (
              <li
                key={member.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-t border-line py-3.5 first:border-t-0 md:grid-cols-[auto_minmax(0,1fr)_184px_200px_auto]"
              >
                <Avatar name={member.username} size="md" />
                <span className="grid min-w-0">
                  <span className="truncate text-sm font-bold">
                    {member.username}
                    {isSelf && (
                      <span className="font-medium text-ink-muted"> · {t("organization.you")}</span>
                    )}
                  </span>
                  <span className="truncate text-[13px] text-ink-muted">{member.email}</span>
                </span>
                <span className="justify-self-end md:justify-self-start">
                  {canChangeRole(member) ? (
                    <div className="w-46">
                      <Select<"Admin" | "Member">
                        ariaLabel={`${t("organization.roleFor")} ${member.username}`}
                        value={isEditableMemberRole(role) ? role : "Member"}
                        disabled={memberMutations.updateRole.isPending}
                        onValueChange={(value) =>
                          memberMutations.updateRole.mutate(
                            { userId: member.id, role: value },
                            {
                              onSuccess: () => toast.success(t("organization.roleUpdated")),
                              onError: (error) =>
                                toast.error(
                                  error instanceof Error
                                    ? error.message
                                    : t("organization.roleError"),
                                ),
                            },
                          )
                        }
                        options={[
                          { value: "Admin", label: t("roles.Admin") },
                          { value: "Member", label: t("roles.Member") },
                        ]}
                      />
                    </div>
                  ) : (
                    <Badge tone={role ? roleTones[role] : "neutral"}>
                      {role ? t(`roles.${role}`) : t("organization.roleUnavailable")}
                    </Badge>
                  )}
                </span>
                <span className="col-start-2 whitespace-nowrap text-[13px] text-ink-muted md:col-start-auto">
                  {member.joinedAt
                    ? t("common.joined", { date: formatMediumDate(member.joinedAt, locale) })
                    : t("organization.joinedUnavailable")}
                </span>
                <span className="col-start-3 row-start-2 justify-self-end md:col-start-auto md:row-start-auto">
                  {canRemove(member) &&
                    (isSelf ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={memberMutations.remove.isPending}
                        onClick={() => setPendingRemoval(member)}
                      >
                        <LogOut size={15} aria-hidden="true" /> {t("organization.leave")}
                      </Button>
                    ) : (
                      <IconButton
                        label={`${t("organization.remove")} ${member.username}`}
                        disabled={memberMutations.remove.isPending}
                        onClick={() => setPendingRemoval(member)}
                      >
                        <Trash2 size={17} className="text-danger" aria-hidden="true" />
                      </IconButton>
                    ))}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
      {canInvite && (
        <Card aria-labelledby="invitations-title" padding="md" className="sm:p-6">
          <CardHeader
            titleId="invitations-title"
            title={t("organization.pendingInvitations")}
            description={t("organization.pendingInvitationsBody")}
          />
          {invitations.isPending ? (
            <LoadingState />
          ) : invitations.error ? (
            <ErrorState
              message={invitations.error.message}
              onRetry={() => void invitations.refetch()}
            />
          ) : invitations.data.length ? (
            <ul className="m-0 grid list-none p-0">
              {invitations.data.map((invitation) => (
                <li
                  key={invitation.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-t border-line py-3.5 first:border-t-0 md:grid-cols-[auto_minmax(0,1fr)_184px_200px_auto]"
                >
                  <span className="inline-grid size-11 place-items-center rounded-full bg-surface-muted text-ink-muted">
                    <Mail size={18} aria-hidden="true" />
                  </span>
                  <span className="grid min-w-0">
                    <span className="truncate text-sm font-bold">{invitation.email}</span>
                    <span className="truncate text-[13px] text-ink-muted">
                      {invitation.invitedBy
                        ? t("organization.invitedBy", { name: invitation.invitedBy })
                        : t("organization.invited")}
                    </span>
                  </span>
                  <span className="justify-self-end md:justify-self-start">
                    <Badge tone={roleTones[invitation.role]}>{t(`roles.${invitation.role}`)}</Badge>
                  </span>
                  <span className="col-start-2 text-[13px] text-ink-muted md:col-start-auto">
                    {t("organization.expiresIn", {
                      time: relativeDate(invitation.expiresAt, locale),
                    })}
                  </span>
                  <span className="col-start-3 row-start-2 flex justify-end gap-1 md:col-start-auto md:row-start-auto">
                    {canManageInvitation(invitation) && (
                      <>
                        <IconButton
                          label={`${t("organization.newLink")} · ${invitation.email}`}
                          disabled={invitationMutations.renew.isPending}
                          onClick={() => renewInvitation(invitation)}
                        >
                          <RefreshCw size={17} aria-hidden="true" />
                        </IconButton>
                        <IconButton
                          label={`${t("organization.revoke")} · ${invitation.email}`}
                          disabled={invitationMutations.revoke.isPending}
                          onClick={() => setPendingRevocation(invitation)}
                        >
                          <Trash2 size={17} className="text-danger" aria-hidden="true" />
                        </IconButton>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 py-4 text-sm text-ink-muted">
              {t("organization.noPendingInvitations")}
            </p>
          )}
        </Card>
      )}
      <Dialog
        open={inviteOpen && canInvite}
        onOpenChange={setInviteOpen}
        title={t("common.invite")}
        description={t("organization.invitationDescription")}
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            createInvite(String(data.get("email")), inviteRole);
          }}
        >
          <Field label={t("organization.email")}>
            {(control) => <Input {...control} name="email" type="email" required autoFocus />}
          </Field>
          <Field label={t("organization.role")}>
            {(control) => (
              <Select
                id={control.id}
                value={inviteRole}
                onValueChange={setInviteRole}
                options={inviteRoles.map((role) => ({ value: role, label: t(`roles.${role}`) }))}
              />
            )}
          </Field>
          <DialogActions>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={invitationMutations.create.isPending}>
              {t("organization.sendInvite")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <ConfirmDialog
        open={Boolean(pendingRevocation)}
        onOpenChange={(next) => !next && setPendingRevocation(null)}
        title={t("organization.revokeConfirm", { email: pendingRevocation?.email ?? "" })}
        description={t("organization.revokeDescription")}
        confirmLabel={t("organization.revoke")}
        pending={invitationMutations.revoke.isPending}
        onConfirm={confirmRevocation}
      />
      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        onOpenChange={(next) => !next && setPendingRemoval(null)}
        title={
          removingSelf
            ? t("common.leaveOrganizationConfirm")
            : t("common.removeMemberConfirm", { name: pendingRemoval?.username ?? "" })
        }
        description={
          removingSelf ? t("organization.leaveDescription") : t("organization.removeDescription")
        }
        confirmLabel={removingSelf ? t("organization.leave") : t("organization.remove")}
        pending={memberMutations.remove.isPending}
        onConfirm={confirmRemoval}
      />
    </Page>
  );
}
