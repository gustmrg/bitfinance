import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { buttonClasses } from "@/components/base/button-styles";
import { CenterCard } from "@/components/layout/center-card";
import { PublicLayout } from "@/components/layout/public-layout";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <PublicLayout>
      <CenterCard
        icon={<Search size={22} aria-hidden="true" />}
        title={t("common.pageMoved")}
        description={t("common.findFinanceDesk")}
      >
        <Link to="/dashboard" className={buttonClasses({ fullWidth: true })}>
          {t("common.backToDesk")}
        </Link>
      </CenterCard>
    </PublicLayout>
  );
}
