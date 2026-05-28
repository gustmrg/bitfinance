import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router-dom";

import logoImg from "/assets/app-icon.png";
import securitySvg from "/assets/undraw_security_on_re_e491.svg";

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen antialiased md:grid md:grid-cols-2">
      <div className="hidden h-full border-r border-foreground/5 bg-muted p-10 text-muted-foreground md:flex md:flex-col md:justify-between">
        <NavLink
          to="/"
          className="flex items-center gap-3 text-lg font-medium text-foreground"
        >
          <img alt="BitFinance logo" src={logoImg} className="h-8 w-auto" />
          <span className="font-semibold">BitFinance</span>
        </NavLink>
        <div className="flex items-center justify-center">
          <img src={securitySvg} alt="" width="60%" />
        </div>
        <footer className="text-sm">
          &copy; BitFinance {new Date().getFullYear()} - {t("footer.developedBy")}{" "}
          <a
            href="https://github.com/gustmrg"
            target="_blank"
            rel="noreferrer noopener"
          >
            Gustavo Miranda
          </a>
          .
        </footer>
      </div>
      <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 md:px-10">
        <Outlet />
      </div>
    </div>
  );
}
