import {
  BarChart3,
  Building2,
  CreditCard,
  Globe2,
  LayoutDashboard,
  LogOut,
  Moon,
  MoreHorizontal,
  ReceiptText,
  Repeat,
  SunMedium,
  UsersRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, matchPath, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/auth-provider";
import { useOrganizationStore } from "@/auth/auth-store";
import { NotificationBell } from "@/components/navigation/notification-bell";
import { Avatar } from "@/components/ui/avatar";
import { BrandMark } from "@/components/ui/brand-mark";
import { IconButton } from "@/components/ui/icon-button";
import { Select } from "@/components/ui/select";
import { useOrganizationsQuery } from "@/hooks/queries/use-organization-queries";
import { useTheme } from "@/hooks/use-theme";

type NavItem = { to: string; labelKey: string; icon: typeof LayoutDashboard; end?: boolean };

const navItems: NavItem[] = [
  { to: "/dashboard", labelKey: "nav.overview", icon: LayoutDashboard, end: true },
  { to: "/bills", labelKey: "nav.bills", icon: ReceiptText },
  { to: "/expenses", labelKey: "nav.expenses", icon: CreditCard },
];

const insightNavItems: NavItem[] = [
  { to: "/recurrences", labelKey: "nav.recurrences", icon: Repeat },
  { to: "/reports", labelKey: "nav.reports", icon: BarChart3 },
];

const settingsNavItems: NavItem[] = [
  { to: "/settings/organization", labelKey: "nav.organization", icon: Building2 },
  { to: "/settings/members", labelKey: "nav.members", icon: UsersRound },
];

const breadcrumbs = [
  { path: "/dashboard", labelKey: "nav.overview" },
  { path: "/bills/*", labelKey: "nav.bills" },
  { path: "/expenses/*", labelKey: "nav.expenses" },
  { path: "/recurrences", labelKey: "nav.recurrences" },
  { path: "/reports", labelKey: "nav.reports" },
  { path: "/settings/organization", labelKey: "nav.organization" },
  { path: "/settings/members", labelKey: "nav.members" },
  { path: "/settings/account", labelKey: "nav.account" },
  { path: "/settings", labelKey: "nav.settings" },
];

function breadcrumbLabelKey(pathname: string) {
  return breadcrumbs.find(({ path }) => matchPath(path, pathname))?.labelKey ?? "nav.overview";
}

function OrganizationSwitcher() {
  const { user } = useAuth();
  const organizations = useOrganizationsQuery(Boolean(user));
  const selectedId = useOrganizationStore((state) => state.selectedOrganizationId);
  const setSelectedId = useOrganizationStore((state) => state.setSelectedOrganizationId);
  const items = organizations.data ?? user?.organizations ?? [];
  const { t } = useTranslation();
  const activeId = selectedId ?? items[0]?.id ?? null;
  const activePlan = items.find((item) => item.id === activeId)?.planTier;
  return (
    <div className="org-switcher">
      <Building2 size={16} />
      <Select
        ariaLabel={t("common.selectOrganization")}
        value={activeId}
        onValueChange={(value) => setSelectedId(value)}
        disabled={!items.length}
        options={items.map((item) => ({ value: item.id, label: item.name }))}
      />
      {activePlan && (
        <span className={`plan-badge plan-badge--${activePlan.toLowerCase()}`}>
          {t(`organization.planTiers.${activePlan.toLowerCase()}`)}
        </span>
      )}
    </div>
  );
}

function ThemeSwitcher() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const label = t("common.theme");
  return (
    <IconButton label={label} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? <SunMedium size={18} /> : <Moon size={18} />}
    </IconButton>
  );
}

function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const label = t("common.language");
  return (
    <IconButton
      label={label}
      onClick={() => {
        const next = i18n.language === "en-US" ? "pt-BR" : "en-US";
        void i18n.changeLanguage(next);
        localStorage.setItem("bitfinance-locale", next);
      }}
    >
      <Globe2 size={18} />
    </IconButton>
  );
}

function UserMenu() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const initials = user.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <div className="sidebar-user">
      <Link className="user-menu" to="/settings/account" aria-label={t("nav.account")}>
        <Avatar initials={initials} src={user.avatarUrl ?? undefined} size="sm" />
        <span>
          <strong>{user.fullName}</strong>
          <small>{user.email}</small>
        </span>
      </Link>
      <IconButton
        className="sidebar-user__logout"
        label={t("account.signOut")}
        onClick={() => {
          void signOut().finally(() => navigate("/auth/sign-in"));
        }}
      >
        <LogOut size={16} />
      </IconButton>
    </div>
  );
}

export function AppShell() {
  const { t } = useTranslation();
  const location = useLocation();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <BrandMark compact />
          <span className="sidebar__brand-label">{t("common.financeDesk")}</span>
        </div>
        <div className="sidebar__org">
          <OrganizationSwitcher />
        </div>
        <nav className="sidebar__nav" aria-label={t("common.primaryNavigation")}>
          <p className="sidebar__section-label">{t("common.workspace")}</p>
          {[...navItems, ...insightNavItems].map(({ to, labelKey, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}
            >
              <Icon size={18} />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
          <p className="sidebar__section-label sidebar__section-label--spaced">
            {t("common.workspaceSettings")}
          </p>
          {settingsNavItems.map(({ to, labelKey, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}
            >
              <Icon size={18} />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">
          <UserMenu />
        </div>
      </aside>
      <main className="main-content">
        <div className="mobile-topbar">
          <BrandMark />
          <div className="mobile-topbar__actions">
            <OrganizationSwitcher />
            <ThemeSwitcher />
            <LanguageSwitcher />
            <NotificationBell />
          </div>
        </div>
        <header className="content-topbar">
          <div className="content-topbar__crumb">
            <span className="live-dot" />
            {t("common.liveWorkspace")} <span>/</span> {t(breadcrumbLabelKey(location.pathname))}
          </div>
          <div className="content-topbar__actions">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <NotificationBell />
          </div>
        </header>
        <div className="content-scroll">
          <Outlet />
        </div>
        <nav className="mobile-bottom-nav" aria-label={t("common.mobileNavigation")}>
          {navItems.map(({ to, labelKey, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `mobile-nav-link ${isActive ? "mobile-nav-link--active" : ""}`
              }
            >
              <Icon size={20} />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `mobile-nav-link ${isActive ? "mobile-nav-link--active" : ""}`
            }
          >
            <MoreHorizontal size={20} />
            <span>{t("common.more")}</span>
          </NavLink>
        </nav>
      </main>
    </div>
  );
}
