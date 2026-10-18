import { ArrowUpRight, Mail, RefreshCw, ShieldCheck, UserPlus } from "lucide-react";
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
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageContainer } from "@/components/layout/page-container";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { formatLongDate, relativeDate } from "@/lib/format";
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
import {
  canManageOrganization,
  findMemberRole,
  isEditableMemberRole,
  isKnownMemberRole,
} from "@/pages/organizations/member-permissions";

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
  const [invite, setInvite] = useState<{ email: string; url: string; expiresAt: string } | null>(
    null,
  );
  const [pendingRemoval, setPendingRemoval] = useState<
    OrganizationDetails["members"][number] | null
  >(null);
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

  if (!organizationId || detail.isPending)
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  if (detail.error || !detail.data)
    return (
      <PageContainer>
        <ErrorState
          message={detail.error?.message ?? t("organization.membersUnavailable")}
          onRetry={() => {
            void detail.refetch();
          }}
        />
      </PageContainer>
    );

  const copy = async () => {
    if (invite) {
      await navigator.clipboard.writeText(invite.url);
      toast.success(t("organization.invitationCopied"));
    }
  };
  const canChangeRole = (member: (typeof detail.data.members)[number]) =>
    currentRole === "Owner" && isEditableMemberRole(member.role);
  const canRemove = (member: (typeof detail.data.members)[number]) =>
    member.id === auth.user?.id ||
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
        navigate(nextOrganization ? "/dashboard" : "/organizations/new", {
          replace: true,
        });
      },
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : t("organization.removeError")),
    });
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow={t("organization.eyebrow")}
        title={t("organization.membersTitle")}
        description={t("organization.membersBody")}
        actions={
          canInvite ? (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus size={17} /> {t("common.invite")}
            </Button>
          ) : undefined
        }
      />
      <section className="surface-card members-card">
        <div className="members-card__summary">
          <div>
            <span className="eyebrow">{t("organization.accessOverview")}</span>
            <strong>{t("common.peopleCount", { count: detail.data.members.length })}</strong>
            <p>{t("organization.everyoneAccess")}</p>
          </div>
          <span className="members-card__badge">
            <ShieldCheck size={15} /> {t("organization.protected")}
          </span>
        </div>
        <div className="members-list">
          {detail.data.members.map((member) => {
            const role = isKnownMemberRole(member.role) ? member.role : null;
            const roleClass = role ? role.toLowerCase() : "unknown";
            return (
              <div className="member-row" key={member.id}>
                <Avatar initials={member.username.slice(0, 2).toUpperCase()} size="md" />
                <span>
                  <strong>{member.username}</strong>
                  <small>{member.email}</small>
                </span>
                <span className={`role-badge role-badge--${roleClass}`}>
                  {role ? t(`roles.${role}`) : t("organization.roleUnavailable")}
                </span>
                <small className="member-row__joined">
                  {member.joinedAt
                    ? t("common.joined", { date: formatLongDate(member.joinedAt, locale) })
                    : t("organization.joinedUnavailable")}
                </small>
                {(canChangeRole(member) || canRemove(member)) && (
                  <div className="member-row__actions">
                    {canChangeRole(member) && (
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
                    )}
                    {canRemove(member) && (
                      <Button
                        variant="ghost"
                        disabled={memberMutations.remove.isPending}
                        onClick={() => setPendingRemoval(member)}
                      >
                        {member.id === auth.user?.id
                          ? t("organization.leave")
                          : t("organization.remove")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      {invite && (
        <section className="surface-card detail-card">
          <SectionHeading
            title={t("organization.invitationReady")}
            description={t("organization.invitationReadyFor", {
              email: invite.email,
              date: formatLongDate(invite.expiresAt, locale),
            })}
            action={
              <Button
                onClick={() => {
                  void copy();
                }}
              >
                {t("common.copy")}
              </Button>
            }
          />
          <input readOnly value={invite.url} aria-label={t("organization.invitationLink")} />
          <p className="muted">{t("organization.invitationEmailHint", { email: invite.email })}</p>
        </section>
      )}
      {canInvite && (
        <section className="surface-card members-card invitations-card">
          <SectionHeading
            title={t("organization.pendingInvitations")}
            description={t("organization.pendingInvitationsBody")}
          />
          {invitations.isPending ? (
            <LoadingState />
          ) : invitations.error ? (
            <ErrorState
              message={invitations.error.message}
              onRetry={() => {
                void invitations.refetch();
              }}
            />
          ) : invitations.data.length ? (
            <div className="members-list">
              {invitations.data.map((invitation) => (
                <div className="member-row" key={invitation.id}>
                  <span className="member-row__icon">
                    <Mail size={16} />
                  </span>
                  <span>
                    <strong>{invitation.email}</strong>
                    <small>
                      {invitation.invitedBy
                        ? t("organization.invitedBy", { name: invitation.invitedBy })
                        : t("organization.invited")}
                    </small>
                  </span>
                  <span className={`role-badge role-badge--${invitation.role.toLowerCase()}`}>
                    {t(`roles.${invitation.role}`)}
                  </span>
                  <small className="member-row__joined">
                    {t("organization.expiresIn", {
                      time: relativeDate(invitation.expiresAt, locale),
                    })}
                  </small>
                  {canManageInvitation(invitation) && (
                    <div className="member-row__actions">
                      <Button
                        variant="ghost"
                        disabled={invitationMutations.renew.isPending}
                        onClick={() => renewInvitation(invitation)}
                      >
                        <RefreshCw size={14} /> {t("organization.newLink")}
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={invitationMutations.revoke.isPending}
                        onClick={() => setPendingRevocation(invitation)}
                      >
                        {t("organization.revoke")}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">{t("organization.noPendingInvitations")}</p>
          )}
        </section>
      )}
      {inviteOpen && canInvite && (
        <Modal
          title={t("common.invite")}
          description={t("organization.invitationDescription")}
          onClose={() => setInviteOpen(false)}
        >
          <form
            className="modal-form"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              createInvite(
                String(data.get("email")),
                String(data.get("role")) as "Admin" | "Member",
              );
            }}
          >
            <label>
              <span>{t("organization.email")}</span>
              <input name="email" type="email" required />
            </label>
            <label>
              <span>{t("organization.role")}</span>
              <Select
                name="role"
                defaultValue={inviteRoles[0]}
                options={inviteRoles.map((role) => ({ value: role, label: t(`roles.${role}`) }))}
              />
            </label>
            <div className="modal-form__actions">
              <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={invitationMutations.create.isPending}>
                {t("common.invite")} <ArrowUpRight size={16} />
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {pendingRevocation && (
        <ConfirmDialog
          title={t("organization.revokeConfirm", { email: pendingRevocation.email })}
          description={t("organization.revokeDescription")}
          confirmLabel={t("organization.revoke")}
          pending={invitationMutations.revoke.isPending}
          onConfirm={confirmRevocation}
          onClose={() => setPendingRevocation(null)}
        />
      )}
      {pendingRemoval && (
        <ConfirmDialog
          title={
            pendingRemoval.id === auth.user?.id
              ? t("common.leaveOrganizationConfirm")
              : t("common.removeMemberConfirm", { name: pendingRemoval.username })
          }
          description={
            pendingRemoval.id === auth.user?.id
              ? t("organization.leaveDescription")
              : t("organization.removeDescription")
          }
          confirmLabel={
            pendingRemoval.id === auth.user?.id ? t("organization.leave") : t("organization.remove")
          }
          pending={memberMutations.remove.isPending}
          onConfirm={confirmRemoval}
          onClose={() => setPendingRemoval(null)}
        />
      )}
    </PageContainer>
  );
}
