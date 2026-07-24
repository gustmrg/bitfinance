import { ArrowUpRight, Building2, Check, CircleDollarSign, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageContainer } from "@/components/layout/page-container";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { formatCurrency, formatLongDate } from "@/lib/format";
import { useOrganizationMutations } from "@/hooks/mutations/use-organization-mutations";
import { useBudgetQuery, useOrganizationQuery } from "@/hooks/queries/use-organization-queries";
import { useLocale } from "@/hooks/use-locale";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";

export function OrganizationPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const organizationId = useSelectedOrganization();
  const detail = useOrganizationQuery(organizationId);
  const budgetQuery = useBudgetQuery(organizationId);
  const mutations = useOrganizationMutations(organizationId);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
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
  return (
    <PageContainer>
      <PageHeader
        eyebrow={t("organization.eyebrow")}
        title={t("organization.title")}
        description={t("organization.body")}
        actions={
          <Link to="/organization/members" className="button button--secondary">
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
                <input value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
              <Button type="submit" disabled={mutations.update.isPending}>
                {t("common.save")} <Check size={16} />
              </Button>
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
            <div className="budget-card__footer">
              <span>
                <CircleDollarSign size={15} /> {t("organization.dashboardUpdate")}
              </span>
            </div>
          </section>
        </div>
        <section className="surface-card organization-members-preview">
          <SectionHeading
            title={t("organization.members")}
            description={t("organization.memberBody")}
            action={
              <Link to="/organization/members" className="inline-link">
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
      </div>
    </PageContainer>
  );
}
