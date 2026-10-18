import { useQueryClient } from "@tanstack/react-query";
import { Building2, Crown, Lock, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/auth/auth-provider";
import { useOrganizationStore } from "@/auth/auth-store";
import { Amount } from "@/components/base/amount";
import { Badge } from "@/components/base/badge";
import { Button } from "@/components/base/button";
import { Card, CardHeader } from "@/components/base/card";
import { Dialog, DialogActions } from "@/components/base/dialog";
import { ErrorState, LoadingState } from "@/components/base/feedback";
import { Field, Input } from "@/components/base/field";
import { PageHeader } from "@/components/base/page-header";
import { Select } from "@/components/base/select";
import { Page } from "@/components/layout/page";
import { SettingsTabs } from "@/components/navigation/settings-tabs";
import { useOrganizationMutations } from "@/hooks/mutations/use-organization-mutations";
import { useBudgetQuery, useOrganizationQuery } from "@/hooks/queries/use-organization-queries";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { formatLongDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
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

  const header = (
    <>
      <PageHeader title={t("nav.settings")} description={t("nav.settingsBody")} />
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
            message={detail.error?.message ?? t("organization.notFound")}
            onRetry={() => void detail.refetch()}
          />
        </Card>
      </Page>
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
    <Page>
      {header}
      <Card className="flex flex-wrap items-center gap-4">
        <span className="inline-grid size-14 shrink-0 place-items-center rounded-card bg-brand-soft text-brand-ink">
          <Building2 size={26} aria-hidden="true" />
        </span>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <h2 className="m-0 truncate text-xl font-extrabold tracking-tight">
            {organization.name}
          </h2>
          <span className="text-sm text-ink-muted">
            {t("organization.created", { date: formatLongDate(organization.createdAt, locale) })}
          </span>
        </div>
        <div className="grid justify-items-start gap-1 sm:justify-items-end">
          <Badge tone={organization.planTier === "Free" ? "neutral" : "brand"}>
            {t(`organization.planTiers.${organization.planTier.toLowerCase()}`)}
          </Badge>
          <span className="text-[13px] text-ink-muted">
            {t("organization.planExpires", {
              date: formatLongDate(organization.planExpiresAt, locale),
            })}
          </span>
        </div>
      </Card>
      {!canManage && (
        <p className="m-0 flex items-center gap-2 rounded-control border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
          <Lock size={15} aria-hidden="true" /> {t("organization.readOnly")}
        </p>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card aria-labelledby="organization-settings">
          <CardHeader
            titleId="organization-settings"
            title={t("organization.settings")}
            description={t("organization.onlyEditable")}
          />
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              mutations.update.mutate(name, {
                onSuccess: () => toast.success(t("organization.settingsSaved")),
                onError: (error) => toast.error(error.message),
              });
            }}
          >
            <Field label={t("organization.name")}>
              {(control) => (
                <Input
                  {...control}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  readOnly={!canManage}
                  required
                />
              )}
            </Field>
            {canManage && (
              <div>
                <Button type="submit" disabled={mutations.update.isPending}>
                  {t("common.save")}
                </Button>
              </div>
            )}
          </form>
        </Card>
        <Card aria-labelledby="organization-budget">
          <CardHeader
            titleId="organization-budget"
            title={t("organization.budget")}
            description={t("organization.budgetHint")}
          />
          <div className="mb-4 grid gap-1">
            <span className="text-[13px] font-semibold text-ink-muted">
              {t("organization.monthlyLimit")}
            </span>
            {budgetData ? (
              <Amount
                value={budgetData.amount}
                className="text-[32px] font-extrabold tracking-[-0.03em]"
              />
            ) : (
              <span className="text-xl font-bold text-ink-muted">
                {t("organization.notConfigured")}
              </span>
            )}
          </div>
          {canManage && (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                mutations.budget.mutate(Number(budget), {
                  onSuccess: () => toast.success(t("organization.budgetSaved")),
                  onError: (error) => toast.error(error.message),
                });
              }}
            >
              <Field label={t("organization.monthlyBudget")} className="min-w-0 flex-1 basis-40">
                {(control) => (
                  <Input
                    {...control}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                  />
                )}
              </Field>
              <Button type="submit" disabled={mutations.budget.isPending}>
                {t("common.update")}
              </Button>
            </form>
          )}
        </Card>
      </div>
      {isOwner && (
        <Card aria-labelledby="danger-zone" className="border-danger/30">
          <CardHeader
            titleId="danger-zone"
            title={t("organization.dangerZone")}
            description={t("organization.dangerZoneBody")}
          />
          <div className="grid">
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-4">
              <span className="grid gap-0.5">
                <strong className="text-sm">{t("organization.transferOwnership")}</strong>
                <span className="text-[13px] text-ink-muted">
                  {transferCandidates.length
                    ? t("organization.transferOwnershipBody")
                    : t("organization.transferOwnershipUnavailable")}
                </span>
              </span>
              <Button
                variant="secondary"
                disabled={!transferCandidates.length}
                onClick={() => setTransferOpen(true)}
              >
                <Crown size={16} aria-hidden="true" /> {t("organization.transfer")}
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <span className="grid gap-0.5">
                <strong className="text-sm">{t("organization.deleteOrganization")}</strong>
                <span className="text-[13px] text-ink-muted">
                  {t("organization.deleteOrganizationBody")}
                </span>
              </span>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                <Trash2 size={16} aria-hidden="true" /> {t("common.delete")}
              </Button>
            </div>
          </div>
        </Card>
      )}
      <Dialog
        open={transferOpen}
        onOpenChange={(open) => !open && closeTransfer()}
        title={t("organization.transferOwnership")}
        description={t("organization.transferDescription")}
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            confirmTransfer();
          }}
        >
          <Field label={t("organization.newOwner")}>
            {(control) => (
              <Select<string>
                id={control.id}
                value={transferTarget}
                placeholder={t("organization.chooseMember")}
                onValueChange={(value) => setTransferTarget(value)}
                options={transferCandidates.map((member) => ({
                  value: member.id,
                  label: `${member.username} · ${member.email}`,
                }))}
              />
            )}
          </Field>
          <DialogActions>
            <Button variant="ghost" onClick={closeTransfer}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!transferTarget || mutations.transferOwnership.isPending}
            >
              {t("organization.transfer")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => !open && closeDelete()}
        title={t("organization.deleteConfirmTitle", { name: organization.name })}
        description={t("organization.deleteConfirmBody")}
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            confirmDelete();
          }}
        >
          <Field label={t("organization.deleteConfirmLabel", { name: organization.name })}>
            {(control) => (
              <Input
                {...control}
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                autoComplete="off"
              />
            )}
          </Field>
          <DialogActions>
            <Button variant="ghost" onClick={closeDelete}>
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
          </DialogActions>
        </form>
      </Dialog>
    </Page>
  );
}
