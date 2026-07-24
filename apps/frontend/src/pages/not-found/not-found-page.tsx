import { ArrowRight, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/public-layout";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <PublicLayout>
      <main className="center-page">
        <div className="center-card">
          <span className="center-card__icon">
            <Search size={25} />
          </span>
          <p className="eyebrow">{t("common.notFound")}</p>
          <h1>{t("common.pageMoved")}</h1>
          <p>{t("common.findFinanceDesk")}</p>
          <Link to="/dashboard" className="button button--primary">
            {t("common.backToDesk")} <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    </PublicLayout>
  );
}
