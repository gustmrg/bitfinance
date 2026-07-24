import {
  Building2,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Moon,
  MoreHorizontal,
  ReceiptText,
  Settings2,
  SunMedium,
  UsersRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/auth-provider";
import { useOrganizationStore } from "@/auth/auth-store";
import { NotificationBell } from "@/components/navigation/notification-bell";
import { Avatar } from "@/components/ui/avatar";
import { BrandMark } from "@/components/ui/brand-mark";
import { IconButton } from "@/components/ui/icon-button";
import { Select } from "@/components/ui/select";
import { useOrganizationsQuery } from "@/hooks/queries/use-organization-queries";
import { useTheme } from "@/hooks/use-theme";

const navItems = [
  { to: "/dashboard", labelKey: "nav.overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/bills", labelKey: "nav.bills", icon: ReceiptText },
  { to: "/dashboard/expenses", labelKey: "nav.expenses", icon: CreditCard },
];

function OrganizationSwitcher() {
  const { user } = useAuth();
  const organizations = useOrganizationsQuery(Boolean(user));
  const selectedId = useOrganizationStore((state) => state.selectedOrganizationId);
  const setSelectedId = useOrganizationStore((state) => state.setSelectedOrganizationId);
  const items = organizations.data ?? user?.organizations ?? [];
  const { t } = useTranslation();
  return (
    <div className="org-switcher">
      <Building2 size={16} />
      <Select
        ariaLabel={t("common.selectOrganization")}
        value={selectedId ?? items[0]?.id ?? null}
        onValueChange={(value) => setSelectedId(value)}
        disabled={!items.length}
        options={items.map((item) => ({ value: item.id, label: item.name }))}
      />
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
      <Link className="user-menu" to="/account/settings">
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
          {navItems.map(({ to, labelKey, icon: Icon, end }) => (
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
          <NavLink
            to="/account/organization"
            className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}
          >
            <Building2 size={18} />
            <span>{t("nav.organization")}</span>
          </NavLink>
          <NavLink
            to="/organization/members"
            className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}
          >
            <UsersRound size={18} />
            <span>{t("nav.members")}</span>
          </NavLink>
          <NavLink
            to="/account/settings"
            className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}
          >
            <Settings2 size={18} />
            <span>{t("nav.account")}</span>
          </NavLink>
        </nav>
        <div className="sidebar__footer">
          <div className="sidebar__signal">
            <CircleDollarSign size={18} />
            <span>
              <strong>{t("common.cashFlow")}</strong>
              <small>{t("common.healthyThisMonth")}</small>
            </span>
            <span className="signal-dot" />
          </div>
          <UserMenu />
        </div>
      </aside>
      <main className="main-content">
        <div className="mobile-topbar">
          <BrandMark />
          <div className="mobile-topbar__actions">
            <OrganizationSwitcher />
            <ThemeSwitcher />
            <NotificationBell />
          </div>
        </div>
        <header className="content-topbar">
          <div className="content-topbar__crumb">
            <span className="live-dot" />
            {t("common.liveWorkspace")} <span>/</span>{" "}
            {location.pathname.includes("bills")
              ? t("nav.bills")
              : location.pathname.includes("expenses")
                ? t("nav.expenses")
                : location.pathname.includes("organization")
                  ? t("nav.organization")
                  : t("nav.overview")}
          </div>
          <div className="content-topbar__actions">
            <ThemeSwitcher />
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
            to="/account/more"
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
