import { Building2, Settings2, UsersRound } from "lucide-react";
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
          to="/account/organization"
          icon={Building2}
          label={t("nav.organization")}
          detail={t("more.budgetSettings")}
        />
        <QuickAction
          to="/organization/members"
          icon={UsersRound}
          label={t("nav.members")}
          detail={t("more.access")}
        />
        <QuickAction
          to="/account/settings"
          icon={Settings2}
          label={t("nav.account")}
          detail={t("more.profilePreferences")}
        />
      </div>
    </PageContainer>
  );
}
