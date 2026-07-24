import { Globe2 } from "lucide-react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BrandMark } from "@/components/ui/brand-mark";

export function PublicLayout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  return (
    <div className="public-shell">
      <header className="public-nav">
        <BrandMark />
        <div className="public-nav__actions">
          <button
            className="language-switch"
            onClick={() => {
              const next = i18n.language === "en-US" ? "pt-BR" : "en-US";
              void i18n.changeLanguage(next);
              localStorage.setItem("bitfinance-locale", next);
            }}
          >
            <Globe2 size={15} /> {i18n.language === "en-US" ? "EN" : "PT"}
          </button>
          <Link to="/auth/sign-in" className="text-link">
            {t("common.signIn")}
          </Link>
          <Link to="/auth/sign-up" className="button button--primary button--small">
            {t("common.signUp")}
          </Link>
        </div>
      </header>
      {children}
      <footer className="public-footer">
        <BrandMark />
        <span>{t("home.footer")}</span>
      </footer>
    </div>
  );
}
