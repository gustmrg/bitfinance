import { BarChart3, Building2, Repeat, Settings2, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { QuickAction } from "@/components/ui/quick-action";

export function MorePage() {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageHeader
        eyebrow={t("more.eyebrow")}
        title={t("more.title")}
        description={t("more.body")}
      />
      <div className="more-grid">
        <QuickAction
          to="/recurrences"
          icon={Repeat}
          label={t("nav.recurrences")}
          detail={t("more.recurrences")}
        />
        <QuickAction
          to="/reports"
          icon={BarChart3}
          label={t("nav.reports")}
          detail={t("more.reports")}
        />
        <QuickAction
          to="/settings/organization"
          icon={Building2}
          label={t("nav.organization")}
          detail={t("more.budgetSettings")}
        />
        <QuickAction
          to="/settings/members"
          icon={UsersRound}
          label={t("nav.members")}
          detail={t("more.access")}
        />
        <QuickAction
          to="/settings/account"
          icon={Settings2}
          label={t("nav.account")}
          detail={t("more.profilePreferences")}
        />
      </div>
    </PageContainer>
  );
}
