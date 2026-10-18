import { Globe2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/auth-provider";
import { AppIcon } from "@/components/base/app-icon";
import { buttonClasses } from "@/components/base/button-styles";

export function PublicLayout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const { status } = useAuth();
  const authenticated = status === "authenticated";
  return (
    <div className="flex min-h-dvh flex-col bg-canvas font-sans text-ink">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="BitFinance">
          <AppIcon size={32} />
          <span className="text-lg font-extrabold tracking-[-0.03em] max-sm:hidden">
            bitfinance
          </span>
        </Link>
        <nav
          aria-label={t("common.primaryNavigation")}
          className="flex items-center gap-1 sm:gap-2"
        >
          <button
            type="button"
            aria-label={t("common.language")}
            onClick={() => {
              const next = i18n.language === "en-US" ? "pt-BR" : "en-US";
              void i18n.changeLanguage(next);
              localStorage.setItem("bitfinance-locale", next);
            }}
            className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-control px-3 text-sm font-bold text-ink-muted hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Globe2 size={17} aria-hidden="true" /> {i18n.language === "en-US" ? "EN" : "PT"}
          </button>
          {authenticated ? (
            <Link to="/dashboard" className={buttonClasses({ size: "sm" })}>
              {t("home.openApp")}
            </Link>
          ) : (
            <>
              <Link to="/auth/sign-in" className={buttonClasses({ variant: "ghost", size: "sm" })}>
                {t("common.signIn")}
              </Link>
              <Link to="/auth/sign-up" className={buttonClasses({ size: "sm" })}>
                {t("common.signUp")}
              </Link>
            </>
          )}
        </nav>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      <footer className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-6 text-[13px] text-ink-muted sm:px-8">
        <span className="flex items-center gap-2">
          <AppIcon size={22} /> bitfinance
        </span>
        <span>{t("home.footer")}</span>
      </footer>
    </div>
  );
}
