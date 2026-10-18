import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Building2,
  Check,
  CircleDollarSign,
  Crown,
  Lock,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/auth/auth-provider";
import { useOrganizationStore } from "@/auth/auth-store";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageContainer } from "@/components/layout/page-container";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatLongDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { useOrganizationMutations } from "@/hooks/mutations/use-organization-mutations";
import { useBudgetQuery, useOrganizationQuery } from "@/hooks/queries/use-organization-queries";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { canManageOrganization, findMemberRole } from "@/pages/organizations/member-permissions";

export function OrganizationPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const auth = useAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const organizationId = useSelectedOrganization();
  const detail = useOrganizationQuery(organizationId);
  const budgetQuery = useBudgetQuery(organizationId);
  const mutations = useOrganizationMutations(organizationId);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  /* eslint-disable react-hooks/set-state-in-effect -- The form mirrors newly selected server data. */
  useEffect(() => {
    if (detail.data) {
      setName(detail.data.name);
      setBudget(String(budgetQuery.data?.amount ?? detail.data.budget?.amount ?? ""));
    }
  }, [budgetQuery.data, detail.data]);
  /* eslint-enable react-hooks/set-state-in-effect */
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
          message={detail.error?.message ?? t("organization.notFound")}
          onRetry={() => {
            void detail.refetch();
          }}
        />
      </PageContainer>
    );
  const organization = detail.data;
  const budgetData = budgetQuery.data !== undefined ? budgetQuery.data : organization.budget;
  const currentRole = findMemberRole(organization.members, auth.user?.id);
  const canManage = canManageOrganization(currentRole);
  const isOwner = currentRole === "Owner";
  const transferCandidates = organization.members.filter(
    (member) => member.id !== auth.user?.id && member.role !== "Owner",
  );
  const closeTransfer = () => {
    setTransferOpen(false);
    setTransferTarget(null);
  };
  const closeDelete = () => {
    setDeleteOpen(false);
    setDeleteConfirmation("");
  };
  const confirmTransfer = () => {
    if (!transferTarget) return;
    mutations.transferOwnership.mutate(transferTarget, {
      onSuccess: () => {
        closeTransfer();
        toast.success(t("organization.ownershipTransferred"));
      },
      onError: (error) => toast.error(error.message),
    });
  };
  const confirmDelete = () => {
    mutations.remove.mutate(undefined, {
      onSuccess: async () => {
        closeDelete();
        const nextUser = await auth.refreshUser();
        const nextOrganization = nextUser.organizations.find((item) => item.id !== organizationId);
        useOrganizationStore.getState().setSelectedOrganizationId(nextOrganization?.id ?? null);
        toast.success(t("organization.deleted"));
        navigate(nextOrganization ? "/dashboard" : "/organizations/new", { replace: true });
        void client.invalidateQueries({ queryKey: queryKeys.organizations.list() });
      },
      onError: (error) => toast.error(error.message),
    });
  };
  return (
    <PageContainer>
      <PageHeader
        eyebrow={t("organization.eyebrow")}
        title={t("organization.title")}
        description={t("organization.body")}
        actions={
          <Link to="/settings/members" className="button button--secondary">
            <UsersRound size={17} /> {t("nav.members")}
          </Link>
        }
      />
      <div className="organization-layout">
        <section className="surface-card organization-hero">
          <div className="organization-hero__mark">
            <Building2 size={25} />
          </div>
          <div>
            <p className="eyebrow">{t("organization.active")}</p>
            <h2>{organization.name}</h2>
            <p>
              {t("organization.created", { date: formatLongDate(organization.createdAt, locale) })}
            </p>
          </div>
          <span className="organization-hero__status">
            <span className="live-dot" /> {t("common.active")}
          </span>
        </section>
        {!canManage && (
          <p className="read-only-note">
            <Lock size={14} /> {t("organization.readOnly")}
          </p>
        )}
        <div className="organization-grid">
          <section className="surface-card">
            <SectionHeading
              title={t("organization.settings")}
              description={t("organization.onlyEditable")}
            />
            <form
              className="modal-form"
              onSubmit={(event) => {
                event.preventDefault();
                mutations.update.mutate(name, {
                  onSuccess: () => toast.success(t("organization.settingsSaved")),
                  onError: (error) => toast.error(error.message),
                });
              }}
            >
              <label>
                <span>{t("organization.name")}</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  readOnly={!canManage}
                  required
                />
              </label>
              {canManage && (
                <Button type="submit" disabled={mutations.update.isPending}>
                  {t("common.save")} <Check size={16} />
                </Button>
              )}
            </form>
          </section>
          <section className="surface-card budget-card">
            <SectionHeading
              title={t("organization.budget")}
              description={t("organization.boundary")}
            />
            <div className="budget-card__number">
              <span>{t("organization.monthlyLimit")}</span>
              <strong>
                {budgetData
                  ? formatCurrency(budgetData.amount, locale)
                  : t("organization.notConfigured")}
              </strong>
            </div>
            {canManage && (
              <form
                className="inline-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  mutations.budget.mutate(Number(budget), {
                    onSuccess: () => toast.success(t("organization.budgetSaved")),
                    onError: (error) => toast.error(error.message),
                  });
                }}
              >
                <input
                  aria-label={t("organization.monthlyBudget")}
                  type="number"
                  min="0"
                  step="0.01"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                />
                <Button type="submit" disabled={mutations.budget.isPending}>
                  {t("common.update")}
                </Button>
              </form>
            )}
            <div className="budget-card__footer">
              <span>
                <CircleDollarSign size={15} /> {t("organization.dashboardUpdate")}
              </span>
            </div>
          </section>
          <section className="surface-card plan-card">
            <SectionHeading
              title={t("organization.plan")}
              description={t("organization.planBody")}
            />
            <div className="plan-card__row">
              <span className={`plan-badge plan-badge--${organization.planTier.toLowerCase()}`}>
                {t(`organization.planTiers.${organization.planTier.toLowerCase()}`)}
              </span>
              <span className="plan-card__expiry">
                {t("organization.planExpires", {
                  date: formatLongDate(organization.planExpiresAt, locale),
                })}
              </span>
            </div>
          </section>
        </div>
        <section className="surface-card organization-members-preview">
          <SectionHeading
            title={t("organization.members")}
            description={t("organization.memberBody")}
            action={
              <Link to="/settings/members" className="inline-link">
                {t("organization.manageMembers")} <ArrowUpRight size={14} />
              </Link>
            }
          />
          <div className="member-stack">
            {organization.members.slice(0, 3).map((member) => (
              <div className="member-chip" key={member.id}>
                <Avatar initials={member.username.slice(0, 2).toUpperCase()} size="sm" />
                <span>
                  <strong>{member.username}</strong>
                  <small>{member.email}</small>
                </span>
              </div>
            ))}
          </div>
        </section>
        {isOwner && (
          <section className="surface-card danger-zone">
            <SectionHeading
              title={t("organization.dangerZone")}
              description={t("organization.dangerZoneBody")}
            />
            <div className="danger-zone__row">
              <span>
                <strong>{t("organization.transferOwnership")}</strong>
                <small>
                  {transferCandidates.length
                    ? t("organization.transferOwnershipBody")
                    : t("organization.transferOwnershipUnavailable")}
                </small>
              </span>
              <Button
                variant="secondary"
                disabled={!transferCandidates.length}
                onClick={() => setTransferOpen(true)}
              >
                <Crown size={16} /> {t("organization.transfer")}
              </Button>
            </div>
            <div className="danger-zone__row">
              <span>
                <strong>{t("organization.deleteOrganization")}</strong>
                <small>{t("organization.deleteOrganizationBody")}</small>
              </span>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                <Trash2 size={16} /> {t("common.delete")}
              </Button>
            </div>
          </section>
        )}
      </div>
      {transferOpen && (
        <Modal
          title={t("organization.transferOwnership")}
          description={t("organization.transferDescription")}
          onClose={closeTransfer}
        >
          <form
            className="modal-form"
            onSubmit={(event) => {
              event.preventDefault();
              confirmTransfer();
            }}
          >
            <label>
              <span>{t("organization.newOwner")}</span>
              <Select<string>
                ariaLabel={t("organization.newOwner")}
                value={transferTarget}
                placeholder={t("organization.chooseMember")}
                onValueChange={(value) => setTransferTarget(value)}
                options={transferCandidates.map((member) => ({
                  value: member.id,
                  label: `${member.username} · ${member.email}`,
                }))}
              />
            </label>
            <div className="modal-form__actions">
              <Button type="button" variant="ghost" onClick={closeTransfer}>
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={!transferTarget || mutations.transferOwnership.isPending}
              >
                {t("organization.transfer")}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {deleteOpen && (
        <Modal
          title={t("organization.deleteConfirmTitle", { name: organization.name })}
          description={t("organization.deleteConfirmBody")}
          onClose={closeDelete}
        >
          <form
            className="modal-form"
            onSubmit={(event) => {
              event.preventDefault();
              confirmDelete();
            }}
          >
            <label>
              <span>{t("organization.deleteConfirmLabel", { name: organization.name })}</span>
              <input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                autoComplete="off"
              />
            </label>
            <div className="modal-form__actions">
              <Button type="button" variant="ghost" onClick={closeDelete}>
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={
                  deleteConfirmation.trim() !== organization.name || mutations.remove.isPending
                }
              >
                {t("organization.deleteOrganization")}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
