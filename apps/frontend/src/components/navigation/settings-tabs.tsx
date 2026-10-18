import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";

const tabs = [
  { to: "/settings/organization", labelKey: "nav.organization" },
  { to: "/settings/members", labelKey: "nav.members" },
  { to: "/settings/account", labelKey: "nav.account" },
];

export function SettingsTabs() {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t("nav.settings")}
      className="flex max-w-full overflow-x-auto border-b border-line"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            cn(
              "-mb-px inline-flex h-11 shrink-0 items-center border-b-2 px-4 text-sm font-bold transition-colors",
              "focus-visible:outline-2 focus-visible:outline-brand",
              isActive
                ? "border-brand text-brand-ink"
                : "border-transparent text-ink-muted hover:text-ink",
            )
          }
        >
          {t(tab.labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
